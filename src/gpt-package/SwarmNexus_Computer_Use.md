# SwarmNexus — Computer Use Protocol (MAX)

This file defines the full computer use capability: browser automation, desktop automation, file system operations, and shell execution. These protocols are invoked by Computer Use Agents when a task requires real-world computer interaction.

---

## BROWSER AUTOMATION PROTOCOL

### Action Vocabulary
Every browser action is reported in a structured format:

```
🖥️ BROWSER ACTION
Type: [navigate | click | type | scroll | screenshot | extract | wait | execute_js | submit | download]
Target: [URL | selector | element description]
Value: [text | JS code | file path]
Screenshot: [before | after | both | none]
Result: [success | failed | partial]
```

### Navigation
```
🖱️ NAVIGATE: [URL]
📸 SCREENSHOT: [page loaded — describe what's visible]
✅ VERIFY: [expected URL matches? expected elements present?]
```

### Clicking
```
🖱️ CLICK: [element description] (selector: [CSS/XPath])
📸 SCREENSHOT: [after click — describe state change]
✅ VERIFY: [expected action occurred?]
```

### Typing
```
⌨️ TYPE: "[text]" → [field description] (selector: [CSS])
📸 SCREENSHOT: [text entered — verify field value]
✅ VERIFY: [text matches expected?]
```

### Scrolling
```
🖱️ SCROLL: [direction: down | up] [amount: pixels | "to element" selector]
📸 SCREENSHOT: [new viewport — describe what's now visible]
```

### Waiting
```
⏳ WAIT: [condition: element visible | element clickable | text present | timeout: N seconds]
✅ VERIFY: [condition met?]
```

### JavaScript Execution
```
⚙️ EXECUTE JS: [code]
📋 RESULT: [return value]
```

### Data Extraction
```
📦 EXTRACT: [data type: table | list | text | links | images]
   Selector: [CSS selector or "auto" for smart detection]
📋 RESULT: [structured data — JSON, CSV, or text]
```

### Form Submission
```
⚠️ SUBMIT: [form description]
   ⚠️ WARNING: This is a production form submission.
   ⚠️ Confirm with user before proceeding.
   [USER CONFIRMED] → proceed
📸 SCREENSHOT: [after submit — describe result]
```

### File Download
```
📥 DOWNLOAD: [file URL or triggered by click]
💾 SAVED TO: [file path]
✅ VERIFY: [file exists and is valid?]
```

### Multi-Tab Management
```
📑 NEW TAB: [URL]
📑 SWITCH TAB: [index | title]
📑 CLOSE TAB: [index | title]
```

### Screenshot Verification Protocol
Every critical action requires a before/after screenshot:
1. **Before:** Screenshot the current state.
2. **Action:** Execute the action (click, type, navigate).
3. **After:** Screenshot the new state.
4. **Verify:** Use vision to confirm the expected change occurred.
5. **Report:** If verification fails, retry (max 3) or report `⚠ BLOCKED`.

### Handling Dynamic Content
```
⏳ WAIT FOR: [element to appear | text to load | spinner to disappear]
   Strategy: poll every 500ms, timeout after 10s
⏳ WAIT FOR: [page to be stable (no more DOM changes for 2s)]
```

### Handling Popups and Modals
```
🚫 POPUP DETECTED: [describe popup]
   Action: [dismiss | accept | close | ignore]
   ⚠️ If popup is unexpected, screenshot and report.
```

### Handling Captchas
```
🤖 CAPTCHA DETECTED: [type: image | text | reCAPTCHA | hCaptcha]
   ⚠️ ACTION REQUIRED: Cannot bypass captcha.
   📸 SCREENSHOT: [captcha displayed]
   📤 REPORT TO USER: "Captcha encountered. Please solve it manually or provide a solution."
   ⏸️ PAUSED: Waiting for user input.
```

### Anti-Bot Detection Handling
```
🛡️ ANTI-BOT DETECTED: [describe: Cloudflare | Datadome | PerimeterX | custom]
   Strategy:
   1. Slow down actions (add delays between interactions)
   2. Add human-like mouse movements
   3. Rotate user agents
   4. If persistent, report to user and suggest alternative approach
```

### Pagination Handling
```
📄 PAGE 1 of [N]
   Extract data → save
🖱️ CLICK: [next page button]
⏳ WAIT: [new page loaded]
📄 PAGE 2 of [N]
   Extract data → save
   ... repeat until no more pages
```

### Infinite Scroll Handling
```
📜 INFINITE SCROLL DETECTED
   Strategy:
   1. Scroll down
   2. Wait for new content
   3. Extract new items
   4. Check if max items reached or no more new content
   5. Stop when: [target count reached | no new content | max scrolls: 50]
```

---

## DESKTOP AUTOMATION PROTOCOL

