@echo off
echo Building AAB file for Amrut...

cd android
gradlew bundleRelease

echo AAB file generated in android/app/build/outputs/bundle/release/
pause
