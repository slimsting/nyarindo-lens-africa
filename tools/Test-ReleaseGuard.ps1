#Requires -Version 5.1
<#
.SYNOPSIS
Runs disposable tests for the Nyarindo publication guard.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$scanner = Join-Path $PSScriptRoot 'Test-PublicRelease.ps1'
$installer = Join-Path $PSScriptRoot 'Install-ReleaseGuard.ps1'
if (-not (Test-Path -LiteralPath $scanner -PathType Leaf)) {
    throw "Scanner not found: $scanner"
}
if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) {
    throw "Installer not found: $installer"
}

$tempBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$testRoot = Join-Path $tempBase ('nyarindo-release-guard-' + [guid]::NewGuid().ToString('N'))
$resolvedTestRoot = [System.IO.Path]::GetFullPath($testRoot)
if (-not $resolvedTestRoot.StartsWith($tempBase.TrimEnd('\') + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Temporary test root escaped the operating-system temporary directory.'
}

function Write-Fixture {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )
    $parent = Split-Path -Parent $Path
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
}

function New-TestRepository {
    param([Parameter(Mandatory = $true)][string]$Name)

    $path = Join-Path $resolvedTestRoot $Name
    New-Item -ItemType Directory -Path $path -Force | Out-Null
    & git -C $path init -q
    if ($LASTEXITCODE -ne 0) { throw "git init failed for $Name" }
    & git -C $path config user.name 'Release Guard Test'
    & git -C $path config user.email 'release-guard@example.invalid'
    if ($LASTEXITCODE -ne 0) { throw "git config failed for $Name" }
    return $path
}

function Invoke-Scanner {
    param(
        [Parameter(Mandatory = $true)][string]$Repository,
        [string]$Config,
        [ValidateSet('Staged', 'Repository')]
        [string]$ScanScope = 'Staged'
    )

    $arguments = @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scanner,
        '-RepositoryRoot', $Repository, '-Scope', $ScanScope, '-Quiet'
    )
    if (-not [string]::IsNullOrWhiteSpace($Config)) {
        $arguments += @('-ConfigPath', $Config)
    }
    & powershell.exe @arguments | Out-Null
    return $LASTEXITCODE
}

function Assert-ExitCode {
    param(
        [Parameter(Mandatory = $true)][int]$Actual,
        [Parameter(Mandatory = $true)][int]$Expected,
        [Parameter(Mandatory = $true)][string]$Name
    )
    if ($Actual -ne $Expected) {
        throw "$Name failed: expected exit $Expected, received $Actual"
    }
    Write-Host "PASS  $Name"
}

try {
    $safeRepo = New-TestRepository -Name 'safe'
    Write-Fixture -Path (Join-Path $safeRepo 'site/index.html') -Content '<!doctype html><title>Public</title>'
    & git -C $safeRepo add site/index.html
    Assert-ExitCode -Actual (Invoke-Scanner -Repository $safeRepo) -Expected 0 -Name 'safe staged file passes'

    $secretRepo = New-TestRepository -Name 'secret'
    $fakeToken = 'ghp_' + '123456789012345678901234567890123456'
    Write-Fixture -Path (Join-Path $secretRepo 'app.js') -Content "const token = `"$fakeToken`";"
    & git -C $secretRepo add app.js
    Assert-ExitCode -Actual (Invoke-Scanner -Repository $secretRepo) -Expected 1 -Name 'secret content blocks'

    $clientRepo = New-TestRepository -Name 'client-path'
    Write-Fixture -Path (Join-Path $clientRepo 'clients/example/brief.md') -Content 'Private engagement.'
    & git -C $clientRepo add clients/example/brief.md
    Assert-ExitCode -Actual (Invoke-Scanner -Repository $clientRepo) -Expected 1 -Name 'client path blocks'

    $termRepo = New-TestRepository -Name 'client-term'
    $termConfig = Join-Path $resolvedTestRoot 'client-term.json'
    $termPolicy = [ordered]@{
        version = 1
        profile = 'client-safe'
        publicPathPrefixes = @()
        publicFiles = @()
        clientTerms = @('Project Nightingale')
    }
    [System.IO.File]::WriteAllText($termConfig, ($termPolicy | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
    Write-Fixture -Path (Join-Path $termRepo 'notes.txt') -Content 'Review for Project Nightingale.'
    & git -C $termRepo add notes.txt
    Assert-ExitCode -Actual (Invoke-Scanner -Repository $termRepo -Config $termConfig) -Expected 1 -Name 'configured client term blocks'

    $publicRepo = New-TestRepository -Name 'public-allowlist'
    $publicConfig = Join-Path $resolvedTestRoot 'public-allowlist.json'
    $publicPolicy = [ordered]@{
        version = 1
        profile = 'public-allowlist'
        publicPathPrefixes = @('site/')
        publicFiles = @('robots.txt')
        clientTerms = @()
    }
    [System.IO.File]::WriteAllText($publicConfig, ($publicPolicy | ConvertTo-Json -Depth 5), (New-Object System.Text.UTF8Encoding($false)))
    Write-Fixture -Path (Join-Path $publicRepo 'AGENTS.md') -Content '# Internal instructions'
    & git -C $publicRepo add AGENTS.md
    Assert-ExitCode -Actual (Invoke-Scanner -Repository $publicRepo -Config $publicConfig) -Expected 1 -Name 'public allowlist blocks private governance'

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer `
        -RepositoryPath $publicRepo `
        -Profile PublicAllowlist `
        -PublicPathPrefixes 'site/,assets/' `
        -PublicFiles 'robots.txt' | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Guard installation failed.'
    }
    $installedPolicy = Get-Content -LiteralPath (Join-Path $publicRepo '.git/nyarindo-release/config.json') -Raw | ConvertFrom-Json
    if (@($installedPolicy.publicPathPrefixes).Count -ne 2) {
        throw 'Comma-separated public path prefixes were not split into two entries.'
    }

    & git -C $publicRepo reset -q
    Write-Fixture -Path (Join-Path $publicRepo 'site/index.html') -Content '<!doctype html><title>Guarded</title>'
    & git -C $publicRepo add site/index.html
    & git -C $publicRepo commit -q -m 'Safe public release'
    Assert-ExitCode -Actual $LASTEXITCODE -Expected 0 -Name 'installed pre-commit hook permits safe public file'

    Write-Fixture -Path (Join-Path $publicRepo 'AGENTS.md') -Content '# Internal instructions'
    & git -C $publicRepo add AGENTS.md
    $savedErrorAction = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & git -C $publicRepo commit -q -m 'Unsafe public release' 2>$null
        $blockedCommitExit = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $savedErrorAction
    }
    Assert-ExitCode -Actual $blockedCommitExit -Expected 1 -Name 'installed pre-commit hook blocks private governance'

    if (-not (Test-Path -LiteralPath (Join-Path $publicRepo '.git/hooks/pre-push') -PathType Leaf)) {
        throw 'Pre-push hook was not installed.'
    }
    Write-Host 'PASS  pre-push hook installed'

    Write-Host ''
    Write-Host 'RELEASE GUARD TESTS PASSED' -ForegroundColor Green
}
finally {
    if (Test-Path -LiteralPath $resolvedTestRoot -PathType Container) {
        $verified = [System.IO.Path]::GetFullPath($resolvedTestRoot)
        if ($verified.StartsWith($tempBase.TrimEnd('\') + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
            Remove-Item -LiteralPath $verified -Recurse -Force
        }
    }
}
