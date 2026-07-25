import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Amrut",
      in: window,
      launchOptions: launchOptions
    )

    // Screenshot / screen-recording prevention (parity with Android's
    // FLAG_SECURE in MainActivity.kt). iOS has no public "secure window" flag,
    // so we use the well-known secure-UITextField trick: a hidden secure text
    // field's render layer refuses to be captured, and by re-parenting the
    // window's layer under it, the entire app screen comes out BLANK in
    // screenshots and screen recordings while staying fully visible live.
    enableScreenshotPrevention()

    return true
  }

  private func enableScreenshotPrevention() {
    guard let window = self.window else { return }
    let secureField = UITextField()
    secureField.isSecureTextEntry = true
    secureField.isUserInteractionEnabled = false

    window.addSubview(secureField)
    secureField.centerXAnchor.constraint(equalTo: window.centerXAnchor).isActive = true
    secureField.centerYAnchor.constraint(equalTo: window.centerYAnchor).isActive = true

    // Move the window's real content layer to live INSIDE the secure field's
    // protected canvas, then keep the field itself out of the layout.
    window.layer.superlayer?.addSublayer(secureField.layer)
    secureField.layer.sublayers?.last?.addSublayer(window.layer)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
