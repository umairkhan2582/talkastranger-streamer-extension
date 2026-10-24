// TalkAStranger Streamer Companion - Background Service Worker (Manifest V3)
// Auth is linked from the user's existing TalkAStranger browser session.
// This extension only validates the session through the site's read-only /api/auth/me route.
// It does not modify the site, its data, or its services.

let verifiedTokenInMemory = null;

const DEFAULT_STATE = {
  username: "Creator",
  accountId: null,
  authenticated: false,
  authError: null,
  isLive: false,
  viewers: 0,
  sparks: 0,
  streamStartTime: null,
};

function getState(callback) {
  chrome.storage.local.get(["tas_auth"], (res) => callback({ ...DEFAULT_STATE, ...(res.tas_auth || {}) }));
}

function saveState(update, callback) {
  getState((current) => {
    const next = { ...current, ...update };
    chrome.storage.local.set({ tas_auth: next }, () => callback?.(next));
  });
}

function broadcastToViews(msg) {
  try { chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError); } catch {}
}

async function validateAndSaveSession(session, force = false) {
  const token = typeof session?.token === "string" ? session.token.trim() : "";
  if (!token) {
    verifiedTokenInMemory = null;
    const signedOut = { accountId: null, username: "Creator", authenticated: false, authError: null };
    saveState(signedOut, (state) => broadcastToViews({ type: "AUTH_UPDATED", payload: state }));
    return { success: true, signedIn: false };
  }

  try {
    const response = await fetch("https://talkastranger.com/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
    });
    if (response.status === 401 || response.status === 403) {
      verifiedTokenInMemory = null;
      const invalid = { accountId: null, username: "Creator", authenticated: false, authError: "Your TalkAStranger session has expired. Sign in again." };
      saveState(invalid, (state) => broadcastToViews({ type: "AUTH_UPDATED", payload: state }));
      return { success: false, signedIn: false, error: invalid.authError };
    }
    if (!response.ok) throw new Error("Could not verify your TalkAStranger session.");
    const body = await response.json();
    const user = body?.user;
    if (!user?.id) throw new Error("TalkAStranger returned an incomplete account profile.");

    verifiedTokenInMemory = token;
    const update = {
      accountId: String(user.id),
      username: String(user.name || session.nickname || "Creator"),
      authenticated: true,
      authError: null,
    };
    saveState(update, (state) => broadcastToViews({ type: "AUTH_UPDATED", payload: state }));
    return { success: true, signedIn: true, username: update.username };
  } catch (error) {
    const message = error?.message || "Could not verify your TalkAStranger session. Check your connection and retry.";
    saveState({ authError: message }, (state) => broadcastToViews({ type: "AUTH_UPDATED", payload: state }));
    return { success: false, signedIn: false, error: message };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  getState((state) => chrome.storage.local.set({ tas_auth: state }));
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "GET_STATE") {
    getState(sendResponse);
    return true;
  }

  if (req.type === "SYNC_SESSION") {
    validateAndSaveSession(req.payload || {}).then(sendResponse);
    return true;
  }

  if (req.type === "REQUEST_PAGE_AUTH") {
    chrome.tabs.query({ url: "https://talkastranger.com/*" }, (tabs) => {
      const tab = tabs.find((candidate) => candidate.id != null);
      if (!tab?.id) {
        if (!verifiedTokenInMemory) {
          saveState({ authenticated: false }, (state) => sendResponse({ success: true, signedIn: false, error: "Open a signed-in TalkAStranger tab to reconnect your session." }));
        } else {
          getState((state) => sendResponse({ success: true, signedIn: !!state.authenticated, error: state.authError }));
        }
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "REQUEST_PAGE_AUTH" }, (reply) => {
        if (chrome.runtime.lastError || !reply?.session) {
          sendResponse({ success: false, error: "Refresh the TalkAStranger tab, then try again." });
          return;
        }
        validateAndSaveSession(reply.session, !!reply.force).then(sendResponse);
      });
    });
    return true;
  }

  if (req.type === "LOGOUT") {
    verifiedTokenInMemory = null;
    const signedOut = { accountId: null, username: "Creator", authenticated: false, authError: null, isLive: false, streamStartTime: null };
    saveState(signedOut, (state) => {
      broadcastToViews({ type: "AUTH_UPDATED", payload: state });
      sendResponse({ success: true, state });
    });
    return true;
  }

  if (req.type === "SEND_CHAT") {
    sendResponse({ success: false, error: "Live chat is not connected in this extension build." });
    return true;
  }

  if (req.type === "TOGGLE_LIVE") {
    sendResponse({ success: false, error: "Start or manage a live broadcast from TalkAStranger Creator Studio." });
    return true;
  }

  if (req.type === "OPEN_SIDE_PANEL") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && chrome.sidePanel?.open) {
        chrome.sidePanel.open({ windowId: tab.windowId }).then(() => sendResponse({ success: true })).catch((err) => sendResponse({ success: false, error: err.message }));
      } else sendResponse({ success: false, error: "Side panel is unavailable in this browser." });
    });
    return true;
  }

  if (req.type === "OPEN_CAPTURE") {
    chrome.windows.create({ url: chrome.runtime.getURL("capture/capture.html"), type: "popup", width: 900, height: 680 }, (win) => {
      sendResponse({ success: true, windowId: win?.id });
    });
    return true;
  }
});
