#Requires -Version 5.1
<#
.SYNOPSIS
Blocks client-specific, private, or credential material from a Git publication set.

.DESCRIPTION
Scans either the staged Git index or every tracked path. The default client-safe profile
blocks known protected paths, credential patterns, confidential content markers, and locally
configured client terms. The public-allowlist profile additionally permits only explicitly
approved public paths.

The scanner never prints a matched secret or configured client term.

.PARAMETER RepositoryRoot
Repository to inspect. Defaults to the current directory.

.PARAMETER Scope
Staged checks the index. Repository checks every tracked path.

.PARAMETER ConfigPath
Local JSON policy. Defaults to .git/nyarindo-release/config.json when present.

.PARAMETER Quiet
Suppress the pass message. Failures remain visible.
#>
[CmdletBinding()]
param(
    [string]$RepositoryRoot = (Get-Location).Path,
    [ValidateSet('Staged', 'Repository')]
    [string]$Scope = 'Staged',
    [string]$ConfigPath,
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

function Invoke-GitText {
    param(
        [Parameter(Mandatory = $true)][string]$Repository,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $output = & git -C $Repository @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Arguments -join ' ')"
    }
    return @($output)
}

function Normalize-RelativePath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return (($Path.Trim() -replace '\\', '/' -replace '^\./', '').TrimStart('/'))
}

$candidateRoot = [System.IO.Path]::GetFullPath($RepositoryRoot)
if (-not (Test-Path -LiteralPath $candidateRoot -PathType Container)) {
    throw "Repository path does not exist: $candidateRoot"
}

$repoLines = & git -C $candidateRoot rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or $repoLines.Count -eq 0) {
    throw "Not a Git work tree: $candidateRoot"
}
$resolvedRepository = [System.IO.Path]::GetFullPath(($repoLines | Select-Object -First 1))

$gitDirLines = & git -C $resolvedRepository rev-parse --absolute-git-dir 2>$null
if ($LASTEXITCODE -ne 0 -or $gitDirLines.Count -eq 0) {
    throw "Could not resolve the Git metadata directory: $resolvedRepository"
}
$gitDirectory = [System.IO.Path]::GetFullPath(($gitDirLines | Select-Object -First 1))

if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
    $defaultConfig = Join-Path $gitDirectory 'nyarindo-release/config.json'
    if (Test-Path -LiteralPath $defaultConfig -PathType Leaf) {
        $ConfigPath = $defaultConfig
    }
} elseif (-not [System.IO.Path]::IsPathRooted($ConfigPath)) {
    $ConfigPath = Join-Path $resolvedRepository $ConfigPath
}

$config = [pscustomobject]@{
    version = 1
    profile = 'client-safe'
    publicPathPrefixes = @()
    publicFiles = @()
    clientTerms = @()
}

