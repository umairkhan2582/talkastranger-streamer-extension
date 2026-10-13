// TalkAStranger Content Script Bridge
// Injected into https://talkastranger.com/* to automatically link session

(function() {
  function syncAuthWithExtension() {
    try {
      const userRaw = localStorage.getItem("user") || localStorage.getItem("tas_user");
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (userRaw || token) {
        let username = "creator";
        if (userRaw) {
          try {
            const parsed = JSON.parse(userRaw);
            username = parsed.username || parsed.name || username;
          } catch(e) {
            username = userRaw;
          }
        }
        chrome.runtime.sendMessage({
          type: "SET_AUTH",
          payload: { username, token }
        });
      }
    } catch(e) {}
  }

  // Sync on load
  syncAuthWithExtension();

  // Listen for storage events (e.g. login/logout)
  window.addEventListener("storage", syncAuthWithExtension);
})();
