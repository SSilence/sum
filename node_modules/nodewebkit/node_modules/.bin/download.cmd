@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\download\cli.js" %*
) ELSE (
  node  "%~dp0\..\download\cli.js" %*
)