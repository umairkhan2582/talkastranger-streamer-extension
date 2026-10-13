// TalkAStranger Streamer Companion - Side Panel HUD Logic

let isLive = false;
let streamStartTime = null;
let timerInterval = null;
let audioAlerts = true;

const usernameLabel = document.getElementById("usernameLabel");
const statusBadge = document.getElementById("statusBadge");
const liveIndicator = document.getElementById("liveIndicator");
const viewersCount = document.getElementById("viewersCount");
const sparksCount = document.getElementById("sparksCount");
const streamTimer = document.getElementById("streamTimer");
const btnGoLive = document.getElementById("btnGoLive");
const goLiveText = document.getElementById("goLiveText");
const btnCopyOverlay = document.getElementById("btnCopyOverlay");
const toastMessage = document.getElementById("toastMessage");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const chatFeed = document.getElementById("chatFeed");
const chatComposerForm = document.getElementById("chatComposerForm");
const chatInput = document.getElementById("chatInput");
const giftAlertBanner = document.getElementById("giftAlertBanner");
const giftSender = document.getElementById("giftSender");
const giftMessage = document.getElementById("giftMessage");

// Play Web Audio synthetic notification chime
function playChime() {
  if (!audioAlerts) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function updateTimer() {
  if (!streamStartTime) {
    streamTimer.textContent = "00:00:00";
    return;
  }
  const diffSec = Math.floor((Date.now() - streamStartTime) / 1000);
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, "0");
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
  const secs = String(diffSec % 60).padStart(2, "0");
  streamTimer.textContent = `${hrs}:${mins}:${secs}`;
}

function syncUI(state) {
  if (state.username) {
    usernameLabel.textContent = `@${state.username}`;
  }
  isLive = !!state.isLive;
  if (isLive) {
    statusBadge.textContent = "LIVE";
    statusBadge.classList.add("live");
    liveIndicator.classList.add("live");
    btnGoLive.classList.add("live");
    goLiveText.textContent = "Stop Broadcast";
    if (!streamStartTime) {
      streamStartTime = state.streamStartTime || Date.now();
    }
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
  } else {
    statusBadge.textContent = "OFFLINE";
    statusBadge.classList.remove("live");
    liveIndicator.classList.remove("live");
    btnGoLive.classList.remove("live");
    goLiveText.textContent = "Start Broadcast";
    streamStartTime = null;
    clearInterval(timerInterval);
    streamTimer.textContent = "00:00:00";
  }
  if (state.viewers !== undefined) viewersCount.textContent = state.viewers;
  if (state.sparks !== undefined) sparksCount.textContent = state.sparks;
}

// Initial state fetch
chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
  if (state) syncUI(state);
});

// Runtime messages
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "LIVE_STATE_CHANGED") {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
      if (state) syncUI(state);
    });
  } else if (msg.type === "AUTH_UPDATED") {
    syncUI(msg.payload);
  } else if (msg.type === "LIVE_EVENT") {
    handleIncomingEvent(msg.payload);
  }
});

function handleIncomingEvent(data) {
  if (data.type === "chat") {
    appendChatMessage(data.user || "Viewer", data.text, data.badge);
  } else if (data.type === "gift") {
    playChime();
    showGiftAlert(data.fromUser || "A Viewer", data.giftName || "Spark Burst", data.sparks || 25);
    const curr = parseInt(sparksCount.textContent, 10) || 0;
    sparksCount.textContent = curr + (data.sparks || 25);
  } else if (data.type === "viewers") {
    viewersCount.textContent = data.count || 0;
  }
}

function showGiftAlert(sender, gift, sparks) {
  giftSender.textContent = `${sender} sent a gift!`;
  giftMessage.textContent = `${gift} (+${sparks} Sparks)`;
  giftAlertBanner.classList.remove("hidden");
  setTimeout(() => {
    giftAlertBanner.classList.add("hidden");
  }, 4500);
}

function appendChatMessage(author, text, badge) {
  const msgEl = document.createElement("div");
  msgEl.className = "chat-msg";
  
  const authorEl = document.createElement("div");
  authorEl.className = "chat-author";
  authorEl.textContent = author;
  
  if (badge) {
    const badgeEl = document.createElement("span");
    badgeEl.className = "badge-vip";
    badgeEl.textContent = badge;
    authorEl.prepend(badgeEl);
  }
  
  const bodyEl = document.createElement("div");
  bodyEl.className = "chat-body";
  bodyEl.textContent = text;
  
  msgEl.appendChild(authorEl);
  msgEl.appendChild(bodyEl);
  chatFeed.appendChild(msgEl);
  chatFeed.scrollTop = chatFeed.scrollHeight;
}

// Controls
btnGoLive.addEventListener("click", () => {
  if (!isLive) {
    // Open dedicated screen/tab capture studio
    chrome.runtime.sendMessage({ type: "OPEN_CAPTURE" });
    chrome.runtime.sendMessage({ type: "TOGGLE_LIVE", payload: true });
  } else {
    chrome.runtime.sendMessage({ type: "TOGGLE_LIVE", payload: false });
  }
});

btnCopyOverlay.addEventListener("click", () => {
  const username = usernameLabel.textContent.replace("@", "");
  const url = `https://talkastranger.com/overlay.html?streamerUsername=${encodeURIComponent(username)}`;
  navigator.clipboard.writeText(url).then(() => {
    toastMessage.classList.remove("hidden");
    setTimeout(() => { toastMessage.classList.add("hidden"); }, 2500);
  });
});

soundToggleBtn.addEventListener("click", () => {
  audioAlerts = !audioAlerts;
  soundToggleBtn.style.opacity = audioAlerts ? 1 : 0.4;
});

chatComposerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const val = chatInput.value.trim();
  if (!val) return;
  const username = usernameLabel.textContent.replace("@", "");
  appendChatMessage(`@${username}`, val, "CREATOR");
  chatInput.value = "";
});
