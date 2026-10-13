// Popup logic
const popUsername = document.getElementById("popUsername");
const btnOpenSidepanel = document.getElementById("btnOpenSidepanel");
const btnOpenCapture = document.getElementById("btnOpenCapture");
const btnCopyOverlay = document.getElementById("btnCopyOverlay");
const copyOverlayLabel = document.getElementById("copyOverlayLabel");

chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
  if (state && state.username) {
    popUsername.textContent = `@${state.username}`;
  }
});

btnOpenSidepanel.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" });
  window.close();
});

btnOpenCapture.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OPEN_CAPTURE" });
  window.close();
});

btnCopyOverlay.addEventListener("click", () => {
  const username = popUsername.textContent.replace("@", "");
  const url = `https://talkastranger.com/overlay.html?streamerUsername=${encodeURIComponent(username)}`;
  navigator.clipboard.writeText(url).then(() => {
    copyOverlayLabel.textContent = "✓ Copied to clipboard!";
    setTimeout(() => { copyOverlayLabel.textContent = "Copy OBS Overlay URL"; }, 2000);
  });
});
