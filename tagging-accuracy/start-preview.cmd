@echo off
cd /d "%~dp0"
set CI=1
set __UNSAFE_EXPO_HOME_DIRECTORY=%~dp0.expo-home
"C:\Program Files\nodejs\node.exe" ".\node_modules\expo\bin\cli" start --web --port 8089 >> ".\expo-8089.out.log" 2>> ".\expo-8089.err.log"
