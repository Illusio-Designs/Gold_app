#!/bin/bash

echo "🔧 iOS React Native Debugging Guide"
echo "=================================="
echo ""

echo "📱 Method 1: React Native CLI Logs"
echo "npx react-native log-ios"
echo ""

echo "📱 Method 2: iOS Device Console (macOS built-in)"
echo "Open Console.app → Select your device → Filter by 'Amrut'"
echo ""

echo "📱 Method 3: Xcode Console"
echo "1. Open Xcode"
echo "2. Window → Devices and Simulators"
echo "3. Select your device/simulator"
echo "4. Click 'Open Console'"
echo ""

echo "📱 Method 4: Terminal with device logs"
echo "xcrun simctl spawn booted log stream --predicate 'process == \"Amrut\"'"
echo ""

echo "🔧 Enable Debug Mode in React Native"
echo "1. In iOS Simulator: Cmd+D"
echo "2. In Physical Device: Shake the device"
echo "3. Select 'Debug' → 'Start Remote JS Debugging'"
echo ""

echo "🔧 React Native Debugger (Alternative)"
echo "brew install --cask react-native-debugger"
echo ""

echo "🔧 Metro Bundler Console"
echo "Check the Metro bundler terminal where you ran 'npx react-native start'"
echo "All console.log statements appear there"
echo ""

echo "🔧 Chrome DevTools"
echo "1. Enable Remote JS Debugging"
echo "2. Open Chrome"
echo "3. Go to chrome://inspect"
echo "4. Click 'Open dedicated DevTools for Node'"