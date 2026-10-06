# Privacy Policy for GitHub Project Start Date

**Last updated:** October 6, 2026

## 1. Overview
**GitHub Project Start Date** is an open-source browser extension developed by **Mustafa Esat Temel**. This privacy policy explains our practices regarding data privacy and the usage of browser permissions.

## 2. No Data Collection
- **Zero Personal Data:** The extension does not collect, record, log, transmit, or sell any personal information, browsing history, keystrokes, IP addresses, or user credentials.
- **Local Execution:** 100% of the extension's code runs locally in your browser sandbox.

## 3. Permissions Justification
The extension requests only the minimum permissions necessary to function:
- **`activeTab`**: Allows the extension to check if the current active tab is a GitHub repository page when you interact with the extension.
- **`scripting`**: Used to extract repository creation metadata embedded in the GitHub page DOM.
- **`host_permissions` (`https://github.com/*`, `https://api.github.com/*`)**: Required strictly to display repository start dates on GitHub pages and query GitHub's public REST API for creation timestamps.

## 4. Third-Party Sharing
We do not use any analytics services (such as Google Analytics), telemetry, advertisements, or tracking scripts. The extension communicates solely with official GitHub endpoints (`github.com` and `api.github.com`) to retrieve repository start dates. No user data is ever transmitted to any third party.

## 5. Security
Because the extension does not collect or transmit user data over the internet to any external server, there is no risk of your personal data being intercepted or compromised through this extension.

## 6. Open Source
The full source code of this extension is publicly auditable and transparent on GitHub:  
https://github.com/MustafaEsatTemel/Github-Project-Start-Date

## 7. Contact
If you have any questions or concerns regarding this Privacy Policy, you can reach out via:
- **Developer:** Mustafa Esat Temel
- **GitHub:** https://github.com/MustafaEsatTemel
- **Issue Tracker:** https://github.com/MustafaEsatTemel/Github-Project-Start-Date/issues
