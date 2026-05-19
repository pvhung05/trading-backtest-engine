@ECHO OFF
SETLOCAL
SET "SCRIPT_DIR=%~dp0"
CALL "%SCRIPT_DIR%backtest-trading\mvnw.cmd" -f "%SCRIPT_DIR%pom.xml" %*
ENDLOCAL
