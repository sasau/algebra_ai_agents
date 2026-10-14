$ErrorActionPreference = "Stop"
# Working directory: the course repository's local-models folder.
$runDir = "evidence/curl-$([DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ'))-$PID"
New-Item -ItemType Directory -Path $runDir | Out-Null
# curl.exe avoids the Windows PowerShell curl alias; --output preserves JSON encoding.
$curlArgs = @("--disable", "--noproxy", "*", "--fail", "--silent", "--show-error", "--connect-timeout", "5", "--max-time", "60")
function Invoke-LocalCurl {
    param([string[]]$RequestArgs)
    & curl.exe @curlArgs @RequestArgs
    if ($LASTEXITCODE -ne 0) { throw "curl.exe failed with exit $LASTEXITCODE" }
}
Invoke-LocalCurl -RequestArgs @("http://127.0.0.1:11434/api/version", "--output", "$runDir/version.json")
Invoke-LocalCurl -RequestArgs @("http://127.0.0.1:11434/api/tags", "--output", "$runDir/tags.json")
# Reuse the model field through a JSON file, avoiding PowerShell native-argument quote differences.
'{"model":"qwen3.5:9b"}' | Set-Content -Encoding ASCII -Path "$runDir/show-request.json"
Invoke-LocalCurl -RequestArgs @("http://127.0.0.1:11434/api/show", "-H", "Content-Type: application/json", "--data-binary", "@$runDir/show-request.json", "--output", "$runDir/show.json")
$show = Get-Content -Raw "$runDir/show.json" | ConvertFrom-Json
if ($show.remote_host -or $show.remote_model) { throw "CLOUD_PROXY_MODEL_REJECTED" }
Invoke-LocalCurl -RequestArgs @("http://127.0.0.1:11434/api/chat", "-H", "Content-Type: application/json", "--data-binary", "@examples/chat.json", "--output", "$runDir/chat.json")
Invoke-LocalCurl -RequestArgs @("http://127.0.0.1:11434/api/chat", "-H", "Content-Type: application/json", "--data-binary", "@examples/tool-request.json", "--output", "$runDir/tool.json")
node scripts/check-curl.mjs $runDir
if ($LASTEXITCODE -ne 0) { throw "Saved-response check failed" }
Write-Output "Saved evidence: $runDir"