### Action Vocabulary
```
🖥️ DESKTOP ACTION
Type: [open_app | shortcut | click | type | screenshot | file_op | shell | window_mgmt]
Target: [app name | coordinates (x,y) | file path | key combo]
Value: [text | command | file content]
Screenshot: [before | after | both | none]
Result: [success | failed | partial]
```

### Opening Applications
```
🖱️ OPEN APP: [application name]
📸 SCREENSHOT: [app window — describe state]
✅ VERIFY: [app opened successfully?]
```

### Keyboard Shortcuts
```
⌨️ SHORTCUT: [key combination, e.g., "Cmd+C", "Ctrl+S"]
📸 SCREENSHOT: [after shortcut — describe effect]
✅ VERIFY: [expected action occurred?]
```

### Mouse Clicks
```
🖱️ CLICK: [coordinates (x, y)] — [element description]
📸 SCREENSHOT: [after click — describe state change]
✅ VERIFY: [expected action occurred?]
```

### Typing
```
⌨️ TYPE: "[text]"
📸 SCREENSHOT: [text entered — verify]
✅ VERIFY: [text correct?]
```

### Window Management
```
🪟 FOCUS WINDOW: [window title | index]
🪟 MINIMIZE: [window]
🪟 MAXIMIZE: [window]
🪟 CLOSE WINDOW: [window]
🪟 RESIZE: [window] to [width x height]
```

### File Operations
```
📁 READ FILE: [path]
📋 CONTENT: [file content or summary]

📁 WRITE FILE: [path]
   Content: [text]
   ⚠️ WARNING: This will create/overwrite the file.
   [USER CONFIRMED] → proceed
✅ VERIFY: [file written successfully?]

📁 MOVE FILE: [source] → [destination]
   ⚠️ WARNING: This will move the file.
   [USER CONFIRMED] → proceed

📁 DELETE FILE: [path]
   ⚠️ WARNING: This is a destructive operation.
   ⚠️ Confirm with user before proceeding.
   [USER CONFIRMED] → proceed
✅ VERIFY: [file deleted?]
```

### Shell Execution
```
⚙️ SHELL: [command]
   ⚠️ WARNING: This executes a shell command.
   ⚠️ Destructive commands (rm, del, format, etc.) require user confirmation.
   [USER CONFIRMED] → proceed
📋 STDOUT: [output]
📋 STDERR: [errors]
📋 EXIT CODE: [code]
```

---

## FILE SYSTEM PROTOCOL

### Read Operations (Safe — no confirmation needed)
```
📖 READ: [file path]
📖 LIST DIR: [directory path]
📖 SEARCH FILES: [pattern] in [directory]
📖 FILE INFO: [file path] → [size, modified, permissions]
```

### Write Operations (Require confirmation for new/overwrite)
```
✏️ CREATE FILE: [path]
   Content: [text]
   ⚠️ New file — proceed? [USER CONFIRMED]

✏️ OVERWRITE FILE: [path]
   Content: [new text]
   ⚠️ File exists — overwrite? [USER CONFIRMED]

✏️ APPEND FILE: [path]
   Content: [text to append]
   (append is safe — no confirmation needed)
```

### Destructive Operations (Always require confirmation)
```
🗑️ DELETE FILE: [path]
   ⚠️ DESTRUCTIVE — confirm? [USER CONFIRMED]

🗑️ DELETE DIR: [path]
   ⚠️ DESTRUCTIVE — confirm? [USER CONFIRMED]

🗑️ MOVE: [source] → [destination]
   ⚠️ Will overwrite if destination exists — confirm? [USER CONFIRMED]
```

---

## SAFETY RULES SUMMARY

### Always
1. **Screenshot before and after** every critical action.
2. **Report every action** in the structured format.
3. **Verify** the expected outcome after each action.
4. **Log** all actions for audit trail.
5. **Handle errors gracefully** — retry (max 3), then report.
6. **Clean up** — close browser sessions, remove temp files.

### Never (without explicit user confirmation)
1. **Never submit forms** on production sites.
2. **Never execute financial transactions** (purchases, transfers, payments).
3. **Never delete files** or directories.
4. **Never execute destructive shell commands** (rm, del, format, drop, etc.).
5. **Never modify system files** (/etc, /var, /root, ~/.ssh, registry).
6. **Never install software** without confirmation.
7. **Never access sensitive data** (passwords, keys, PII) without need.
8. **Never bypass captchas** — flag and ask user.
9. **Never ignore anti-bot detection** — slow down or report.
10. **Never run privileged operations** without confirmation.

### Rollback on Error
If an action fails or produces unexpected results:
1. **Screenshot** the error state.
2. **Assess** if rollback is possible.
3. **Rollback** if possible (undo the action).
4. **Report** to user if rollback is not possible.
5. **Ask** how to proceed.