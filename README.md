# TalkAStranger Streamer Companion (Chrome Extension Manifest V3)

A zero-friction companion HUD and live streamer extension for **[TalkAStranger](https://talkastranger.com)** creators.

---

## Features

- 🖥️ **Persistent Side Panel HUD (`chrome.sidePanel`)**: Stays docked on the right side of Chrome across any website (YouTube reaction streams, gaming, live coding).
- ⚡ **Real-Time Gift Alerts**: Live particle celebrations (*Spark Burst*, *Heart Rain*, *Crown Drop*) and sound alerts when viewers send gifts.
- 💬 **Live Chat Feed**: Streamers can read and reply to incoming stream messages in real-time with VIP and supporter badges.
- 🎥 **Zero-Config Screen & Tab Capture**: Broadcast any browser tab or desktop application directly to your TalkAStranger channel with synchronized audio without configuring OBS.
- 📋 **One-Click OBS Overlay Bridge**: Copy your authenticated transparent OBS/Streamlabs overlay link with a single tap.
- 🔔 **Desktop Push Notifications**: Background alerts for incoming calls and gifts even when Chrome is minimized.

---

## Quick Installation (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/umairkhan2582/talkastranger-streamer-extension.git
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `talkastranger-streamer-extension` folder.
6. Pin the extension to your toolbar. Log into **[TalkAStranger.com](https://talkastranger.com)** to automatically link your streamer account!

---

## Architecture & Permissions (Manifest V3)

- `sidePanel`: Powers the docking creator HUD.
- `tabCapture`: Enables direct tab audio/video streaming.
- `storage`: Retains creator preferences and session credentials securely.
- `notifications`: Delivers desktop alerts for gifts and call requests.

---

## License

MIT License — Copyright (c) 2026 TalkAStranger.
