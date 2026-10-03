#!/usr/bin/env python3
"""Strategic operator companion — Docker/cloud headless mode.
Polls the owned backend for queued commands and executes browser actions.
Desktop GUI actions (click/type/screenshot) require a native desktop run;
in Docker, only browser_* and phone_* (if adb connected) actions work.
"""
import base64, datetime, io, json, os, pathlib, platform, re, sqlite3, subprocess, sys, time, urllib.request, urllib.error, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent
ALLOW_INPUT = os.environ.get('OPERATOR_ALLOW_INPUT', 'true').lower() == 'true'

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise RuntimeError('Redirect refused. Use the service\'s final HTTPS address.')

def http(url, payload=None, headers=None, method=None):
    request = urllib.request.Request(url, data=None if payload is None else json.dumps(payload).encode(),
        headers={'Content-Type':'application/json', **(headers or {})}, method=method)
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=40) as response:
            raw = response.read(8*1024*1024+1)
            if len(raw) > 8*1024*1024: raise RuntimeError('Response exceeds 8 MB.')
            result = json.loads(raw)
            if isinstance(result, dict) and result.get('error'): raise RuntimeError(str(result['error'])[:500])
            return result
    except urllib.error.HTTPError as error:
        message = error.read(2000).decode(errors='replace')
        raise RuntimeError('HTTP ' + str(error.code) + ': ' + message[:500]) from None

def safe_url(value):
    value = str(value)[:2000]
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('Use HTTP(S) without embedded credentials.')
    return value

def browser(action, args):
    url = os.environ.get('OPERATOR_BROWSER_URL', '').rstrip('/')
    key = os.environ.get('OPERATOR_BROWSER_KEY', '')
    if not url or not key: raise RuntimeError('Set OPERATOR_BROWSER_URL and OPERATOR_BROWSER_KEY for Cloud Browser actions.')
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != 'https' and not (parsed.scheme == 'http' and parsed.hostname in ('127.0.0.1', 'localhost', '::1')):
        raise ValueError('Browser engine requires HTTPS, except localhost.')
    headers = {'x-api-key': key}
    if action == 'browser_health': return http(url + '/health', headers=headers)
    if action == 'browser_start': return http(url + '/sessions', {}, headers)
    sid = str(args.get('session_id', ''))[:100]
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', sid): raise ValueError('Invalid session ID.')
    if action == 'browser_close': return http(url + '/sessions/' + sid, headers=headers, method='DELETE')
    kind = args.get('action_type')
    if kind not in ('goto', 'click', 'fill', 'press', 'scroll'): raise ValueError('Unsupported browser action.')
    data = {'action_type': kind, 'options': {'timeout': 15000}}
    if kind in ('click', 'fill'): data['selector'] = str(args.get('selector', ''))[:500]
    if kind in ('goto', 'fill', 'press', 'scroll'): data['value'] = safe_url(args.get('value')) if kind == 'goto' else str(args.get('value', ''))[:1000]
    return http(url + '/sessions/' + sid + '/execute', data, headers)

def execute(action, args):
    if not isinstance(args, dict): raise ValueError('Arguments must be an object.')
    if action.startswith('browser_'): return browser(action, args)
    if action == 'screen_info':
        return {'width': 0, 'height': 0, 'cursor_x': 0, 'cursor_y': 0, 'platform': platform.system(),
                'input_allowed': ALLOW_INPUT, 'docker_mode': True, 'note': 'GUI actions require native desktop run.'}
    if action == 'open_url':
        import webbrowser
        if not webbrowser.open(safe_url(args.get('url')), new=2): raise RuntimeError('No browser available in Docker.')
        return {'ok': True, 'action': action}
    raise ValueError(f'Action {action} not available in Docker headless mode. Run companion natively for desktop control.')

