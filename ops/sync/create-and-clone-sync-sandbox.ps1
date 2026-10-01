$ErrorActionPreference = 'Continue'
$Railway = Join-Path $env:APPDATA 'npm\railway.cmd'
$Project = '15f90272-e2f6-4739-8286-91447f545d71'
$Environment = '24636941-7db3-4218-bfbf-e8388b41f41b'
$ReceiptRoot = 'C:\_Strategic_Minds_AI_OS\03_Bridge_Receipts\sync\railway'
$Checkpoint = 'strategic-minds-sync-base'
New-Item -ItemType Directory -Force -Path $ReceiptRoot | Out-Null
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$receiptPath = Join-Path $ReceiptRoot ($stamp + '-railway-sandbox.json')

function Write-Receipt([string]$Status,[string]$Reason,[object]$Base,[object]$Fork,[object]$Extra) {
  $r = [ordered]@{
    status=$Status; reason=$Reason; timestamp=$stamp
    project_id=$Project; environment_id=$Environment
    base_sandbox_id=$(if($Base){$Base.id}else{$null})
    checkpoint=$Checkpoint
    clone_sandbox_id=$(if($Fork){$Fork.id}else{$null})
    idle_timeout_minutes=5; network_mode='isolated'; secrets_seeded=$false
    detail=$Extra
  }
  $r | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $receiptPath
  $r | ConvertTo-Json -Depth 6
}

function Wait-Sandbox([string]$Id,[int]$Attempts=45) {
  for($i=1; $i -le $Attempts; $i++) {
    & $Railway sandbox exec --id $Id -p $Project -e $Environment --timeout 10 -- sh -lc 'printf READY' 1>$null 2>$null
    if($LASTEXITCODE -eq 0) { return $true }
    Start-Sleep -Seconds 2
  }
  return $false
}

if (-not (Test-Path $Railway)) { throw 'RAILWAY_CLI_NOT_FOUND' }
& $Railway whoami 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Receipt 'BLOCKED' 'RAILWAY_CLI_AUTH_REQUIRED' $null $null $null | Out-Null
  exit 10
}

$base = $null
$fork = $null
try {
  $baseJson = & $Railway sandbox create -p $Project -e $Environment --idle-timeout-minutes 5 --json
  if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_SANDBOX_CREATE_FAILED' }
  $base = $baseJson | ConvertFrom-Json
  if (-not $base.id) { throw 'RAILWAY_SANDBOX_ID_MISSING' }

  if (-not (Wait-Sandbox $base.id)) { throw 'RAILWAY_SANDBOX_NOT_READY' }

  & $Railway sandbox checkpoint create $Checkpoint -p $Project -e $Environment --id $base.id --json 1>$null
  if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_CHECKPOINT_FAILED' }

  $forkJson = & $Railway sandbox fork $base.id -p $Project -e $Environment --idle-timeout-minutes 5 --json
  if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_SANDBOX_FORK_FAILED' }
  $fork = $forkJson | ConvertFrom-Json
  if (-not $fork.id) { throw 'RAILWAY_FORK_ID_MISSING' }
  if (-not (Wait-Sandbox $fork.id)) { throw 'RAILWAY_FORK_NOT_READY' }

  $probe = (& $Railway sandbox exec --id $fork.id -p $Project -e $Environment --timeout 20 -- sh -lc 'printf "READY:%s\n" "$(pwd)"' 2>&1) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_FORK_PROBE_FAILED' }

  Write-Receipt 'PASS' 'SANDBOX_CHECKPOINT_FORK_VALIDATED' $base $fork $probe
  exit 0
}
catch {
  $reason = $_.Exception.Message
  Write-Receipt 'FAIL' $reason $base $fork $null | Out-Null
  throw
}