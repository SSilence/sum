@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\decompress\cli.js" %*
) ELSE (
  node  "%~dp0\..\decompress\cli.js" %*
)