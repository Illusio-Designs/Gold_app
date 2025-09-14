@echo off
echo Building AAB file for Amrut with package name fix...

cd android

echo Running gradle clean...
gradlew clean

echo Starting build process...
start /wait gradlew bundleRelease

echo Fixing autolinking file...
powershell -Command "(Get-Content 'app\build\generated\autolinking\src\main\java\com\facebook\react\ReactNativeApplicationEntryPoint.java') -replace 'com\.amrut\.BuildConfig', 'com.amrutkumargovinddasllp.BuildConfig' | Set-Content 'app\build\generated\autolinking\src\main\java\com\facebook\react\ReactNativeApplicationEntryPoint.java'"

echo Continuing build...
gradlew bundleRelease

echo AAB file generated in android/app/build/outputs/bundle/release/
pause
