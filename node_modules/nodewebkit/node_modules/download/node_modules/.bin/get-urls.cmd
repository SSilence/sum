@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\get-urls\cli.js" %*
) ELSE (
  node  "%~dp0\..\get-urls\cli.js" %*
)