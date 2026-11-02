#Requires -Version 5.1
<#
.SYNOPSIS
Installs the local publication guard in a Git repository.

.DESCRIPTION
Copies the scanner into the repository's .git directory and installs pre-commit and pre-push
hooks. Existing unrecognized hooks are preserved unless -Force is supplied.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RepositoryPath,
    [ValidateSet('ClientSafe', 'PublicAllowlist')]
    [string]$Profile = 'ClientSafe',
    [string[]]$PublicPathPrefixes = @(),
    [string[]]$PublicFiles = @(),
    [string[]]$ClientTerms = @(),
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Expand-ListValue {
    param([string[]]$Values)

    return @(
        $Values |
            ForEach-Object { $_ -split '[,;]' } |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
}

$PublicPathPrefixes = @(Expand-ListValue -Values $PublicPathPrefixes)
$PublicFiles = @(Expand-ListValue -Values $PublicFiles)
$ClientTerms = @(Expand-ListValue -Values $ClientTerms)

if ($Profile -eq 'PublicAllowlist' -and $PublicPathPrefixes.Count -eq 0 -and $PublicFiles.Count -eq 0) {
    throw 'PublicAllowlist requires at least one -PublicPathPrefixes or -PublicFiles value.'
}

$candidate = [System.IO.Path]::GetFullPath($RepositoryPath)
if (-not (Test-Path -LiteralPath $candidate -PathType Container)) {
    throw "Repository path does not exist: $candidate"
}

$rootLines = & git -C $candidate rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or $rootLines.Count -eq 0) {
    throw "Not a Git work tree: $candidate"
}
$repository = [System.IO.Path]::GetFullPath(($rootLines | Select-Object -First 1))

$gitDirLines = & git -C $repository rev-parse --absolute-git-dir 2>$null
if ($LASTEXITCODE -ne 0 -or $gitDirLines.Count -eq 0) {
    throw "Could not resolve Git metadata for: $repository"
}
$gitDirectory = [System.IO.Path]::GetFullPath(($gitDirLines | Select-Object -First 1))

$scannerSource = Join-Path $PSScriptRoot 'Test-PublicRelease.ps1'
if (-not (Test-Path -LiteralPath $scannerSource -PathType Leaf)) {
    throw "Publication scanner not found: $scannerSource"
}

$guardDirectory = Join-Path $gitDirectory 'nyarindo-release'
$hooksDirectory = Join-Path $gitDirectory 'hooks'
New-Item -ItemType Directory -Path $guardDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $hooksDirectory -Force | Out-Null

$installedScanner = Join-Path $guardDirectory 'Test-PublicRelease.ps1'
$configPath = Join-Path $guardDirectory 'config.json'
Copy-Item -LiteralPath $scannerSource -Destination $installedScanner -Force

$profileValue = if ($Profile -eq 'PublicAllowlist') { 'public-allowlist' } else { 'client-safe' }
$config = [ordered]@{
    version = 1
    profile = $profileValue
    publicPathPrefixes = $PublicPathPrefixes
    publicFiles = $PublicFiles
    clientTerms = $ClientTerms
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 5), $utf8NoBom)

function Write-GuardHook {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Scope
    )

    $hookPath = Join-Path $hooksDirectory $Name
    if (Test-Path -LiteralPath $hookPath -PathType Leaf) {
        $existing = Get-Content -LiteralPath $hookPath -Raw -Encoding utf8
        if ($existing -notmatch 'NYARINDO PUBLICATION GUARD' -and -not $Force) {
            throw "Existing $Name hook is not managed by Nyarindo. Rerun with -Force to back it up and replace it."
        }
        if ($existing -notmatch 'NYARINDO PUBLICATION GUARD') {
            $backup = "$hookPath.nyarindo-backup-" + (Get-Date -Format 'yyyyMMdd-HHmmss')
            Copy-Item -LiteralPath $hookPath -Destination $backup -Force
        }
    }

    $scannerShellPath = $installedScanner.Replace('\', '/').Replace('"', '\"')
    $configShellPath = $configPath.Replace('\', '/').Replace('"', '\"')
    $execLine = 'exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' +
        $scannerShellPath +
        '" -RepositoryRoot "$repo_root" -Scope ' +
        $Scope +
        ' -ConfigPath "' +
        $configShellPath +
        '"'

    $hookLines = @(
        '#!/bin/sh',
        '# NYARINDO PUBLICATION GUARD - managed by Install-ReleaseGuard.ps1',
        'repo_root="$(git rev-parse --show-toplevel)" || exit 1',
        $execLine,
        ''
    )
    [System.IO.File]::WriteAllText($hookPath, ($hookLines -join "`n"), $utf8NoBom)
}

Write-GuardHook -Name 'pre-commit' -Scope 'Staged'
Write-GuardHook -Name 'pre-push' -Scope 'Repository'

Write-Host ''
Write-Host 'PUBLICATION GUARD INSTALLED' -ForegroundColor Green
Write-Host "Repository: $repository"
Write-Host "Profile:    $profileValue"
Write-Host "Scanner:    $installedScanner"
Write-Host "Config:     $configPath"
Write-Host 'Hooks:      pre-commit (staged) and pre-push (all tracked paths)'
Write-Host ''
Write-Host 'Next: configure client terms in the local config, stage only reviewed files, and run the staged scan.'
