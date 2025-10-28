#requires -Version 7.0
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Write-Host "== NORMALDANCE: GPG key generation and GitHub secrets setup =="

function Test-Command { param([Parameter(Mandatory=$true)][string]$Name) return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

if (-not (Test-Command -Name 'gh')) { throw 'GitHub CLI (gh) is not installed. Install https://cli.github.com/ and rerun.' }

function Ensure-Gpg {
  if (Test-Command -Name 'gpg') { return $true }
  $candidatePaths = @(
    'C:\Program Files (x86)\GnuPG\bin',
    'C:\Program Files\GnuPG\bin',
    'C:\Program Files (x86)\Gpg4win\bin',
    'C:\Program Files\Gpg4win\bin'
  )
  foreach ($p in $candidatePaths) {
    if (Test-Path (Join-Path $p 'gpg.exe')) {
      $env:PATH = "$p;$env:PATH"
      if (Test-Command -Name 'gpg') { return $true }
    }
  }
  if (Test-Command -Name 'winget') {
    Write-Host 'Installing GPG via winget...'
    try { winget install --id GnuPG.GnuPG -e --silent --accept-source-agreements --accept-package-agreements } catch {}
    Start-Sleep -Seconds 5
    if (-not (Test-Command -Name 'gpg')) {
      try { winget install --id GnuPG.Gpg4win -e --silent --accept-source-agreements --accept-package-agreements } catch {}
      Start-Sleep -Seconds 5
    }
    foreach ($p in $candidatePaths) {
      if (Test-Path (Join-Path $p 'gpg.exe')) {
        $env:PATH = "$p;$env:PATH"
      }
    }
  }
  return (Test-Command -Name 'gpg')
}

if (-not (Ensure-Gpg)) { throw 'GPG is not installed or not in PATH. Install https://www.gpg4win.org/ and rerun.' }

$pass = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
Write-Host "Generated passphrase"

$batch = @"
Key-Type: RSA
Key-Length: 4096
Name-Real: NORMALDANCE CI
Name-Comment: GitHub Actions signing
Name-Email: ci@normaldance.com
Expire-Date: 0
Passphrase: $pass
"@

Set-Content -Path gpg-batch.txt -Value $batch

Write-Host 'Generating GPG key...'
gpg --batch --pinentry-mode loopback --gen-key gpg-batch.txt

$fp = (gpg --list-keys --with-colons "NORMALDANCE CI" | Select-String -Pattern "^fpr:" | ForEach-Object { $_.Line.Split(':')[9] } | Select-Object -First 1)
if (-not $fp) { throw 'Unable to obtain GPG fingerprint' }
Write-Host "Fingerprint: $fp"

$pub = gpg --armor --export "NORMALDANCE CI"
$priv = gpg --armor --export-secret-keys --pinentry-mode loopback --passphrase $pass "NORMALDANCE CI"

Set-Content -Path gpg_public.asc -Value $pub
Set-Content -Path gpg_private.asc -Value $priv

git config user.signingkey $fp
git config commit.gpgsign true

$repo = $env:REPO
if ([string]::IsNullOrWhiteSpace($repo)) { $repo = 'AENDYSTUDIO/NORMALDANCE-INFRASTRUCTURE' }

Write-Host "Setting secrets on $repo ..."
gh secret set GPG_PRIVATE --repo $repo --body "$priv"
gh secret set GPG_PASSPHRASE --repo $repo --body "$pass"

Write-Host 'Registering public key in GitHub account...'
gh auth status
gh api -X POST /user/gpg_keys -f armored_public_key="$pub"

Write-Host '✅ Done: GPG key generated, secrets created (GPG_PRIVATE, GPG_PASSPHRASE), public key registered in GitHub Signing keys.'