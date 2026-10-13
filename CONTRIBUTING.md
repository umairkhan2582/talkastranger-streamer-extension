# Contributing to TalkAStranger Streamer Companion Extension

Thank you for your interest in contributing to the **TalkAStranger Streamer Companion Extension**! We welcome contributions from developers, creators, and community members of all skill levels.

---

## 📜 Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for everyone. Please be respectful and constructive in all discussions, issues, and pull requests.

---

## 🛠️ Local Development Setup

The extension is built with modern, zero-build vanilla ES modules, CSS3, and standard Web APIs (Manifest V3, WebRTC, Web Audio API). You do not need complex toolchains, bundlers, or heavy npm installs to test changes.

### 1. Clone Your Fork
```bash
git clone https://github.com/<your-username>/talkastranger-streamer-extension.git
cd talkastranger-streamer-extension
```

### 2. Load into Chrome
1. Open Google Chrome and go to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the extension directory.
4. Test changes directly in Chrome:
   - Click the extension icon to test `popup/`
   - Open the Side Panel (`Ctrl+Shift+P` / `Cmd+Shift+P` or via the Chrome Side Panel icon) to test `sidepanel/`
   - Click "Screen & Tab Studio" to test `capture/`
5. After modifying any file, simply click the 🔄 **Reload** icon on the extension card in `chrome://extensions`.

---

## 📝 Pull Request Guidelines

1. **Create a branch:**
   ```bash
   git checkout -b feature/my-cool-feature
   ```
2. **Keep it focused:** Each pull request should address a single bug fix or feature enhancement.
3. **Preserve vanilla architecture:** Avoid introducing heavy third-party dependencies or build steps unless discussed in an issue first.
4. **Test in Chromium:** Ensure the extension loads without console errors or warnings in `chrome://extensions` and DevTools.
5. **Commit message format:** Write clear, concise commit messages (e.g. `feat: add volume slider to sound alerts` or `fix: resolve overflow in sidepanel chat`).
6. **Submit PR:** Push your branch to GitHub and open a Pull Request targeting the `main` branch of `umairkhan2582/talkastranger-streamer-extension`.

---

## 🐛 Reporting Bugs

If you find a bug, please [open an issue](https://github.com/umairkhan2582/talkastranger-streamer-extension/issues) with:
- A descriptive title
- Steps to reproduce the bug
- Expected vs. actual behavior
- Chrome browser version and operating system (macOS / Windows / Linux)
- Screenshots or console logs if applicable

---

## 💡 Suggesting Enhancements

Have an idea to make the streamer companion even better? Open an issue tagged as `enhancement` and describe:
- What problem it solves
- Proposed solution or user experience
- How it benefits creators on TalkAStranger

---

## 📄 License

By contributing to this repository, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
