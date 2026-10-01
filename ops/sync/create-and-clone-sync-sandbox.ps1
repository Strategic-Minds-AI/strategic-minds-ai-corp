$ErrorActionPreference = 'Continue'
$Railway = Join-Path $env:APPDATA 'npm\railway.cmd'
$Project = '15f90272-e2f6-4739-8286-91447f545d71'
$Environment = 'd829fb35-5cdf-47a2-bd4f-134a1cf336d4'
$ReceiptRoot = 'C:\_Strategic_Minds_AI_OS\03_Bridge_Receipts\sync\railway'
New-Item -ItemType Directory -Force -Path $ReceiptRoot | Out-Null
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$receiptPath = Join-Path $ReceiptRoot ($stamp + '-railway-sandbox.json')

function Write-Receipt([string]$Status,[string]$Reason,[object]$Base,[object]$Fork,[object]$Detail) {
  $r = [ordered]@{
    status=$Status; reason=$Reason; timestamp=$stamp
    project_id=$Project; environment_id=$Environment
    base_sandbox_id=$(if($Base){$Base.id}else{$null})
    clone_sandbox_id=$(if($Fork){$Fork.id}else{$null})
    idle_timeout_minutes=5
    network_mode='isolated'
    secrets_seeded=$false
    checkpoint_used=$false
    detail=$Detail
  }
  $r | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $receiptPath
  $r | ConvertTo-Json -Depth 8
}

function Get-SandboxSnapshot {
  try {
    return ((& $Railway sandbox list -p $Project -e $Environment --all --json 2>&1) -join [Environment]::NewLine)
  } catch {
    return 'SANDBOX_LIST_FAILED'
  }
}

function Wait-Sandbox([string]$Id,[int]$Attempts=90) {
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

  if (-not (Wait-Sandbox $base.id)) {
    Write-Receipt 'FAIL' 'RAILWAY_SANDBOX_NOT_READY' $base $null (Get-SandboxSnapshot) | Out-Null
    throw 'RAILWAY_SANDBOX_NOT_READY'
  }

  $forkJson = & $Railway sandbox fork $base.id -p $Project -e $Environment --idle-timeout-minutes 5 --json
  if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_SANDBOX_FORK_FAILED' }
  $fork = $forkJson | ConvertFrom-Json
  if (-not $fork.id) { throw 'RAILWAY_FORK_ID_MISSING' }

  if (-not (Wait-Sandbox $fork.id)) {
    Write-Receipt 'FAIL' 'RAILWAY_FORK_NOT_READY' $base $fork (Get-SandboxSnapshot) | Out-Null
    throw 'RAILWAY_FORK_NOT_READY'
  }

  $probe = (& $Railway sandbox exec --id $fork.id -p $Project -e $Environment --timeout 20 -- sh -lc 'printf "READY:%s\n" "$(pwd)"' 2>&1) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) { throw 'RAILWAY_FORK_PROBE_FAILED' }

  Write-Receipt 'PASS' 'SANDBOX_FORK_VALIDATED' $base $fork $probe
  exit 0
}
catch {
  if (-not (Test-Path $receiptPath)) {
    Write-Receipt 'FAIL' $_.Exception.Message $base $fork (Get-SandboxSnapshot) | Out-Null
  }
  throw
}