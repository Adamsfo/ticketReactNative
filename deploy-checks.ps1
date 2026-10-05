# Validações de deploy web (pré e pós expo export). Uso:
#   deploy-checks.ps1 -Phase PreExport
#   deploy-checks.ps1 -Phase PostExport [-DistDir dist]

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("PreExport", "PostExport")]
    [string]$Phase,

    [string]$DistDir = "dist",

    [string]$EnvFile = ".env",

    [string]$RequiredApiUrl = "https://api.jangoingressos.com.br"
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptRoot

function Read-ExpoPublicApiUrlFromEnv {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Arquivo de ambiente não encontrado: $Path"
    }

    $value = $null
    foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
            continue
        }
        if ($trimmed -match '^\s*EXPO_PUBLIC_API_URL\s*=\s*(.*)\s*$') {
            $raw = $Matches[1].Trim()
            if ($raw.StartsWith('"') -and $raw.EndsWith('"')) {
                $raw = $raw.Substring(1, $raw.Length - 2)
            }
            if ($raw.StartsWith("'") -and $raw.EndsWith("'")) {
                $raw = $raw.Substring(1, $raw.Length - 2)
            }
            $value = $raw
        }
    }
    return $value
}

function Test-PrivateOrDevApiUrl {
    param([string]$Url)

    $issues = @()

    if ([string]::IsNullOrWhiteSpace($Url)) {
        $issues += "EXPO_PUBLIC_API_URL está vazia ou ausente no .env"
        return $issues
    }

    $lower = $Url.ToLowerInvariant()

    if ($lower.StartsWith("http://")) {
        $issues += "EXPO_PUBLIC_API_URL usa HTTP (não HTTPS): $Url"
    }

    if ($lower -match 'localhost') {
        $issues += "EXPO_PUBLIC_API_URL aponta para localhost: $Url"
    }

    if ($lower -match '127\.0\.0\.1') {
        $issues += "EXPO_PUBLIC_API_URL aponta para 127.0.0.1: $Url"
    }

    if ($lower -match '192\.168\.') {
        $issues += "EXPO_PUBLIC_API_URL aponta para rede privada 192.168.*: $Url"
    }

    if ($lower -match '(^|[^0-9])10\.\d{1,3}\.\d{1,3}\.\d{1,3}') {
        $issues += "EXPO_PUBLIC_API_URL aponta para IP privado 10.*: $Url"
    }

    if ($lower -match '172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}') {
        $issues += "EXPO_PUBLIC_API_URL aponta para IP privado 172.16-172.31.x: $Url"
    }

    if ($Url -ne $RequiredApiUrl) {
        $issues += "EXPO_PUBLIC_API_URL deve ser exatamente $RequiredApiUrl (atual: $Url)"
    }

    return $issues
}

function Get-DistScanExtensions {
    return @(".js", ".html", ".css", ".json", ".map")
}

function Test-DistBundleContent {
    param([string]$Root)

    if (-not (Test-Path -LiteralPath $Root)) {
        throw "Pasta dist não encontrada: $Root (execute expo export antes da validação pós-build)"
    }

    $extensions = Get-DistScanExtensions
    $files = Get-ChildItem -LiteralPath $Root -Recurse -File |
        Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() }

    if ($files.Count -eq 0) {
        throw "Nenhum arquivo para validar em $Root"
    }

    # URLs de API de desenvolvimento (porta 9000 / BASEAPI). Evita falso positivo de libs (axios, expo-linking, html5-qrcode).
    $forbiddenPatterns = @(
        @{ Label = "http://192.168.*"; Regex = 'http://192\.168\.\d{1,3}\.\d{1,3}(:\d+)?' },
        @{ Label = "http://localhost:9000"; Regex = 'http://localhost:9000' },
        @{ Label = "http://127.0.0.1:9000"; Regex = 'http://127\.0\.0\.1:9000' },
        @{ Label = "http://10.* (IP privado, API)"; Regex = 'http://10\.\d{1,3}\.\d{1,3}\.\d{1,3}:9000' },
        @{ Label = "http://172.16-172.31.* (IP privado, API)"; Regex = 'http://172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:9000' },
        @{ Label = "BASEAPI com http (api.tsx embutido)"; Regex = '\["http://' }
    )

    $requiredLiteral = $RequiredApiUrl
    $foundRequired = $false
    $hits = [System.Collections.Generic.List[object]]::new()

    foreach ($file in $files) {
        $content = [System.IO.File]::ReadAllText($file.FullName)

        if ($content.Contains($requiredLiteral)) {
            $foundRequired = $true
        }

        foreach ($pat in $forbiddenPatterns) {
            if ($content -match $pat.Regex) {
                $hits.Add([pscustomobject]@{
                        File    = $file.FullName
                        Pattern = $pat.Label
                    })
            }
        }

    }

    return @{
        FoundRequired = $foundRequired
        Hits          = $hits
        FileCount     = $files.Count
    }
}

function Write-ErrorAndExit {
    param([string[]]$Messages)

    Write-Host ""
    Write-Host "ERRO DE VALIDACAO DE DEPLOY" -ForegroundColor Red
    foreach ($m in $Messages) {
        Write-Host "  - $m" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
}

if ($Phase -eq "PreExport") {
    Write-Host "Validando ticket-ReactNative/.env antes do build..." -ForegroundColor Cyan

    $envPath = Join-Path $scriptRoot $EnvFile
    try {
        $apiUrl = Read-ExpoPublicApiUrlFromEnv -Path $envPath
    }
    catch {
        Write-ErrorAndExit @($_.Exception.Message)
    }

    $issues = Test-PrivateOrDevApiUrl -Url $apiUrl
    if ($issues.Count -gt 0) {
        Write-ErrorAndExit $issues
    }

    Write-Host "OK: EXPO_PUBLIC_API_URL=$apiUrl" -ForegroundColor Green
    exit 0
}

if ($Phase -eq "PostExport") {
    Write-Host "Validando bundle em '$DistDir' antes do upload S3..." -ForegroundColor Cyan

    $distPath = Join-Path $scriptRoot $DistDir
    try {
        $result = Test-DistBundleContent -Root $distPath
    }
    catch {
        Write-ErrorAndExit @($_.Exception.Message)
    }

    $messages = @()

    if (-not $result.FoundRequired) {
        $messages += "Bundle não contém a URL obrigatória: $RequiredApiUrl (arquivos verificados: $($result.FileCount))"
    }

    if ($result.Hits.Count -gt 0) {
        $grouped = $result.Hits | Group-Object File, Pattern
        foreach ($g in $grouped) {
            $file = ($g.Group[0].File)
            $patterns = ($g.Group | ForEach-Object { $_.Pattern }) -join ", "
            $messages += "$file -> $patterns"
        }
    }

    if ($messages.Count -gt 0) {
        Write-ErrorAndExit $messages
    }

    Write-Host "OK: bundle contém $RequiredApiUrl e nenhum indicador de API de desenvolvimento ($($result.FileCount) arquivos)." -ForegroundColor Green
    exit 0
}
