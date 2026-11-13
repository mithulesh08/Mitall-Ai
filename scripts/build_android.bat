@echo off
REM ==============================================================================
REM MITALL Universal Personal AI Platform - Windows Android Build Automation
REM ==============================================================================

echo [1/4] Building MITALL Web Assets...
call npm run build

echo [2/4] Syncing Capacitor Android Project...
call npx cap sync android

echo [3/4] Compiling Android APK...
cd android
if exist gradlew.bat (
    call gradlew.bat assembleDebug
    call gradlew.bat bundleRelease
) else (
    echo Gradle wrapper not found.
)
cd ..

echo [4/4] Done! APK available in android/app/build/outputs/apk/debug/app-debug.apk
pause
