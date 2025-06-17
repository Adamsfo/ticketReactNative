@echo off

REM ⚙️ CONFIGURAÇÕES
set BUILD_DIR=dist
set S3_BUCKET=s3://jangoingressos.com.br
set CLOUDFRONT_ID=E1YKYN2NJQ9CSB

echo ▶️  Iniciando o build do projeto...
npx expo export --platform web

echo 🚀 Enviando arquivos para o S3...
aws s3 sync %BUILD_DIR% %S3_BUCKET% --delete --acl public-read

echo 🧹 Limpando cache do CloudFront...
aws cloudfront create-invalidation --distribution-id %CLOUDFRONT_ID% --paths "/*"

echo ✅ Deploy finalizado com sucesso!
pause