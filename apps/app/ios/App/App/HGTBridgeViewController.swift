import Capacitor
import UIKit
import WebKit

/// Capacitor's single WebView with an iOS-owned tab bar layered over its bottom
/// edge. The tab controllers intentionally stay transparent: UIKit owns the
/// tab interaction and Liquid Glass selection indicator, while Next.js keeps
/// ownership of the actual page content and history.
@objc(HGTBridgeViewController)
final class HGTBridgeViewController: CAPBridgeViewController, UITabBarControllerDelegate, WKScriptMessageHandler {
    private enum Tabs {
        static let messageHandler = "hgtNativeTabs"
        static let contentHeight: CGFloat = 49
        static let paths = ["/home", "/conversations", "/settings"]
    }

    private let tabController = UITabBarController()
    private let tabContainer = UIView()
    private var tabControllers: [UIViewController] = []

    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        configuration.userContentController.add(self, name: Tabs.messageHandler)
        return super.webView(with: frame, configuration: configuration)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        configureNativeTabs()
    }

    private func configureNativeTabs() {
        tabContainer.translatesAutoresizingMaskIntoConstraints = false
        tabContainer.backgroundColor = .clear
        tabContainer.isHidden = true
        tabContainer.clipsToBounds = false
        view.addSubview(tabContainer)

        NSLayoutConstraint.activate([
            tabContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tabContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tabContainer.topAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.bottomAnchor,
                constant: -Tabs.contentHeight
            ),
            tabContainer.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        addChild(tabController)
        tabController.delegate = self
        tabController.view.translatesAutoresizingMaskIntoConstraints = false
        tabController.view.backgroundColor = .clear
        tabController.view.isOpaque = false
        tabContainer.addSubview(tabController.view)

        NSLayoutConstraint.activate([
            tabController.view.leadingAnchor.constraint(equalTo: tabContainer.leadingAnchor),
            tabController.view.trailingAnchor.constraint(equalTo: tabContainer.trailingAnchor),
            tabController.view.topAnchor.constraint(equalTo: tabContainer.topAnchor),
            tabController.view.bottomAnchor.constraint(equalTo: tabContainer.bottomAnchor),
        ])
        tabController.didMove(toParent: self)

        let definitions: [(title: String, inactive: String, active: String, identifier: String)] = [
            ("홈", "house", "house.fill", "hgt-tab-home"),
            ("대화", "bubble.left.and.bubble.right", "bubble.left.and.bubble.right.fill", "hgt-tab-conversations"),
            ("설정", "gearshape", "gearshape.fill", "hgt-tab-settings"),
        ]

        tabControllers = definitions.map { definition in
            let controller = UIViewController()
            controller.view.backgroundColor = .clear
            controller.view.isOpaque = false
            controller.tabBarItem = UITabBarItem(
                title: definition.title,
                image: UIImage(systemName: definition.inactive),
                selectedImage: UIImage(systemName: definition.active)
            )
            controller.tabBarItem.accessibilityIdentifier = definition.identifier
            return controller
        }

        tabController.setViewControllers(tabControllers, animated: false)

        let tabBar = tabController.tabBar
        tabBar.accessibilityIdentifier = "hgt-native-tab-bar"
        tabBar.isTranslucent = true
        tabBar.itemPositioning = .fill
        tabBar.tintColor = UIColor(red: 1, green: 79 / 255, blue: 63 / 255, alpha: 1)
        tabBar.unselectedItemTintColor = .secondaryLabel
        tabBar.clipsToBounds = false

        // Do not set standardAppearance, backgroundImage, or a custom
        // selectionIndicatorImage here. With the iOS 26 SDK, leaving those
        // untouched is what enables the system Liquid Glass material and its
        // continuous touch-stretch selection animation.

    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Tabs.messageHandler,
              let payload = message.body as? [String: Any] else { return }

        let visible = payload["visible"] as? Bool ?? false
        let activeIndex = (payload["activeIndex"] as? NSNumber)?.intValue ?? 0
        let unread = payload["unread"] as? Bool ?? false

        DispatchQueue.main.async { [weak self] in
            self?.applyNativeTabState(visible: visible, activeIndex: activeIndex, unread: unread)
        }
    }

    private func applyNativeTabState(visible: Bool, activeIndex: Int, unread: Bool) {
        tabContainer.isHidden = !visible
        guard visible, !tabControllers.isEmpty else { return }

        let safeIndex = min(max(activeIndex, 0), tabControllers.count - 1)
        let selectedController = tabControllers[safeIndex]
        if tabController.selectedViewController !== selectedController {
            // Preserve the controller instances and only move selection. UIKit
            // can then animate one continuous glass droplet between tab slots.
            tabController.selectedViewController = selectedController
        }

        if tabControllers.indices.contains(1) {
            tabControllers[1].tabBarItem.badgeValue = unread ? "" : nil
            tabControllers[1].tabBarItem.badgeColor = UIColor(red: 1, green: 79 / 255, blue: 63 / 255, alpha: 1)
        }
    }

    func tabBarController(
        _ tabBarController: UITabBarController,
        didSelect viewController: UIViewController
    ) {
        guard let index = tabControllers.firstIndex(where: { $0 === viewController }),
              Tabs.paths.indices.contains(index) else { return }

        let path = Tabs.paths[index]
        let script = "window.dispatchEvent(new CustomEvent('hgt:native-tab', { detail: { path: '\(path)' } }));"
        webView?.evaluateJavaScript(script)
    }
}
