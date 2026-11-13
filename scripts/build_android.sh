#!/usr/bin/env bash
# ==============================================================================
# MITALL Universal Personal AI Platform - Android Build Automation Script
# Builds Web production assets and compiles native Android APK / AAB
# ==============================================================================

set -e

echo "=========================================================="
echo "  [1/4] Building MITALL Web Production Assets (Vite)     "
echo "=========================================================="
npm run build

echo "=========================================================="
echo "  [2/4] Synchronizing Capacitor Native Android Platform   "
echo "=========================================================="
npx cap sync android

echo "=========================================================="
echo "  [3/4] Compiling Native Android Debug & Release Bundles  "
echo "=========================================================="
cd android

if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    echo "Building Debug APK (assembleDebug)..."
    ./gradlew assembleDebug || echo "Note: Android SDK required in local environment to compile APK"

    echo "Building Release Android App Bundle (bundleRelease)..."
    ./gradlew bundleRelease || echo "Note: Keystore required for signed release AAB"
else
    echo "Gradle wrapper not found, run 'npx cap add android' first."
fi

cd ..

echo "=========================================================="
echo "  [4/4] Output Locations:                                "
echo "  - Debug APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo "  - Release AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo "=========================================================="
echo "MITALL Android build workflow complete!"
