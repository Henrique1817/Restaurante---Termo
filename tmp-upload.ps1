$ErrorActionPreference = 'Stop'
$root = 'C:\Restaurante---Termo'
$envPath = Join-Path $root '.env'
$manifestPath = Join-Path $root 'codechroma.project.json'
$origin = 'https://code-chroma.vercel.app'

# Parse .env
$envMap = @{}
Get-Content -Path $envPath | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $idx = $_.IndexOf('=')
  if ($idx -gt 0) {
    $k = $_.Substring(0, $idx).Trim()
    $v = $_.Substring($idx + 1)
    $envMap[$k] = $v
  }
}

$token = $envMap['UPLOAD_API_TOKEN']
if (-not $token) { throw 'UPLOAD_API_TOKEN ausente no .env' }
$project = $envMap['CODECHROMA_PROJECT']
if (-not $project) {
  $manifest = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json
  $project = $manifest.slug
}

$files = @(
  'assets/images/Close-up_of_a_202604151856 (1).jpeg',
  'assets/images/Close-up_of_a_202604151856.jpeg',
  'assets/images/Wide_cinematic_shot_202604151855 (1).jpeg',
  'assets/images/Wide_cinematic_shot_202604151855.jpeg',
  'assets/images/A_signature_dish_202604151857.jpeg',
  'assets/images/A_signature_cocktail_202604151859.jpeg',
  'assets/images/Cinematic_slow_motion_202604151851.mp4'
)

function Get-MimeType([string]$path) {
  $ext = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
  switch ($ext) {
    '.jpg' { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.png' { 'image/png' }
    '.webp' { 'image/webp' }
    '.gif' { 'image/gif' }
    '.mp4' { 'video/mp4' }
    '.webm' { 'video/webm' }
    '.mov' { 'video/quicktime' }
    default { 'application/octet-stream' }
  }
}

function Get-Signature([string]$pathname) {
  $body = @{ method = 'POST'; pathname = $pathname } | ConvertTo-Json -Compress
  $sig = Invoke-RestMethod -Method Post -Uri "$origin/api/upload-signature" -Headers @{ Authorization = "Bearer $token"; Origin = $origin } -ContentType 'application/json' -Body $body
  if (-not $sig.headers) { throw "Assinatura inválida para $pathname" }
  return $sig.headers
}

$results = @()

foreach ($rel in $files) {
  $full = Join-Path $root $rel
  if (-not (Test-Path $full)) { throw "Arquivo não encontrado: $full" }
  $mime = Get-MimeType $full

  $uploadHeaders = Get-Signature '/api/upload'

  $tempOut = [System.IO.Path]::GetTempFileName()
  try {
    $status = & curl.exe -sS -o $tempOut -w "%{http_code}" -X POST "$origin/api/upload" `
      -H "Authorization: Bearer $token" `
      -H "Origin: $origin" `
      -H "x-upload-ts: $($uploadHeaders.'x-upload-ts')" `
      -H "x-upload-nonce: $($uploadHeaders.'x-upload-nonce')" `
      -H "x-upload-signature: $($uploadHeaders.'x-upload-signature')" `
      -F "file=@$full;type=$mime" `
      -F "project=$project"

    $raw = Get-Content -Raw -Path $tempOut
    if ($status -eq '200') {
      $json = $raw | ConvertFrom-Json
      if (-not $json.url) { throw "Resposta sem URL em /api/upload para $rel" }
      $results += [pscustomobject]@{ file = $rel; url = $json.url; via = '/api/upload'; mime = $mime }
      continue
    }

    if ($status -eq '413' -and $mime -like 'video/*') {
      $blobHeaders = Get-Signature '/api/blob'
      $filename = [System.IO.Path]::GetFileName($full)
      $pathname = "projects/$project/$filename"
      $blobReq = @{ type='blob.generate-client-token'; payload=@{ pathname=$pathname; contentType=$mime } } | ConvertTo-Json -Compress -Depth 5

      $blobResp = Invoke-RestMethod -Method Post -Uri "$origin/api/blob" -Headers @{
        Authorization = "Bearer $token"
        Origin = $origin
        'x-upload-ts' = $blobHeaders.'x-upload-ts'
        'x-upload-nonce' = $blobHeaders.'x-upload-nonce'
        'x-upload-signature' = $blobHeaders.'x-upload-signature'
      } -ContentType 'application/json' -Body $blobReq

      $clientToken = $blobResp.clientToken
      if (-not $clientToken -and $blobResp.token) { $clientToken = $blobResp.token }
      if (-not $clientToken -and $blobResp.data.clientToken) { $clientToken = $blobResp.data.clientToken }
      if (-not $clientToken) { throw "Sem clientToken no /api/blob para $rel" }

      $putUrl = "https://blob.vercel-storage.com/$pathname"
      $tempPut = [System.IO.Path]::GetTempFileName()
      $putStatus = & curl.exe -sS -o $tempPut -w "%{http_code}" -X PUT "$putUrl" `
        -H "Authorization: Bearer $clientToken" `
        -H "Content-Type: $mime" `
        --data-binary "@$full"

      $putRaw = Get-Content -Raw -Path $tempPut
      Remove-Item $tempPut -Force -ErrorAction SilentlyContinue

      if ($putStatus -lt '200' -or $putStatus -ge '300') {
        throw "Falha no PUT blob ($putStatus) para ${rel}: $putRaw"
      }

      $putJson = $null
      try { $putJson = $putRaw | ConvertFrom-Json } catch {}
      $publicUrl = $null
      if ($putJson) {
        $publicUrl = $putJson.url
        if (-not $publicUrl -and $putJson.downloadUrl) { $publicUrl = $putJson.downloadUrl }
      }
      if (-not $publicUrl -and $blobResp.url) { $publicUrl = $blobResp.url }
      if (-not $publicUrl -and $blobResp.downloadUrl) { $publicUrl = $blobResp.downloadUrl }
      if (-not $publicUrl) { throw "Não foi possível determinar URL pública do blob para $rel" }

      $results += [pscustomobject]@{ file = $rel; url = $publicUrl; via = '/api/blob'; mime = $mime }
      continue
    }

    throw "Falha upload $rel status=$status body=$raw"
  }
  finally {
    Remove-Item $tempOut -Force -ErrorAction SilentlyContinue
  }
}

$results | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $root 'upload-results.json') -Encoding UTF8
Write-Output "UPLOAD_DONE"
$results | ForEach-Object { Write-Output ("{0} => {1}" -f $_.file, $_.url) }

