// TalkAStranger Streamer Companion - Background Service Worker (Manifest V3)

let activeSocket = null;
let reconnectTimer = null;

const DEFAULT_STATE = {
  username: "Creator",
  token: null,
  isLive: false,
  viewers: 0,
  sparks: 0,
  streamStartTime: null
};

// Initialize or load state
chrome.runtime.onInstalled.addListener(() => {
  console.log("[TAS Extension] Installed successfully.");
  chrome.storage.local.get(["tas_auth"], (res) => {
    if (!res.tas_auth) {
      chrome.storage.local.set({ tas_auth: DEFAULT_STATE });
    }
  });
});

// Broadcast event to popup and sidepanel
function broadcastToViews(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {
    // Views may be closed; ignore harmless delivery error
  });
}

// Connect to TalkAStranger real-time relay WebSocket
function connectWebSocket(token, username) {
  if (activeSocket) {
    try { activeSocket.close(); } catch(e) {}
  }
  
  const wsUrl = `wss://talkastranger.com/api/admin/relay?token=${encodeURIComponent(token || "")}&user=${encodeURIComponent(username || "")}`;
  try {
    activeSocket = new WebSocket(wsUrl);
  } catch (err) {
    console.warn("[TAS WS] Connection error:", err);
    return;
  }

  activeSocket.onopen = () => {
    console.log("[TAS WS] Connected to TalkAStranger real-time signaling.");
    broadcastToViews({ type: "SOCKET_STATUS", status: "connected" });
  };

  activeSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleLiveMessage(data);
    } catch (e) {
      console.error("[TAS WS] Invalid message format:", e);
    }
  };

  activeSocket.onclose = () => {
    console.log("[TAS WS] Disconnected. Reconnecting in 5s...");
    broadcastToViews({ type: "SOCKET_STATUS", status: "disconnected" });
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      chrome.storage.local.get(["tas_auth"], (res) => {
        if (res.tas_auth && res.tas_auth.token) {
          connectWebSocket(res.tas_auth.token, res.tas_auth.username);
        }
      });
    }, 5000);
  };
}

function handleLiveMessage(msg) {
  // Types: chat, gift, viewer_count, call_request
  if (msg.type === "gift") {
    // Show Chrome desktop push notification
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: `⚡ Gift Received! (+${msg.sparks || 10} Sparks)`,
      message: `${msg.fromUser || "A Viewer"} sent a ${msg.giftName || "Spark Burst"}!`,
      priority: 2
    });
  } else if (msg.type === "call_request") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "📞 Incoming Call Request",
      message: `${msg.fromUser || "A Viewer"} wants to connect live with you on TalkAStranger!`,
      priority: 2
    });
  }
  
  // Forward to sidepanel HUD
  broadcastToViews({ type: "LIVE_EVENT", payload: msg });
}

// Runtime message listener
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "GET_STATE") {
    chrome.storage.local.get(["tas_auth"], (res) => {
      sendResponse(res.tas_auth || DEFAULT_STATE);
    });
    return true;
  }

  if (req.type === "SET_AUTH") {
    chrome.storage.local.get(["tas_auth"], (res) => {
      const updated = { ...(res.tas_auth || DEFAULT_STATE), ...req.payload };
      chrome.storage.local.set({ tas_auth: updated }, () => {
        connectWebSocket(updated.token, updated.username);
        broadcastToViews({ type: "AUTH_UPDATED", payload: updated });
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (req.type === "TOGGLE_LIVE") {
    chrome.storage.local.get(["tas_auth"], (res) => {
      const current = res.tas_auth || DEFAULT_STATE;
      const isLive = req.payload !== undefined ? req.payload : !current.isLive;
      const updated = {
        ...current,
        isLive,
        streamStartTime: isLive ? Date.now() : null
      };
      chrome.storage.local.set({ tas_auth: updated }, () => {
        broadcastToViews({ type: "LIVE_STATE_CHANGED", isLive });
        sendResponse({ isLive });
      });
    });
    return true;
  }

  if (req.type === "OPEN_SIDE_PANEL") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && chrome.sidePanel && chrome.sidePanel.open) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId }).then(() => {
          sendResponse({ success: true });
        }).catch((err) => {
          sendResponse({ success: false, error: err.message });
        });
      }
    });
    return true;
  }

  if (req.type === "OPEN_CAPTURE") {
    chrome.windows.create({
      url: chrome.runtime.getURL("capture/capture.html"),
      type: "popup",
      width: 900,
      height: 680
    }, (win) => {
      sendResponse({ success: true, windowId: win.id });
    });
    return true;
  }
});