def run_worker():
    endpoint = os.environ.get('OPERATOR_ENDPOINT', '')
    token = os.environ.get('OPERATOR_TOKEN', '')
    device = os.environ.get('OPERATOR_DEVICE_ID', '')
    # Fall back to operator-device.json if mounted
    config_path = ROOT / 'operator-device.json'
    if not endpoint and config_path.exists():
        config = json.loads(config_path.read_text())
        endpoint = config.get('endpoint', '')
        token = config.get('token', '')
        device = config.get('device_id', '')

    parsed = urllib.parse.urlparse(endpoint)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('OPERATOR_ENDPOINT must be HTTPS.')
    if not re.fullmatch(r'[a-f0-9]{64}', token): raise ValueError('Invalid pairing token.')
    if not device: raise ValueError('OPERATOR_DEVICE_ID is required.')

    database = sqlite3.connect(str(ROOT / 'operator-receipts.sqlite3'))
    database.execute('CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY, success INTEGER, result TEXT, reported INTEGER DEFAULT 0, lease TEXT)')
    database.commit()

    def call(operation, **values):
        return http(endpoint, {'operation': operation, 'device_id': device, **values}, {'x-operator-token': token})

    print(f'Operator companion (Docker) connected. Device: {device[:8]}…', file=sys.stderr)
    failures = 0
    while True:
        try:
            for saved_id, saved_success, saved_result, saved_lease in database.execute(
                'SELECT id,success,result,lease FROM receipts WHERE reported=0 AND lease IS NOT NULL').fetchall():
                try:
                    call('complete', command_id=saved_id, lease=saved_lease, success=bool(saved_success),
                         uncertain=saved_result.startswith('Execution started;'), result=saved_result)
                    database.execute('UPDATE receipts SET reported=1 WHERE id=?', (saved_id,)); database.commit()
                except Exception as error:
                    if str(error).startswith(('HTTP 401:', 'HTTP 403:', 'HTTP 404:')): raise
                    break

            response = call('poll', platform=platform.system(),
                           input_allowed=ALLOW_INPUT,
                           browser_configured=bool(os.environ.get('OPERATOR_BROWSER_URL') and os.environ.get('OPERATOR_BROWSER_KEY')))
            command = response.get('command')
            if command:
                cid = command['id']; lease = command['lease']
                previous = database.execute('SELECT success,result FROM receipts WHERE id=?', (cid,)).fetchone()
                if previous:
                    success, result = previous
                else:
                    allowed = call('authorize', command_id=cid, lease=lease).get('allowed')
                    if not allowed:
                        success, result = 0, 'Device paused, command expired, or access revoked before execution.'
                    else:
                        database.execute('INSERT INTO receipts(id,success,result,lease) VALUES(?,?,?,?)',
                                        (cid, 0, 'Execution started; result unknown. Inspect before repeating.', lease))
                        database.commit()
                        print('Running ' + command['action'] + ' (' + cid + ')', file=sys.stderr)
                        try:
                            result = json.dumps(execute(command['action'], command.get('arguments', {})), ensure_ascii=True)[:4900]
                            success = 1
                        except Exception as error:
                            success = 0; result = str(error)[:4900]
                    database.execute('INSERT OR REPLACE INTO receipts(id,success,result,reported,lease) VALUES(?,?,?,0,?)',
                                    (cid, success, result, lease)); database.commit()
                for attempt in range(5):
                    try:
                        call('complete', command_id=cid, lease=lease, success=bool(success), result=result)
                        database.execute('UPDATE receipts SET reported=1 WHERE id=?', (cid,)); database.commit(); break
                    except Exception:
                        if attempt == 4: raise
                        time.sleep(2)
            failures = 0; time.sleep(5)
        except KeyboardInterrupt:
            print('Operator stopped.', file=sys.stderr); return
        except Exception as error:
            failures += 1; print('Connection warning: ' + str(error)[:500], file=sys.stderr)
            if str(error).startswith('HTTP 401:'):
                print('Pairing expired or revoked. Create a new pairing.', file=sys.stderr); return
            time.sleep(min(60, 5 * failures))

if __name__ == '__main__':
    if '--print-mcp-config' in sys.argv:
        mcp = {'mcpServers': {'strategic-operator': {'command': 'python3', 'args': [str(ROOT / 'operator_companion.py'), '--mcp']}}}
        print(json.dumps(mcp, indent=2))
    elif '--worker' in sys.argv:
        run_worker()
    else:
        print('Usage: operator_companion.py --worker | --print-mcp-config', file=sys.stderr)