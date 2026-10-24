// Minimal, read-only session bridge from TalkAStranger's own page to the extension.
// Never writes to site storage or injects code into the website.
(function() {
  function readCurrentSession() {
    try {
      return {
        token: localStorage.getItem("tas_auth_token") || null,
        nickname: localStorage.getItem("tas-pref-nickname") || localStorage.getItem("tas-swipe-nick") || null,
      };
    } catch (err) {
      return { token: null, nickname: null };
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

  // Content scripts cannot observe same-tab localStorage writes, so detect changes while this tab is open.
  sync(true);
  setInterval(() => sync(false), 3000);

  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req?.type === "REQUEST_PAGE_AUTH") {
      sendResponse({ success: true, session: readCurrentSession(), force: true });
      return true;
    }
  });
})();
