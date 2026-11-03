# Publication Guard

These tools prevent client-specific, credential, browser, session, private-process, and
unapproved release material from entering this Git repository.

GitHub is a publication surface even when a repository is private. Client names, briefs,
proposals, contracts, pricing, invoices, analytics, CRM records, client-owned assets,
credentials, and private project records must never be uploaded.

## Installed check

The local checkout installs two hooks under `.git/hooks/`:

- `pre-commit` scans the staged release set;
- `pre-push` scans every tracked path.

The local policy and client-term list live under `.git/nyarindo-release/` and are not
committed.

## Manual scan

Before a commit:

```powershell
git status --short
git diff --cached --name-status
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-PublicRelease.ps1 `
  -RepositoryRoot . `
  -Scope Staged
```

Before a push:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-PublicRelease.ps1 `
  -RepositoryRoot . `
  -Scope Repository
```

Stop on every blocked path or content match. Do not use `--no-verify`, a direct GitHub web
upload, or another bypass.

## Reinstall in a fresh clone

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Install-ReleaseGuard.ps1 `
  -RepositoryPath . `
  -Profile PublicAllowlist `
  -PublicPathPrefixes portfolio-website/,drift/,memory-app/,semantic-field-extension/,tools/ `
  -PublicFiles _headers,_redirects,robots.txt,sitemap.xml,site.webmanifest,llms.txt,googleb73ea63473c1dc60.html,.gitignore
```

Add known client names or project codenames only to the local
`.git/nyarindo-release/config.json`. Never commit that configuration.

## Test the guard

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-ReleaseGuard.ps1
```

The tests create disposable repositories under the operating system temporary directory and
remove them after verification.

## Test the public-site security boundary

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-SiteSecurity.ps1
```

This verifies required response headers, strict script CSP, JSON-LD hash coverage, absence of
inline executable scripts and event handlers, same-origin font delivery, removal of dynamic
JavaScript execution sinks, and URL resolution across Netlify `200` rewrite boundaries. A
rewrite that serves HTML from a different virtual directory must use root-absolute or fully
qualified resource URL, so changing a canonical route cannot silently detach its CSS, scripts,
images, or linked pages.

## Limit

A passing scan is evidence that the configured checks passed. It is not push authorization
and cannot identify an unknown client name unless that name is added locally or another
pattern reveals it. Review the complete staged set before publication.
