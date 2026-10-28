// TalkAStranger Streamer Companion - Background Service Worker (Manifest V3)
// Coordinates session auth, broadcast state, and inter-window messaging.

let verifiedTokenInMemory = null;

const DEFAULT_STATE = {
  username: "Creator",
  accountId: null,
  clientId: null,
  avatar: null,
  authenticated: false,
  authError: null,
  isLive: false,
  isYouTubeLive: false,
  isDualLive: false,
  youtubeWatchUrl: null,
  youtubeSessionId: null,
  destination: "section", // "section" or "country"
  countryCode: null,
  countryName: null,
  streamTitle: "Live Screen Broadcast",
  hostClientId: null,
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
    const signedOut = {
      accountId: null,
      clientId: null,
      username: "Creator",
      avatar: null,
      authenticated: false,
      authError: null,
      isLive: false,
      isYouTubeLive: false,
      isDualLive: false,
      youtubeWatchUrl: null,
      youtubeSessionId: null,
      streamStartTime: null,
    };
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
      const invalid = {
        accountId: null,
        clientId: null,
        username: "Creator",
        avatar: null,
        authenticated: false,
        authError: "Your TalkAStranger session has expired. Sign in again.",
        isLive: false,
        streamStartTime: null,
      };
      saveState(invalid, (state) => broadcastToViews({ type: "AUTH_UPDATED", payload: state }));
      return { success: false, signedIn: false, error: invalid.authError };
    }
    if (!response.ok) throw new Error("Could not verify your TalkAStranger session.");
    const body = await response.json();
    const user = body?.user;
    if (!user?.id) throw new Error("TalkAStranger returned an incomplete account profile.");

    const clientId = user.clientId ? String(user.clientId) : null;
    if (!clientId) throw new Error("Your TalkAStranger account has no linked live-stream identity. Please open the site and contact support before broadcasting.");

    verifiedTokenInMemory = token;
    const update = {
      accountId: String(user.id),
      clientId: clientId ? String(clientId) : null,
      token: undefined,
      username: String(user.name || session?.nickname || "Creator"),
      avatar: user.avatar || null,
      authenticated: true,
      authError: null,
    };
    saveState(update, (state) => broadcastToViews({ type: "AUTH_UPDATED", payload: state }));
    return { success: true, signedIn: true, username: update.username, clientId: update.clientId };
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

  if (req.type === "GET_BROADCAST_AUTH") {
    getState((state) => {
      sendResponse({
        success: true,
        token: verifiedTokenInMemory,
        clientId: state.clientId,
        username: state.username,
        avatar: state.avatar,
        authenticated: !!state.authenticated && !!verifiedTokenInMemory,
      });
    });
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

  if (req.type === "BROADCAST_STATE_CHANGED") {
    const payload = req.payload || {};
    saveState({
      isLive: !!payload.isLive,
      isYouTubeLive: !!payload.isYouTubeLive,
      isDualLive: !!payload.isDualLive,
      youtubeWatchUrl: payload.youtubeWatchUrl || null,
      youtubeSessionId: payload.youtubeSessionId || null,
      destination: payload.destination || "section",
      countryCode: payload.countryCode || null,
      countryName: payload.countryName || null,
      streamTitle: payload.title || "Live Screen Broadcast",
      hostClientId: payload.hostClientId || null,
      viewers: typeof payload.viewers === "number" ? payload.viewers : 0,
      streamStartTime: payload.streamStartTime || null,
    }, (next) => {
      broadcastToViews({ type: "LIVE_STATE_CHANGED", payload: next });
      sendResponse({ success: true, state: next });
    });
    return true;
  }

  if (req.type === "STOP_BROADCAST") {
    broadcastToViews({ type: "COMMAND_STOP_BROADCAST" });
    sendResponse({ success: true });
    return true;
  }

  if (req.type === "SEND_CHAT") {
    broadcastToViews({ type: "COMMAND_SEND_CHAT", payload: req.payload });
    sendResponse({ success: true });
    return true;
  }

  if (req.type === "LIVE_EVENT") {
    broadcastToViews({ type: "LIVE_EVENT", payload: req.payload });
    sendResponse({ success: true });
    return true;
  }

  if (req.type === "LOGOUT") {
    verifiedTokenInMemory = null;
    const signedOut = {
      accountId: null,
      clientId: null,
      username: "Creator",
      avatar: null,
      authenticated: false,
      authError: null,
      isLive: false,
      isYouTubeLive: false,
      isDualLive: false,
      youtubeWatchUrl: null,
      youtubeSessionId: null,
      streamStartTime: null,
    };
    saveState(signedOut, (state) => {
      broadcastToViews({ type: "AUTH_UPDATED", payload: state });
      sendResponse({ success: true, state });
    });
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
    const query = req.payload?.mode === "dual" ? "?mode=dual" : "";
    chrome.windows.create({
      url: chrome.runtime.getURL("capture/capture.html" + query),
      type: "popup",
      width: 1040,
      height: 760
    }, (win) => {
      sendResponse({ success: true, windowId: win?.id });
    });
    return true;
  }
});
