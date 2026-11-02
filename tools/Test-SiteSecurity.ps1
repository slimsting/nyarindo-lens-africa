#Requires -Version 5.1
<#
.SYNOPSIS
Checks the static Nyarindo site security boundary and CSP hash inventory.
#>
[CmdletBinding()]
param(
    [string]$Root
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = Split-Path -Parent $PSScriptRoot
}
$rootPath = [System.IO.Path]::GetFullPath($Root)
$failures = [System.Collections.Generic.List[string]]::new()

$headersPath = Join-Path $rootPath '_headers'
if (-not (Test-Path -LiteralPath $headersPath -PathType Leaf)) {
    throw "Security headers file not found: $headersPath"
}

$headerLines = Get-Content -LiteralPath $headersPath
$cspLine = $headerLines | Where-Object { $_ -match '^\s*Content-Security-Policy:' } | Select-Object -First 1
if (-not $cspLine) {
    $failures.Add('Missing Content-Security-Policy header.')
    $csp = ''
} else {
    $csp = $cspLine.Substring($cspLine.IndexOf(':') + 1).Trim()
}

foreach ($required in @(
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src-attr 'none'",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'"
)) {
    if (-not $csp.Contains($required)) {
        $failures.Add("CSP is missing: $required")
    }
}

$scriptSrc = [regex]::Match($csp, "(?:^|;\s*)script-src\s+([^;]+)").Groups[1].Value
if ($scriptSrc -match "'unsafe-inline'") {
    $failures.Add("script-src still permits 'unsafe-inline'.")
}

foreach ($requiredHeader in @(
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
    'Permissions-Policy',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options'
)) {
    if (-not ($headerLines | Where-Object { $_ -match "^\s*$([regex]::Escape($requiredHeader)):" })) {
        $failures.Add("Missing security header: $requiredHeader")
    }
}

$htmlFiles = Get-ChildItem -LiteralPath $rootPath -Recurse -File -Filter '*.html'
$jsonLdHashes = [System.Collections.Generic.HashSet[string]]::new()

foreach ($file in $htmlFiles) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
    $relative = $file.FullName.Substring($rootPath.Length).TrimStart('\').Replace('\', '/')

    if ($text -match 'fonts\.googleapis\.com|fonts\.gstatic\.com') {
        $failures.Add("Third-party Google Fonts reference: $relative")
    }

    if ($text -match '(?is)<style(?:\s[^>]*)?>') {
        $failures.Add("Inline style block remains: $relative")
    }

    if ($text -match '(?i)\son[a-z]+\s*=') {
        $failures.Add("Inline event handler remains: $relative")
    }

    foreach ($anchor in [regex]::Matches($text, '(?is)<a\b[^>]*target\s*=\s*["'']_blank["''][^>]*>')) {
        if ($anchor.Value -notmatch '(?i)\brel\s*=\s*["''][^"'']*(?:noopener|noreferrer)[^"'']*["'']') {
            $failures.Add("New-tab link lacks noopener/noreferrer: $relative")
        }
    }

    foreach ($resource in [regex]::Matches($text, '(?is)<(?:script|img|source)\b[^>]*\bsrc\s*=\s*["'']https?://[^"'']+["'']|<link\b[^>]*\bhref\s*=\s*["'']https?://[^"'']+\.(?:css|js|woff2?)[^"'']*["'']')) {
        $failures.Add("Cross-origin executable or visual asset in $relative")
    }

    foreach ($scriptMatch in [regex]::Matches($text, '(?is)<script(?<attrs>[^>]*)>(?<body>.*?)</script>')) {
        $attrs = $scriptMatch.Groups['attrs'].Value
        if ($attrs -match '(?i)\bsrc\s*=') {
            continue
        }
        if ($attrs -match '(?i)type\s*=\s*["'']application/ld\+json["'']') {
            $bytes = [Text.Encoding]::UTF8.GetBytes($scriptMatch.Groups['body'].Value)
            $algorithm = [Security.Cryptography.SHA256]::Create()
            try {
                $hash = [Convert]::ToBase64String($algorithm.ComputeHash($bytes))
            }
            finally {
                $algorithm.Dispose()
            }
            [void]$jsonLdHashes.Add($hash)
            continue
        }
        $failures.Add("Inline executable script remains: $relative")
    }
}

foreach ($hash in $jsonLdHashes) {
    if (-not $csp.Contains("'sha256-$hash'")) {
        $failures.Add("CSP is missing inline JSON-LD hash: $hash")
    }
}

$jsFiles = Get-ChildItem -LiteralPath $rootPath -Recurse -File -Filter '*.js'
foreach ($file in $jsFiles) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding utf8
    $relative = $file.FullName.Substring($rootPath.Length).TrimStart('\').Replace('\', '/')
    if ($text -match '\beval\s*\(|\bnew\s+Function\s*\(|document\.write\s*\(|\.innerHTML\s*=') {
        $failures.Add("Dynamic JavaScript execution sink: $relative")
    }
}

$memoryApp = Get-Content -LiteralPath (Join-Path $rootPath 'memory-app\app.js') -Raw -Encoding utf8
foreach ($requiredStorageControl in @('PBKDF2', 'AES-GCM', 'unlockEntriesButton')) {
    if (-not $memoryApp.Contains($requiredStorageControl)) {
        $failures.Add("Encrypted journal control is missing: $requiredStorageControl")
    }
}
$memoryHtml = Get-Content -LiteralPath (Join-Path $rootPath 'memory-app\index.html') -Raw -Encoding utf8
foreach ($requiredStorageLabel in @('Protect entries', 'Unlock entries')) {
    if (-not $memoryHtml.Contains($requiredStorageLabel)) {
        $failures.Add("Encrypted journal label is missing: $requiredStorageLabel")
    }
}

$driftApp = Get-Content -LiteralPath (Join-Path $rootPath 'drift\app.js') -Raw -Encoding utf8
if ($driftApp -match 'localStorage\.(?:get|set)Item\(["'']drift-user["'']') {
    $failures.Add('Drift persists the profile name in localStorage instead of sessionStorage.')
}

$fontCss = Join-Path $rootPath 'portfolio-website\local-fonts.css'
if (-not (Test-Path -LiteralPath $fontCss -PathType Leaf)) {
    $failures.Add('Local font stylesheet is missing.')
} else {
    $fontText = Get-Content -LiteralPath $fontCss -Raw -Encoding utf8
    foreach ($match in [regex]::Matches($fontText, 'url\("(?<path>[^"]+\.woff2)"\)')) {
        $fontPath = Join-Path (Split-Path -Parent $fontCss) $match.Groups['path'].Value
        if (-not (Test-Path -LiteralPath $fontPath -PathType Leaf)) {
            $failures.Add("Local font file is missing: $fontPath")
        }
    }
}

if ($failures.Count) {
    Write-Host ''
    Write-Host 'SITE SECURITY TEST FAILED' -ForegroundColor Red
    $failures | ForEach-Object { Write-Host "FAIL  $_" -ForegroundColor Red }
    exit 1
}

Write-Host "SITE SECURITY TEST PASSED: $($htmlFiles.Count) pages, $($jsonLdHashes.Count) CSP script hashes" -ForegroundColor Green
exit 0
