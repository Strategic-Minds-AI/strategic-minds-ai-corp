$ErrorActionPreference = 'Continue'
$Railway = Join-Path $env:APPDATA 'npm\railway.cmd'
$Project = '15f90272-e2f6-4739-8286-91447f545d71'
$Environment = '24636941-7db3-4218-bfbf-e8388b41f41b'
$ReceiptRoot = 'C:\_Strategic_Minds_AI_OS\03_Bridge_Receipts\sync\railway'
$Checkpoint = 'strategic-minds-sync-base'
New-Item -ItemType Directory -Force -Path $ReceiptRoot | Out-Null
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$receiptPath = Join-Path $ReceiptRoot ($stamp + '-railway-sandbox.json')
if (-not (Test-Path $Railway)) { throw 'RAILWAY_CLI_NOT_FOUND' }
& $Railway whoami 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
  [ordered]@{status='BLOCKED';reason='RAILWAY_CLI_AUTH_REQUIRED';project_id=$Project;environment_id=$Environment;timestamp=$stamp} |
    ConvertTo-Json | Set-Content -Encoding UTF8 $receiptPath
  exit 10
}
$baseJson = & $Railway sandbox create -p $Project -e $Environment --idle-timeout-minutes 5 --json
if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_SANDBOX_CREATE_FAILED' }
$base = $baseJson | ConvertFrom-Json
& $Railway sandbox checkpoint create $Checkpoint -p $Project -e $Environment --id $base.id --json | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_CHECKPOINT_FAILED' }
$forkJson = & $Railway sandbox fork $base.id -p $Project -e $Environment --idle-timeout-minutes 5 --json
if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_SANDBOX_FORK_FAILED' }
$fork = $forkJson | ConvertFrom-Json
$probe = (& $Railway sandbox exec --id $fork.id -p $Project -e $Environment -- pwd 2>&1) -join [Environment]::NewLine
$receipt = [ordered]@{status='PASS';timestamp=$stamp;project_id=$Project;environment_id=$Environment;base_sandbox_id=$base.id;checkpoint=$Checkpoint;clone_sandbox_id=$fork.id;idle_timeout_minutes=5;network_mode='isolated';secrets_seeded=$false;probe=$probe}
$receipt | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 $receiptPath
$receipt | ConvertTo-Json -Depth 4
