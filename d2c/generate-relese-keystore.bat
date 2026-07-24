@echo off
echo ================================================
echo    Amrut App - Release Keystore Generator
echo ================================================
echo.

cd android\app

echo Generating release keystore...
echo Please provide the following information when prompted:
echo.

keytool -genkey -v -keystore amrut-release-key.keystore -alias amrut-key-alias -keyalg RSA -keysize 2048 -validity 10000

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo    Keystore generated successfully!
    echo ================================================
    echo.
    echo Keystore location: android\app\amrut-release-key.keystore
    echo.
    echo IMPORTANT: 
    echo 1. Keep your keystore file and passwords safe!
    echo 2. You'll need them for all future app updates
    echo 3. If you lose them, you cannot update your app on Play Store
    echo.
) else (
    echo.
    echo ================================================
    echo    Error generating keystore!
    echo ================================================
    echo Please check the error messages above and try again.
)

pause