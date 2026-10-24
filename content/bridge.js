// Minimal, read-only session bridge from TalkAStranger's own page to the extension.
// Never writes to site storage or injects code into the website.
(function() {
  function readCurrentSession() {
    try {
      return {
        token: localStorage.getItem("tas_auth_token") || null,
        nickname: localStorage.getItem("tas-pref-nickname") || localStorage.getItem("tas-swipe-nick") || null,
        clientId: localStorage.getItem("tas-client-id") || localStorage.getItem("tas_client_id") || null,
      };
    } catch (err) {
      return { token: null, nickname: null, clientId: null };
    }
  }

  let lastSerialized = "";
  function sync(force = false) {
    const session = readCurrentSession();
    const serialized = JSON.stringify(session);
    if (!force && serialized === lastSerialized) return;
    lastSerialized = serialized;
    try {
      chrome.runtime.sendMessage({ type: "SYNC_SESSION", payload: session }, () => {
        void chrome.runtime.lastError;
      });
    } catch {}
  }

  sync(true);
  setInterval(() => sync(false), 3000);

  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req?.type === "REQUEST_PAGE_AUTH") {
      sendResponse({ success: true, session: readCurrentSession(), force: true });
      return true;
    }
  });
})();