if (-not [string]::IsNullOrWhiteSpace($ConfigPath) -and (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
    try {
        $loadedConfig = Get-Content -LiteralPath $ConfigPath -Raw -Encoding utf8 | ConvertFrom-Json
        $config = $loadedConfig
    }
    catch {
        throw "Publication guard configuration is not valid JSON: $ConfigPath"
    }
}

$profile = if ($null -ne $config.profile -and -not [string]::IsNullOrWhiteSpace([string]$config.profile)) {
    ([string]$config.profile).Trim().ToLowerInvariant()
} else {
    'client-safe'
}

if ($profile -notin @('client-safe', 'public-allowlist')) {
    throw "Unknown publication profile '$profile'. Use client-safe or public-allowlist."
}

function Get-ConfigArray {
    param(
        [Parameter(Mandatory = $true)]$Object,
        [Parameter(Mandatory = $true)][string]$Name
    )

    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property -or $null -eq $property.Value) {
        return @()
    }
    return @($property.Value | ForEach-Object { [string]$_ } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

$publicPrefixes = @(
    Get-ConfigArray -Object $config -Name 'publicPathPrefixes' |
        ForEach-Object {
            $prefix = Normalize-RelativePath $_
            if ([string]::IsNullOrWhiteSpace($prefix) -or $prefix -eq '.') {
                throw 'A public allowlist prefix may not be the repository root.'
            }
            if (-not $prefix.EndsWith('/')) {
                $prefix += '/'
            }
            $prefix
        } |
        Sort-Object -Unique
)

$publicFiles = @(
    Get-ConfigArray -Object $config -Name 'publicFiles' |
        ForEach-Object { Normalize-RelativePath $_ } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        Sort-Object -Unique
)

$clientTerms = @(
    Get-ConfigArray -Object $config -Name 'clientTerms' |
        Sort-Object -Unique
)

if ($profile -eq 'public-allowlist' -and $publicPrefixes.Count -eq 0 -and $publicFiles.Count -eq 0) {
    throw 'The public-allowlist profile requires at least one publicPathPrefixes or publicFiles entry.'
}

if ($Scope -eq 'Staged') {
    $paths = Invoke-GitText -Repository $resolvedRepository -Arguments @(
        'diff', '--cached', '--name-only', '--diff-filter=ACMR'
    )
} else {
    $paths = Invoke-GitText -Repository $resolvedRepository -Arguments @('ls-files')
}

$paths = @(
    $paths |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        ForEach-Object { Normalize-RelativePath $_ } |
        Sort-Object -Unique
)

$binaryExtensions = @(
    '.avif', '.bmp', '.eot', '.gif', '.ico', '.jpeg', '.jpg', '.mp3', '.mp4', '.ogg',
    '.otf', '.pdf', '.png', '.ttf', '.wav', '.webm', '.webp', '.woff', '.woff2'
)

$pathRules = @(
    [pscustomobject]@{
        Reason = 'Credential or environment file'
        Pattern = '(?i)(^|/)(\.env(?:\.|$)|\.envrc$|\.netrc$|\.npmrc$|\.pypirc$|\.git-credentials$|credentials?(?:/|$)|secrets?(?:/|$)|auth(?:entication)?[-_]?data(?:/|$))'
    },
    [pscustomobject]@{
        Reason = 'Private key, certificate, or secret-store file'
        Pattern = '(?i)\.(key|pem|p12|pfx|jks|keystore|kdbx|ovpn|ppk)$'
    },
    [pscustomobject]@{
        Reason = 'Client, confidential, contract, or business-record path'
        Pattern = '(?i)(^|/)(clients?|client[-_ ]?(data|files|material)|customer[-_ ]?data|confidential(?:ity)?|contracts?|agreements?|invoices?|billing|payroll|finance|proposals?|briefs?|correspondence|meetings?|crm|analytics[-_ ]?exports?|account[-_ ]?management)(/|$)'
    },
    [pscustomobject]@{
        Reason = 'Browser, chat, or AI-tool state'
        Pattern = '(?i)(^|/)(User Data|Default|Profile \d+|browser[-_ ]?profiles?|chrome[-_ ]?profile|firefox[-_ ]?profile|\.codex|\.claude|\.cursor|\.continue|\.aider)(/|$)'
    },
    [pscustomobject]@{
        Reason = 'Browser, session, or credential database'
        Pattern = '(?i)(^|/)(Cookies|Login Data|History|Web Data|Local State|places\.sqlite|key4\.db|logins\.json)$'
    },
    [pscustomobject]@{
        Reason = 'Database, log, or opaque archive'
        Pattern = '(?i)\.(sqlite|sqlite3|db|log|zip|7z|rar|tar|tgz|gz)$'
    },
    [pscustomobject]@{
        Reason = 'Potential client data export'
        Pattern = '(?i)(client|customer|confidential|private|leads?|crm|sales|revenue|invoice|billing|analysis|export|report).*\.(xlsx?|xlsm|ods|csv|tsv|json|xml)$'
    },
    [pscustomobject]@{
        Reason = 'Deployment or tool state'
        Pattern = '(?i)(^|/)(\.netlify|\.vercel|\.wrangler|\.firebase|\.turbo|\.parcel-cache)(/|$)'
    }
)

$publicOnlyPathRules = @(
    [pscustomobject]@{
        Reason = 'Private governance or process file in a public release'
        Pattern = '(?i)(^|/)(AGENTS(?:\.template)?\.md|CHANGELOG\.md|PROJECT-CHARTER\.md|DEPLOYMENT\.md|[0-9]{3}-[^/]+\.md|PROPOSAL[^/]*\.md|.*(?:brief|meeting|notes?|proposal)[^/]*\.md)$'
    }
)

$secretContentRules = @(
    [pscustomobject]@{
        Reason = 'Private-key block'
        Pattern = '(?m)^\s*-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'
    },
    [pscustomobject]@{
        Reason = 'GitHub token'
        Pattern = '\bgh[pousr]_[A-Za-z0-9]{30,}\b'
    },
    [pscustomobject]@{
        Reason = 'OpenAI-style API key'
        Pattern = '\bsk-[A-Za-z0-9_-]{20,}\b'
    },
    [pscustomobject]@{
        Reason = 'AWS access key'
        Pattern = '\bAKIA[0-9A-Z]{16}\b'
    },
    [pscustomobject]@{
        Reason = 'Slack token'
        Pattern = '\bxox[baprs]-[A-Za-z0-9-]{20,}\b'
    },
    [pscustomobject]@{
        Reason = 'Credential assignment'
        Pattern = '(?im)\b(?:api[_-]?key|secret|password|passwd|access[_-]?token|client[_-]?secret|auth[_-]?token)\b\s*[:=]\s*["'']?(?<value>[A-Za-z0-9_./+\-=]{8,})'
        ValueGroup = 'value'
    }
)

$clientContentRules = @(
    [pscustomobject]@{
        Reason = 'Private project confidentiality marker'
        Pattern = (
            '(?im)\b(?:strictly ' + 'confidential|' +
            'client' + '[- ]' + 'confidential|' +
            'customer' + '[- ]' + 'confidential|' +
            'confidential\s*[:\-]\s*(?:client|customer|account))\b'
        )
    },
    [pscustomobject]@{
        Reason = 'Client or customer record field'
        Pattern = '(?im)^\s*(?:client|customer|account)[ _-]?(?:name|contact|company|address|brief|feedback|approval|invoice|contract|billing|rate|pricing|retainer)\s*[:=]\s*\S+'
    },
    [pscustomobject]@{
        Reason = 'Client or customer record field'
        Pattern = '(?im)["''](?:clientName|customerName|client_name|customer_name|contractValue|contract_value|billingRate|billing_rate)["'']\s*:'
    },
    [pscustomobject]@{
        Reason = 'Invoice or contract value'
        Pattern = '(?im)\b(?:invoice(?: number| no\.?| #)|contract (?:value|amount|rate))\s*[:#]?\s*[A-Z0-9][A-Z0-9._-]{2,}'
    }
)

$violations = [System.Collections.Generic.List[object]]::new()

function Add-Violation {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Reason,
        [Nullable[int]]$Line
    )

    $violations.Add([pscustomobject]@{
        Path = $Path
        Reason = $Reason
        Line = $Line
    })
}

function Test-PublicPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    if ($publicFiles -contains $Path) {
        return $true
    }
    foreach ($prefix in $publicPrefixes) {
        if ($Path.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

function Get-LineNumber {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][int]$Index
    )

    return (($Content.Substring(0, $Index) -split "`n").Count)
}

foreach ($path in $paths) {
    $pathAllowed = Test-PublicPath -Path $path
    if ($profile -eq 'public-allowlist' -and -not $pathAllowed) {
        Add-Violation -Path $path -Reason 'Path is outside the approved public release allowlist'
    }

    foreach ($rule in $pathRules) {
        if ([regex]::IsMatch($path, $rule.Pattern)) {
            Add-Violation -Path $path -Reason $rule.Reason
        }
    }

    if ($profile -eq 'public-allowlist') {
        foreach ($rule in $publicOnlyPathRules) {
            if ([regex]::IsMatch($path, $rule.Pattern)) {
                Add-Violation -Path $path -Reason $rule.Reason
            }
        }
    }

    foreach ($term in $clientTerms) {
        if ($path.IndexOf($term, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
            Add-Violation -Path $path -Reason 'Path contains a configured client term'
        }
    }

    $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
    if ($binaryExtensions -contains $extension) {
        continue
    }

    $sizeText = Invoke-GitText -Repository $resolvedRepository -Arguments @('cat-file', '-s', ":$path")
    $size = [long]0
    if ($sizeText.Count -gt 0) {
        [void][long]::TryParse(($sizeText | Select-Object -First 1), [ref]$size)
    }
    if ($size -gt 2097152) {
        Add-Violation -Path $path -Reason 'Text file exceeds the 2 MiB safe-scan limit'
        continue
    }

    $contentLines = Invoke-GitText -Repository $resolvedRepository -Arguments @('cat-file', '-p', ":$path")
    $content = @($contentLines) -join "`n"

    foreach ($rule in $secretContentRules) {
        foreach ($match in [regex]::Matches($content, $rule.Pattern)) {
            $skip = $false
            if ($rule.PSObject.Properties['ValueGroup']) {
                $value = $match.Groups[$rule.ValueGroup].Value
                if ($value -match '(?i)^(?:example|sample|changeme|change-me|placeholder|redacted|replace-me|your[-_]|x{4,}|\$\{|\{)') {
                    $skip = $true
                }
            }
            if (-not $skip) {
                Add-Violation -Path $path -Reason $rule.Reason -Line (Get-LineNumber -Content $content -Index $match.Index)
            }
        }
    }

    foreach ($rule in $clientContentRules) {
        foreach ($match in [regex]::Matches($content, $rule.Pattern)) {
            Add-Violation -Path $path -Reason $rule.Reason -Line (Get-LineNumber -Content $content -Index $match.Index)
        }
    }

    foreach ($term in $clientTerms) {
        $index = $content.IndexOf($term, [System.StringComparison]::OrdinalIgnoreCase)
        while ($index -ge 0) {
            Add-Violation -Path $path -Reason 'Content contains a configured client term' -Line (Get-LineNumber -Content $content -Index $index)
            $index = $content.IndexOf($term, $index + $term.Length, [System.StringComparison]::OrdinalIgnoreCase)
        }
    }
}

$uniqueViolations = @(
    $violations |
        Sort-Object Path, Reason, Line -Unique
)

if ($uniqueViolations.Count -gt 0) {
    Write-Host ''
    Write-Host 'PUBLICATION GUARD FAILED' -ForegroundColor Red
    Write-Host "Repository: $resolvedRepository"
    Write-Host "Scope: $Scope | Profile: $profile | Files inspected: $($paths.Count)"
    foreach ($violation in $uniqueViolations) {
        $suffix = if ($null -ne $violation.Line) { " (line $($violation.Line))" } else { '' }
        Write-Host "BLOCK  $($violation.Path): $($violation.Reason)$suffix" -ForegroundColor Red
    }
    Write-Host 'Remove the protected material, review the complete staged set, and rerun. Do not bypass the guard.' -ForegroundColor Yellow
    exit 1
}

if (-not $Quiet) {
    Write-Host "PUBLICATION GUARD PASSED: $($paths.Count) files | scope=$Scope | profile=$profile" -ForegroundColor Green
}
exit 0
