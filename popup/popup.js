const popUsername = document.getElementById("popUsername");
const authStatus = document.getElementById("authStatus");
const authActions = document.getElementById("authActions");
const btnSignIn = document.getElementById("btnSignIn");
const btnRefresh = document.getElementById("btnRefresh");
const btnSignOut = document.getElementById("btnSignOut");
const connectionDot = document.getElementById("connectionDot");
const btnOpenSidepanel = document.getElementById("btnOpenSidepanel");
const btnOpenCapture = document.getElementById("btnOpenCapture");
const btnCopyOverlay = document.getElementById("btnCopyOverlay");
const copyOverlayLabel = document.getElementById("copyOverlayLabel");

function send(message, callback = () => {}) {
  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) callback(null, chrome.runtime.lastError.message);
    else callback(response, null);
  });
}

function render(state) {
  const signedIn = !!state?.authenticated;
  popUsername.textContent = signedIn ? `@${state.username || "Creator"}` : "Not signed in";
  authStatus.textContent = signedIn ? "Signed in with your TalkAStranger account." : "Sign in on TalkAStranger, then return here.";
  authActions.hidden = signedIn;
  btnSignOut.hidden = !signedIn;
  connectionDot.classList.toggle("offline", !state?.connected);
  connectionDot.title = state?.connected ? "Connected" : "Not connected";
}

function refreshAuth() {
  authStatus.textContent = "Checking the active TalkAStranger tab…";
  send({ type: "REQUEST_PAGE_AUTH" }, () => {
    send({ type: "GET_STATE" }, (state) => render(state || {}));
    setTimeout(() => send({ type: "GET_STATE" }, (state) => render(state || {})), 700);
  });
}

send({ type: "GET_STATE" }, (state) => {
  render(state || {});
  refreshAuth();
});

btnSignIn.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://talkastranger.com/" });
  authStatus.textContent = "Sign in on TalkAStranger, then click ‘I’m already signed in’.";
});
btnRefresh.addEventListener("click", refreshAuth);
btnSignOut.addEventListener("click", () => send({ type: "LOGOUT" }, () => send({ type: "GET_STATE" }, (state) => render(state || {}))));

btnOpenSidepanel.addEventListener("click", () => {
  send({ type: "OPEN_SIDE_PANEL" }, (result, err) => {
    if (err || result?.success === false) authStatus.textContent = result?.error || err || "Could not open the HUD.";
    else window.close();
  });
});
btnOpenCapture.addEventListener("click", () => {
  send({ type: "OPEN_CAPTURE" }, (result, err) => {
    if (!err && result?.success) window.close();
    else authStatus.textContent = err || "Could not open screen studio.";
  });
});
btnCopyOverlay.addEventListener("click", () => {
  const username = popUsername.textContent.replace(/^@/, "");
  const url = `https://talkastranger.com/overlay.html?streamerUsername=${encodeURIComponent(username === "Not signed in" ? "creator" : username)}`;
  navigator.clipboard.writeText(url).then(() => {
    copyOverlayLabel.textContent = "✓ Copied to clipboard!";
    setTimeout(() => { copyOverlayLabel.textContent = "Copy OBS Overlay URL"; }, 2000);
  }).catch(() => { copyOverlayLabel.textContent = "Clipboard unavailable"; });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "AUTH_UPDATED" || msg.type === "SOCKET_STATUS") {
    send({ type: "GET_STATE" }, (state) => render(state || {}));
  } else if (msg.type === "ACTION_ERROR") authStatus.textContent = msg.error;
});
