# One-time setup: attach plasma.luskeren.dk to the Cloudflare Pages project.
# Requires $env:CLOUDFLARE_API_TOKEN with "Cloudflare Pages: Edit" (account) and "DNS: Edit" (luskeren.dk).
# Run after the first successful deploy (which creates the Pages project).

$ErrorActionPreference = 'Stop'

$accountId = '564adf20aad230d032ac1c7d85215bab'
$zoneId = 'fd9094f24f37590af7645c543ec54002'
$project = 'plasma'
$domain = 'plasma.luskeren.dk'

if (-not $env:CLOUDFLARE_API_TOKEN) { throw 'Set $env:CLOUDFLARE_API_TOKEN first.' }
$headers = @{ Authorization = "Bearer $env:CLOUDFLARE_API_TOKEN"; 'Content-Type' = 'application/json' }
$api = 'https://api.cloudflare.com/client/v4'

$proj = (Invoke-RestMethod "$api/accounts/$accountId/pages/projects/$project" -Headers $headers).result
$target = $proj.subdomain
Write-Host "Pages project subdomain: $target"

$existingDomains = (Invoke-RestMethod "$api/accounts/$accountId/pages/projects/$project/domains" -Headers $headers).result
if ($existingDomains.name -notcontains $domain) {
  $body = @{ name = $domain } | ConvertTo-Json
  Invoke-RestMethod "$api/accounts/$accountId/pages/projects/$project/domains" -Method Post -Headers $headers -Body $body | Out-Null
  Write-Host "Attached custom domain $domain"
} else {
  Write-Host "Custom domain $domain already attached"
}

$records = @((Invoke-RestMethod "$api/zones/$zoneId/dns_records?name=$domain" -Headers $headers).result)
$record = @{ type = 'CNAME'; name = $domain; content = $target; proxied = $true; ttl = 1 } | ConvertTo-Json
$cname = $records | Where-Object { $_.type -eq 'CNAME' } | Select-Object -First 1
foreach ($r in $records | Where-Object { -not $cname -or $_.id -ne $cname.id }) {
  Invoke-RestMethod "$api/zones/$zoneId/dns_records/$($r.id)" -Method Delete -Headers $headers | Out-Null
  Write-Host "Removed $($r.type) $($r.name) -> $($r.content)"
}
if ($cname) {
  Invoke-RestMethod "$api/zones/$zoneId/dns_records/$($cname.id)" -Method Put -Headers $headers -Body $record | Out-Null
  Write-Host "Updated CNAME $domain -> $target"
} else {
  Invoke-RestMethod "$api/zones/$zoneId/dns_records" -Method Post -Headers $headers -Body $record | Out-Null
  Write-Host "Created CNAME $domain -> $target"
}
