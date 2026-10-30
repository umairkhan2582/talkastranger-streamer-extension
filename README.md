# TalkAStranger Streamer Companion Extension

[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://github.com/umairkhan2582/talkastranger-streamer-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success)](https://talkastranger.com/developers)
[![Platform: Chrome | Edge | Brave](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-violet)](https://github.com/umairkhan2582/talkastranger-streamer-extension)

> **Official open-source companion extension for [TalkAStranger](https://talkastranger.com) creators.**  
> Broadcast your screen or tab directly to TalkAStranger Live Streams or a supported Country LIVE lane using the site’s existing live session and WebRTC signaling.

---

## 🌟 Key Features

### 🟣 Manifest V3 Side Panel HUD
- **Always Docked:** Stays pinned beside your tabs while streaming, browsing, or gaming.
- **Creator Metrics:** Live viewer counter, total Sparks tally, and active broadcast duration timer.
- **Sound Alert Toggles:** One-click mute/unmute for synthesized Web Audio gift alerts.

### 💬 Live Chat
- View messages received through the existing TalkAStranger live signaling connection.
- Send comments while signed in and broadcasting.

### 🎁 Animated Gift & Spark Alerts
- **Interactive Banners:** Animated drop-down gift alerts featuring **TASSY** the official mascot.
- **Spark Celebrations:** Multi-tier gift animations including *Spark Burst*, *Heart Rain*, and *Crown Drop*.
- **Synthesized Audio Chimes:** Built-in Web Audio API alerts that require zero external MP3 assets or audio permissions.

### 🎥 Broadcaster Studio (Screen & Tab Capture)
- Choose a browser tab, application window or display using native `getDisplayMedia`.
- Send captured audio/video to viewers through the site’s existing per-viewer WebRTC signaling.
- Choose 720p or 1080p capture preferences. Actual frame rate depends on browser and hardware.

### 🔴 Simultaneous Dual Broadcast (YouTube Live + TalkAStranger)
- **Go Live on Both:** One-click simultaneous broadcast to both TalkAStranger and your linked YouTube Live channel.
- **Unified Media Pipeline:** A single screen capture feeds TalkAStranger WebRTC viewer peers and high-bitrate YouTube RTMP relay via MediaRecorder.
- **Channel Link Detection:** In-studio YouTube account linking status pill via `/api/youtube/status` and `/api/youtube/auth-url`.
- **Live HUD Links:** Real-time clickable YouTube stream watch link alongside TalkAStranger viewer link.

### ⚡ Quick-Action Toolbar Popover
- 1-click **Open Side Panel HUD** dock.
- 1-click **Launch Broadcaster Studio**.
- 1-click **Copy OBS / Streamlabs Browser Source URL** (`https://talkastranger.com/overlay.html`).

---

## 🚀 Quick Start / Installation

Because this extension uses Chrome's modern **Manifest V3 Side Panel API**, it runs on any desktop Chromium browser (Google Chrome, Microsoft Edge, Brave, Arc, Opera) running version **116 or higher**.

### Method 1: Download Pre-packaged ZIP (Fastest)
1. Download the latest ready-to-load ZIP:  
   👉 **[Download talkastranger-streamer-extension-v1.0.2.zip](https://talkastranger.com/talkastranger-streamer-extension-v1.0.2.zip)**
2. Unzip the downloaded file into a folder on your computer (e.g. `talkastranger-streamer-extension`).
3. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
4. Turn ON **Developer mode** using the toggle switch in the top-right corner.
5. Click **Load unpacked** (top-left button) and select the extracted folder.
6. Click the Extensions puzzle icon in Chrome and pin **TalkAStranger Streamer Companion** to your toolbar!

### ⚠️ Important: Avoiding "Manifest file is missing or unreadable"
When loading in Chrome via **Load unpacked**:
1. **Extract the ZIP file** — Chrome cannot load a `.zip` file directly.
2. **Select the extracted folder containing `manifest.json`** — Ensure you select the folder where `manifest.json` is located, not an outer parent directory.

### Method 2: Clone from GitHub
```bash
git clone https://github.com/umairkhan2582/talkastranger-streamer-extension.git
```
Then follow steps 3–6 above selecting the cloned repository directory.

---

## 📁 Repository Structure

```text
talkastranger-streamer-extension/
├── manifest.json              # Chrome Manifest V3 configuration
├── background.js              # Service worker handling WebSocket pings & alerts
├── icons/
│   ├── logo.svg               # Official TalkAStranger purple camera logo
│   ├── tassy.svg              # Official TASSY mascot vector
│   ├── icon16.png             # 16x16 toolbar icon
│   ├── icon48.png             # 48x48 extensions management icon
│   └── icon128.png            # 128x128 Chrome Web Store icon
├── popup/
│   ├── popup.html             # Toolbar quick-action dropdown
│   ├── popup.js               # Popup interactions & OBS overlay clipboard
│   └── popup.css              # Dark neon gradient theme
├── sidepanel/
│   ├── sidepanel.html         # Manifest V3 dockable HUD
│   ├── sidepanel.js           # Live chat, gift animations & Web Audio chime
│   └── sidepanel.css          # Creator HUD responsive layout
├── capture/
│   ├── capture.html           # Screen & Tab Studio monitor
│   ├── capture.js             # WebRTC getDisplayMedia & audio visualizer
│   └── capture.css            # Studio dark mode theme
├── content/
│   └── bridge.js              # Non-intrusive session bridge for talkastranger.com
├── CONTRIBUTING.md            # Guidelines for open-source contributors
├── LICENSE                    # MIT Open Source License
└── README.md                  # This file
```

---

## 🔒 Permissions & Security

TalkAStranger values creator privacy. This extension requests **only** the minimum permissions required to perform its functions:

| Permission | Purpose |
|---|---|
| `sidePanel` | Allows docking the live chat & gift alert HUD alongside your browser tabs. |
| `storage` | Saves your local UI preferences (audio mute status, quality selection). |
| `tabCapture` | Enables video stream capture when you explicitly broadcast a screen or tab. |
| `host_permissions` | Strictly scoped to `https://talkastranger.com/*` and `wss://talkastranger.com/*`. |

- **Zero Tracking:** No third-party tracking scripts, analytics SDKs, or external network requests.
- **No Secret Storage:** Extension communicates with the main site via secure client-side cookies/tokens; zero passwords or private keys are stored.
- **Privacy Policy:** Read our complete privacy policy at [talkastranger.com/privacy](https://talkastranger.com/privacy).

---

## 🛣️ Chrome Web Store Roadmap

- [x] Manifest V3 compliant architecture
- [x] Side Panel HUD & Broadcaster Studio implementation
- [x] High-resolution brand assets (Logo & TASSY Mascot)
- [x] Real-world automated Chromium integration testing
- [x] Public GitHub repository & open-source release
- [ ] Chrome Web Store Developer Console submission
- [ ] One-click direct install from Chrome Web Store

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions from the community are warmly welcomed!  
Please read our [Contributing Guide](CONTRIBUTING.md) to get started with local development and submitting pull requests.

---

## 📄 License

This project is open-source under the terms of the **[MIT License](LICENSE)**.

---

## 🌐 Community & Links

- **Main Platform:** [talkastranger.com](https://talkastranger.com)
- **Developer Portal:** [talkastranger.com/developers](https://talkastranger.com/developers)
- **Creator Studio:** [talkastranger.com/creator-studio](https://talkastranger.com/creator-studio)
- **OBS Overlays:** [talkastranger-stream-overlays](https://github.com/umairkhan2582/talkastranger-stream-overlays)
- **Live Linker SDK:** [talkastranger-live-linker-sdk](https://github.com/umairkhan2582/talkastranger-live-linker-sdk)

## Account sign-in

The extension uses the TalkAStranger account already signed in within a `https://talkastranger.com` browser tab. The extension reads the site’s `tas_auth_token` from that page and validates it with `GET /api/auth/me`. It does not ask for or store your password. For live broadcasting, it also uses the site’s existing authenticated live-start endpoint and WebSocket signaling. Starting/stopping a broadcast changes live session state, as expected; it does not require a server restart or website deployment. You must keep Broadcaster Studio open while live. If the browser or network interrupts, the broadcast may stop or reconnect.

The extension package only changes the browser extension. It does not deploy website code or restart any production service.
