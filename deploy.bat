@echo off
setlocal EnableExtensions

REM ⚙️ CONFIGURAÇÕES
set "BUILD_DIR=dist"
set "S3_BUCKET=s3://jangoingressos.com.br"
set "CLOUDFRONT_ID=E1YKYN2NJQ9CSB"
set "PROD_API_URL=https://api.jangoingressos.com.br"

cd /d "%~dp0"

echo.
echo === Validacao pre-build (.env) ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-checks.ps1" -Phase PreExport
if errorlevel 1 (
  echo.
  echo Deploy abortado: corrija o .env antes de continuar.
  exit /b 1
)

echo.
echo API DE PRODUCAO: %PROD_API_URL%
set /p DEPLOY_CONFIRM=Confirma deploy para S3 e invalidacao CloudFront? (S/N): 
if /I not "%DEPLOY_CONFIRM%"=="S" (
  echo Deploy cancelado pelo usuario.
  exit /b 1
)

echo.
echo ▶️  Iniciando o build do projeto...
REM --clear: garante que EXPO_PUBLIC_* do .env atual seja embutido (evita cache Metro com API antiga)
call npx expo export --platform web --clear
if errorlevel 1 (
  echo.
  echo Deploy abortado: expo export falhou.
  exit /b 1
)

echo.
echo === Validacao pos-build (dist) ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-checks.ps1" -Phase PostExport -DistDir "%BUILD_DIR%"
if errorlevel 1 (
  echo.
  echo Deploy abortado: bundle contem URL de desenvolvimento ou nao contem a API de producao.
  echo Nenhum arquivo foi enviado ao S3.
  exit /b 1
)

echo 🚀 Enviando arquivos para o S3...
aws s3 sync %BUILD_DIR% %S3_BUCKET% --delete --acl public-read
if errorlevel 1 (
  echo.
  echo Erro ao sincronizar com o S3.
  exit /b 1
)

echo 🧹 Limpando cache do CloudFront...
aws cloudfront create-invalidation --distribution-id %CLOUDFRONT_ID% --paths "/*"
if errorlevel 1 (
  echo.
  echo Erro ao invalidar o CloudFront.
  exit /b 1
)

echo ✅ Deploy finalizado com sucesso!
pause
endlocal
