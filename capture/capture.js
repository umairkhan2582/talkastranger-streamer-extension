// TalkAStranger Screen & Tab Broadcaster
// Captures locally, registers a real TalkAStranger live session, and relays the
// selected MediaStream to viewers through the site's existing /ws live signaling.

const SITE = "https://talkastranger.com";
const STUN_ONLY = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
const COUNTRIES = [
  ["US", "United States", "🇺🇸"], ["GB", "United Kingdom", "🇬🇧"], ["DE", "Germany", "🇩🇪"], ["FR", "France", "🇫🇷"],
  ["IN", "India", "🇮🇳"], ["BR", "Brazil", "🇧🇷"], ["MX", "Mexico", "🇲🇽"], ["CA", "Canada", "🇨🇦"], ["AU", "Australia", "🇦🇺"],
  ["JP", "Japan", "🇯🇵"], ["KR", "South Korea", "🇰🇷"], ["IT", "Italy", "🇮🇹"], ["ES", "Spain", "🇪🇸"], ["NL", "Netherlands", "🇳🇱"],
  ["PL", "Poland", "🇵🇱"], ["RU", "Russia", "🇷🇺"], ["TR", "Turkey", "🇹🇷"], ["AR", "Argentina", "🇦🇷"], ["PH", "Philippines", "🇵🇭"],
  ["ID", "Indonesia", "🇮🇩"], ["PK", "Pakistan", "🇵🇰"], ["NG", "Nigeria", "🇳🇬"], ["EG", "Egypt", "🇪🇬"], ["SA", "Saudi Arabia", "🇸🇦"],
  ["ZA", "South Africa", "🇿🇦"], ["PT", "Portugal", "🇵🇹"], ["SE", "Sweden", "🇸🇪"], ["NO", "Norway", "🇳🇴"], ["DK", "Denmark", "🇩🇰"],
  ["FI", "Finland", "🇫🇮"], ["CH", "Switzerland", "🇨🇭"], ["AT", "Austria", "🇦🇹"], ["BE", "Belgium", "🇧🇪"], ["CZ", "Czech Republic", "🇨🇿"],
  ["GR", "Greece", "🇬🇷"], ["HU", "Hungary", "🇭🇺"], ["RO", "Romania", "🇷🇴"], ["UA", "Ukraine", "🇺🇦"], ["TH", "Thailand", "🇹🇭"],
  ["VN", "Vietnam", "🇻🇳"], ["MY", "Malaysia", "🇲🇾"], ["SG", "Singapore", "🇸🇬"], ["TW", "Taiwan", "🇹🇼"], ["HK", "Hong Kong", "🇭🇰"],
  ["AE", "United Arab Emirates", "🇦🇪"], ["IL", "Israel", "🇮🇱"], ["CO", "Colombia", "🇨🇴"], ["CL", "Chile", "🇨🇱"], ["PE", "Peru", "🇵🇪"],
  ["KE", "Kenya", "🇰🇪"], ["GH", "Ghana", "🇬🇭"], ["MA", "Morocco", "🇲🇦"], ["BD", "Bangladesh", "🇧🇩"], ["LK", "Sri Lanka", "🇱🇰"],
  ["NP", "Nepal", "🇳🇵"], ["MM", "Myanmar", "🇲🇲"], ["KH", "Cambodia", "🇰🇭"], ["LA", "Laos", "🇱🇦"], ["IE", "Ireland", "🇮🇪"],
  ["IS", "Iceland", "🇮🇸"], ["HR", "Croatia", "🇭🇷"], ["RS", "Serbia", "🇷🇸"], ["BG", "Bulgaria", "🇧🇬"], ["SK", "Slovakia", "🇸🇰"],
  ["SI", "Slovenia", "🇸🇮"], ["LT", "Lithuania", "🇱🇹"], ["LV", "Latvia", "🇱🇻"], ["EE", "Estonia", "🇪🇪"], ["CY", "Cyprus", "🇨🇾"],
  ["MT", "Malta", "🇲🇹"], ["LU", "Luxembourg", "🇱🇺"], ["NZ", "New Zealand", "🇳🇿"], ["UY", "Uruguay", "🇺🇾"], ["VE", "Venezuela", "🇻🇪"],
  ["EC", "Ecuador", "🇪🇨"], ["BO", "Bolivia", "🇧🇴"], ["CR", "Costa Rica", "🇨🇷"], ["PA", "Panama", "🇵🇦"], ["DO", "Dominican Republic", "🇩🇴"],
  ["CU", "Cuba", "🇨🇺"], ["JM", "Jamaica", "🇯🇲"], ["TT", "Trinidad and Tobago", "🇹🇹"], ["ET", "Ethiopia", "🇪🇹"], ["TZ", "Tanzania", "🇹🇿"],
  ["UG", "Uganda", "🇺🇬"], ["SN", "Senegal", "🇸🇳"], ["CI", "Ivory Coast", "🇨🇮"], ["CM", "Cameroon", "🇨🇲"], ["DZ", "Algeria", "🇩🇿"],
  ["TN", "Tunisia", "🇹🇳"], ["QA", "Qatar", "🇶🇦"], ["KW", "Kuwait", "🇰🇼"], ["BH", "Bahrain", "🇧🇭"], ["OM", "Oman", "🇴🇲"],
];

let activeStream = null;
let isBroadcasting = false;
let audioContext = null;
let analyser = null;
let animFrame = null;
let audioMeterFrame = null;
let ws = null;
let pingInterval = null;
let viewerCount = 0;
let startTime = null;
let timerInterval = null;
let reconnectTimer = null;
let pendingPeers = new Set();
let peers = new Map();
let viewerPeerIds = new Set();
let authState = { authenticated: false };
let broadcastConfig = null;
let countryLiveAvailable = false;
let isYouTubeLive = false;
let isDualBroadcasting = false;
let ytSessionId = null;
let ytWatchUrl = null;
let ytWs = null;
let ytRecorder = null;
let ytConnected = false;

const $ = (id) => document.getElementById(id);
const previewVideo = $("previewVideo");
const placeholder = $("noStreamPlaceholder");
const btnSelectSource = $("btnSelectSource");
const btnChangeSource = $("btnChangeSource");
const btnToggleBroadcast = $("btnToggleBroadcast");
const btnGoLiveBoth = $("btnGoLiveBoth");
const goLiveBothText = $("goLiveBothText");
const streamStatusBadge = $("streamStatusBadge");
const audioMeterFill = $("audioMeterFill");
const audioStateLabel = $("audioStateLabel");
const destinationDetails = $("countryDetailsPanel");
const countrySelect = $("countrySelect");
const countryLaneOption = $("optCountryLane");
const btnOpenLiveWatch = $("btnOpenLiveWatch");
const btnOpenYouTubeWatch = $("btnOpenYouTubeWatch");
const liveStatusText = $("liveStatusText");
const studioChatFeed = $("studioChatFeed");
const studioChatInput = $("studioChatInput");
const studioChatForm = $("studioChatForm");
const accountLabel = $("accountLabel");
const accountDot = $("accountDot");
const btnConnectAccount = $("btnConnectAccount");
const ytAccountLabel = $("ytAccountLabel");
const ytAccountDot = $("ytAccountDot");
const btnConnectYouTube = $("btnConnectYouTube");

function sendRuntime(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(response || null);
      });
    } catch { resolve(null); }
  });
}

function toast(message, isError = false) {
  const el = $("studioToast");
  el.textContent = message;
  el.classList.toggle("error", isError);
  el.classList.remove("hidden");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.add("hidden"), 4200);
}

function setStatus(label, live = false) {
  streamStatusBadge.textContent = label;
  streamStatusBadge.classList.toggle("live", live);
}

function setAccount(state) {
  authState = state || { authenticated: false };
  const signedIn = !!authState.authenticated;
  accountLabel.textContent = signedIn ? `Signed in as @${authState.username || "Creator"}` : "Sign in to broadcast";
  accountDot.classList.toggle("online", signedIn);
  btnConnectAccount.hidden = signedIn;
  if (signedIn && authState.token) {
    checkYouTubeStatus(authState.token);
  } else {
    setYouTubeAccountState(false);
  }
  updateBroadcastButton();
}

function updateBroadcastButton() {
  btnToggleBroadcast.disabled = !activeStream || (!isBroadcasting && !authState.authenticated);
  btnToggleBroadcast.textContent = isBroadcasting
    ? (isDualBroadcasting ? "Stop TAS Broadcast" : "Stop Broadcast")
    : !authState.authenticated ? "Sign in to Broadcast" : "Start Broadcast";
  btnToggleBroadcast.className = `btn-stream ${isBroadcasting ? "stop" : "start"}`;

  if (btnGoLiveBoth) {
    btnGoLiveBoth.disabled = !activeStream || (!isBroadcasting && !authState.authenticated);
    if (isDualBroadcasting) {
      btnGoLiveBoth.className = "btn-stream-dual stop";
      if (goLiveBothText) goLiveBothText.textContent = "Stop Both Broadcasts";
    } else {
      btnGoLiveBoth.className = "btn-stream-dual start";
      if (goLiveBothText) goLiveBothText.textContent = "Go Live on Both YouTube and TalkAStranger";
    }
  }
}

async function checkYouTubeStatus(token) {
  if (!token) {
    setYouTubeAccountState(false);
    return { connected: false };
  }
  try {
    const response = await fetch(`${SITE}/api/youtube/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      credentials: "omit",
    });
    const data = response.ok ? await response.json() : { connected: false };
    setYouTubeAccountState(!!data?.connected);
    return data;
  } catch {
    setYouTubeAccountState(false);
    return { connected: false };
  }
}

function setYouTubeAccountState(connected) {
  ytConnected = !!connected;
  if (ytAccountLabel) {
    ytAccountLabel.textContent = connected ? "YouTube: Connected" : "YouTube: Not Linked";
  }
  if (ytAccountDot) {
    ytAccountDot.classList.toggle("online", connected);
  }
  if (btnConnectYouTube) {
    btnConnectYouTube.hidden = connected;
  }
}

async function startYouTubeBroadcast(token, title, description) {
  const response = await fetch(`${SITE}/api/youtube/go-live`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "omit",
    body: JSON.stringify({
      title: title || "Live Screen Broadcast",
      description: description || "Broadcasting live via TalkAStranger Streamer Companion",
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.sessionId) {
    throw new Error(result?.error || `Could not start YouTube live (${response.status}).`);
  }
  return result;
}

function openYouTubeSocket(sessionId, stream) {
  if (ytWs) {
    try { ytWs.close(); } catch {}
    ytWs = null;
  }
  if (ytRecorder && ytRecorder.state !== "inactive") {
    try { ytRecorder.stop(); } catch {}
    ytRecorder = null;
  }
  const proto = SITE.startsWith("https") ? "wss" : "ws";
  const host = new URL(SITE).host;
  const socket = new WebSocket(`${proto}://${host}/ws/youtube-live/${sessionId}`);
  ytWs = socket;

  socket.onopen = () => {
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : "video/webm";
    try {
      const mr = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_500_000 });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          if (socket.bufferedAmount < 4_000_000) {
            socket.send(e.data);
          } else {
            console.warn("[yt-live] WS backpressure — dropping chunk");
          }
        }
      };
      mr.start(500);
      ytRecorder = mr;
    } catch (err) {
      console.error("[yt-live] Error starting MediaRecorder:", err);
      toast("Could not start YouTube stream encoder: " + err.message, true);
    }
  };

  socket.onerror = (e) => {
    console.error("[yt-live] YouTube WebSocket error", e);
  };

  socket.onclose = () => {
    if (ytRecorder && ytRecorder.state !== "inactive") {
      try { ytRecorder.stop(); } catch {}
      ytRecorder = null;
    }
    ytWs = null;
  };
}

async function stopYouTubeBroadcast(token, sessionId) {
  if (ytRecorder && ytRecorder.state !== "inactive") {
    try { ytRecorder.stop(); } catch {}
    ytRecorder = null;
  }
  if (ytWs) {
    const s = ytWs;
    ytWs = null;
    try { s.close(); } catch {}
  }
  if (sessionId) {
    try {
      await fetch(`${SITE}/api/youtube/end-live/${sessionId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "omit",
      });
    } catch (e) {
      console.warn("[yt-live] Error calling end-live:", e);
    }
  }
  isYouTubeLive = false;
  ytSessionId = null;
  ytWatchUrl = null;
  if (btnOpenYouTubeWatch) btnOpenYouTubeWatch.classList.add("hidden");
}

async function startDualBroadcast() {
  if (isDualBroadcasting || isBroadcasting) {
    return stopAllBroadcasts();
  }
  if (!activeStream) return toast("Select a screen, app window, or browser tab first.", true);

  setStatus("VERIFYING ACCOUNT…");
  btnToggleBroadcast.disabled = true;
  if (btnGoLiveBoth) btnGoLiveBoth.disabled = true;

  const auth = await requestAuth();
  if (!auth?.authenticated || !auth.token || !auth.clientId) {
    setAccount({ ...(authState || {}), authenticated: false });
    setStatus("SIGN IN REQUIRED");
    toast("Sign in to TalkAStranger in a browser tab, then retry.", true);
    return;
  }
  setAccount(auth);

  // 1. Verify YouTube status
  setStatus("CHECKING YOUTUBE…");
  const yt = await checkYouTubeStatus(auth.token);
  if (!yt?.connected) {
    setStatus("YOUTUBE LINK REQUIRED");
    updateBroadcastButton();
    try {
      const authData = await fetch(`${SITE}/api/youtube/auth-url`, {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
        credentials: "omit",
      }).then((r) => r.json());
      if (authData?.url) {
        chrome.tabs.create({ url: authData.url });
        toast("Please link your YouTube account in the opened window, then click 'Go Live on Both' again.");
      } else {
        toast("YouTube connection link could not be generated.", true);
      }
    } catch {
      toast("Could not connect to YouTube service. Check connection.", true);
    }
    return;
  }

  // 2. Start YouTube live session
  setStatus("STARTING YOUTUBE LIVE…");
  const title = $("streamTitle").value.trim().slice(0, 120) || "Live Screen Broadcast";
  const desc = $("streamDesc").value.trim().slice(0, 300) || "Live on TalkAStranger & YouTube";

  let ytData;
  try {
    ytData = await startYouTubeBroadcast(auth.token, title, desc);
    ytSessionId = ytData.sessionId;
    ytWatchUrl = ytData.watchUrl;
    isYouTubeLive = true;
    openYouTubeSocket(ytSessionId, activeStream);
  } catch (err) {
    updateBroadcastButton();
    setStatus("YOUTUBE LIVE FAILED");
    return toast(err.message || "Failed to start YouTube live.", true);
  }

  // 3. Start TalkAStranger live session
  setStatus("STARTING TALKASTRANGER LIVE…");
  try {
    isDualBroadcasting = true;
    await startBroadcast();
  } catch (tasErr) {
    await stopYouTubeBroadcast(auth.token, ytSessionId);
    isDualBroadcasting = false;
    isYouTubeLive = false;
    updateBroadcastButton();
    return;
  }

  showDualLiveState();
  broadcastRuntimeState();
  toast("You're live on BOTH YouTube and TalkAStranger!");
}

function showDualLiveState() {
  showLiveState();
  if (liveStatusText) liveStatusText.textContent = "BROADCASTING TO TALKASTRANGER & YOUTUBE";
  if (btnOpenYouTubeWatch && ytWatchUrl) {
    btnOpenYouTubeWatch.href = ytWatchUrl;
    btnOpenYouTubeWatch.classList.remove("hidden");
  }
  const country = selectedDestination() === "country" ? COUNTRIES.find(([code]) => code === countrySelect.value) : null;
  $("liveDestinationPill").textContent = selectedDestination() === "country" && country
    ? `${country[2]} ${country[1]} + 🔴 YouTube`
    : "🌐 Live Streams + 🔴 YouTube";
  updateBroadcastButton();
}

async function stopAllBroadcasts(reason = "All broadcasts ended.") {
  const token = broadcastConfig?.token || authState?.token;
  const sid = ytSessionId;
  if (isYouTubeLive || sid) {
    await stopYouTubeBroadcast(token, sid);
  }
  isDualBroadcasting = false;
  isYouTubeLive = false;
  if (btnOpenYouTubeWatch) btnOpenYouTubeWatch.classList.add("hidden");
  await stopBroadcast(reason);
}

function selectedDestination() {
  const checked = document.querySelector('input[name="broadcastDestination"]:checked');
  return checked?.value === "country" ? "country" : "section";
}

function updateDestinationUI() {
  const destination = selectedDestination();
  destinationDetails.style.display = destination === "country" ? "block" : "none";
  $("optLiveSection").classList.toggle("active", destination === "section");
  countryLaneOption.classList.toggle("active", destination === "country");
  if (destination === "country" && !countryLiveAvailable) {
    $("countryDestinationHint").textContent = "Country LIVE lanes are currently unavailable on TalkAStranger. Select Live Streams Section instead.";
  } else if (destination === "country") {
    $("countryDestinationHint").textContent = "Your broadcast will appear in the selected country's Country LIVE lane.";
  }
  updateWatchLink();
}

function updateWatchLink() {
  const country = COUNTRIES.find(([code]) => code === countrySelect.value);
  const url = selectedDestination() === "country" && country
    ? `${SITE}/country/${country[1].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`
    : `${SITE}/streams`;
  btnOpenLiveWatch.href = url;
  $("liveDestinationPill").textContent = selectedDestination() === "country" && country
    ? `${country[2]} ${country[1]} LIVE Lane`
    : "🌐 Live Streams Section";
}

function populateCountries() {
  countrySelect.innerHTML = COUNTRIES.map(([code, name, flag]) => `<option value="${code}">${flag} ${name}</option>`).join("");
  countrySelect.value = "US";
}

async function checkCountryLive() {
  try {
    const response = await fetch(`${SITE}/api/country-live/status`, { cache: "no-store", credentials: "omit" });
    const body = response.ok ? await response.json() : {};
    countryLiveAvailable = body?.enabled === true;
  } catch { countryLiveAvailable = false; }
  if (!countryLiveAvailable) {
    countryLaneOption.classList.add("unavailable");
    countryLaneOption.title = "Country LIVE is currently unavailable";
    countryLaneOption.querySelector("input").disabled = true;
  }
  updateDestinationUI();
}

async function getIceServers() {
  try {
    const response = await fetch(`${SITE}/api/turn-credentials`, { cache: "no-store", credentials: "omit" });
    const body = await response.json();
    if (Array.isArray(body.iceServers) && body.iceServers.length) return [...STUN_ONLY, ...body.iceServers];
  } catch {}
  return STUN_ONLY;
}

async function selectSource() {
  try {
    const quality = $("qualitySelect").value;
    const constraints = quality === "1080p"
      ? { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 60 } }
      : { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 60 } };
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: constraints, audio: true });
    if (activeStream && activeStream !== stream) activeStream.getTracks().forEach((track) => track.stop());
    activeStream = stream;
    previewVideo.srcObject = stream;
    await previewVideo.play().catch(() => undefined);
    placeholder.classList.add("hidden");
    btnChangeSource.classList.remove("hidden");
    stream.getVideoTracks()[0].addEventListener("ended", () => {
      if (isBroadcasting) stopBroadcast("Screen sharing stopped.");
      else clearPreview();
    }, { once: true });
    setupAudioMeter(stream);
    updateBroadcastButton();
    setStatus("SOURCE READY");
    toast("Source selected. Choose a destination, then start broadcasting.");
  } catch (error) {
    if (error?.name !== "NotAllowedError") toast(error?.message || "Could not capture that source.", true);
  }
}

function setupAudioMeter(stream) {
  if (audioContext) audioContext.close().catch(() => undefined);
  audioContext = null;
  const audioTracks = stream.getAudioTracks();
  if (!audioTracks.length) {
    audioMeterFill.style.width = "0%";
    audioStateLabel.textContent = "No shared audio";
    return;
  }
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    audioStateLabel.textContent = "Audio shared";
    const data = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length;
      audioMeterFill.style.width = `${Math.min(100, Math.round((average / 128) * 100))}%`;
      audioMeterFrame = requestAnimationFrame(update);
    };
    update();
  } catch {
    audioStateLabel.textContent = "Audio meter unavailable";
  }
}

function clearPreview() {
  if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
  previewVideo.srcObject = null;
  placeholder.classList.remove("hidden");
  btnChangeSource.classList.add("hidden");
  audioMeterFill.style.width = "0%";
  audioStateLabel.textContent = "No audio detected";
  cancelAnimationFrame(audioMeterFrame);
  analyser = null;
  updateBroadcastButton();
  setStatus("OFFLINE");
}

async function requestAuth() {
  // Ask the open TalkAStranger tab to refresh the extension's in-memory session token.
  await sendRuntime({ type: "REQUEST_PAGE_AUTH" });
  return await sendRuntime({ type: "GET_BROADCAST_AUTH" });
}

async function startBroadcast() {
  if (isBroadcasting) return;
  if (!activeStream) return toast("Select a screen, app window, or browser tab first.", true);
  setStatus("VERIFYING ACCOUNT…");
  btnToggleBroadcast.disabled = true;
  const auth = await requestAuth();
  if (!auth?.authenticated || !auth.token || !auth.clientId) {
    setAccount({ ...(authState || {}), authenticated: false });
    setStatus("SIGN IN REQUIRED");
    toast("Sign in to TalkAStranger in a browser tab, then retry.", true);
    return;
  }
  setAccount(auth);

  const destination = selectedDestination();
  const country = destination === "country" ? COUNTRIES.find(([code]) => code === countrySelect.value) : null;
  if (destination === "country" && (!countryLiveAvailable || !country)) {
    updateBroadcastButton();
    setStatus("COUNTRY LIVE UNAVAILABLE");
    return toast("Country LIVE lanes are unavailable or no country is selected.", true);
  }

  broadcastConfig = {
    token: auth.token,
    clientId: String(auth.clientId),
    username: auth.username || "Creator",
    avatar: auth.avatar || null,
    destination,
    countryCode: country?.[0] || null,
    countryName: country?.[1] || null,
    durationMinutes: Number($("durationSelect").value || 20),
    title: $("streamTitle").value.trim().slice(0, 120) || "Live Screen Broadcast",
    description: $("streamDesc").value.trim().slice(0, 300),
  };

  let serverSessionStarted = false;
  try {
    const response = await fetch(`${SITE}/api/live/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${broadcastConfig.token}` },
      credentials: "omit",
      body: JSON.stringify({
        hostClientId: broadcastConfig.clientId,
        hostName: broadcastConfig.username,
        title: broadcastConfig.title,
        description: broadcastConfig.description,
        thumbnail: null,
        type: "tas",
        mode: destination === "country" ? "guest" : "chat",
        countryCode: broadcastConfig.countryCode,
        countryLive: destination === "country",
        durationMinutes: broadcastConfig.durationMinutes,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) throw new Error(result?.error || `Could not start the live session (${response.status}).`);
    serverSessionStarted = true;
    await openHostSocket();
  } catch (error) {
    if (serverSessionStarted && broadcastConfig?.clientId) {
      try { await fetch(`${SITE}/api/live/stop`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit", body: JSON.stringify({ hostClientId: broadcastConfig.clientId }) }); } catch {}
    }
    broadcastConfig = null;
    updateBroadcastButton();
    setStatus("START FAILED");
    return toast(error?.message || "Could not start the live session.", true);
  }
}

async function openHostSocket() {
  if (!broadcastConfig) return;
  if (ws && ws.readyState < WebSocket.CLOSING) ws.close();
  const socket = new WebSocket("wss://talkastranger.com/ws");
  ws = socket;
  setStatus("CONNECTING…");

  socket.onopen = () => {
    if (socket !== ws || !broadcastConfig) return;
    socket.send(JSON.stringify({
      type: "live_host_register",
      clientId: broadcastConfig.clientId,
      nickname: broadcastConfig.username,
      avatar: broadcastConfig.avatar,
      authToken: broadcastConfig.token,
      mode: broadcastConfig.destination === "country" ? "guest" : "chat",
    }));
    clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
    }, 20000);
  };

  socket.onmessage = async (event) => {
    if (socket !== ws) return;
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.type === "live_registered") {
      isBroadcasting = true;
      viewerCount = 0;
      startTime = Date.now();
      showLiveState();
      broadcastRuntimeState();
      setStatus("BROADCASTING LIVE", true);
      toast("You're live on TalkAStranger.");
      return;
    }
    if (message.type === "live_host_offline") {
      if (!isBroadcasting) {
        toast("The live session could not register. Check your connection and try again.", true);
        await stopBroadcast("Could not connect.", true);
      } else {
        await stopBroadcast("The live server disconnected. Your broadcast ended.", false);
      }
      return;
    }
    if (message.type === "live_viewer_count") {
      viewerCount = Number(message.count || 0);
      $("liveViewersPill").textContent = `👁️ ${viewerCount} viewer${viewerCount === 1 ? "" : "s"}`;
      broadcastRuntimeState();
      return;
    }
    if (message.type === "live_peer_connected") {
      if (!message.peerClientId) return;
      viewerPeerIds.add(message.peerClientId);
      await createOffer(message.peerClientId, !!message.isCohost);
      return;
    }
    if (message.type === "live_peer_disconnected") {
      const pc = peers.get(message.peerClientId);
      if (pc) pc.close();
      peers.delete(message.peerClientId);
      pendingPeers.delete(message.peerClientId);
      viewerPeerIds.delete(message.peerClientId);
      return;
    }
    if (message.type === "live_relay") {
      const peerId = message.fromClientId;
      const pc = peers.get(peerId);
      const payload = message.payload || {};
      if (!pc) return;
      if (payload.kind === "answer") {
        try { await pc.setRemoteDescription(new RTCSessionDescription({ type: payload.sdpType, sdp: payload.sdp })); } catch (error) { console.warn("Could not set viewer answer", error); }
      } else if (payload.kind === "ice" && payload.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
      }
      return;
    }
    if (message.type === "live_chat") {
      appendChat(message.nickname || "Viewer", message.message || "");
      return;
    }
    if (message.type === "live_cohost_request") {
      appendChat("System", `${message.peerNickname || "A guest"} requested to join your live video.`);
      toast("A guest requested to join your broadcast. Accept/decline is available on TalkAStranger.");
      return;
    }
    if (message.type === "live_chat_auth_required") toast("Sign in on TalkAStranger to send live comments.", true);
  };

  socket.onerror = () => {};
  socket.onclose = () => {
    clearInterval(pingInterval);
    if (socket !== ws || !isBroadcasting) return;
    setStatus("RECONNECTING…", true);
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      if (isBroadcasting && broadcastConfig) openHostSocket();
    }, 1500);
  };

  // Do not claim a successful broadcast merely because the POST succeeded.
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("The live server did not respond. Please retry.")), 12000);
    const previousHandler = socket.onmessage;
    const check = (event) => {
      previousHandler?.(event);
      try {
        const message = JSON.parse(event.data);
        if (message.type === "live_registered") { clearTimeout(timeout); resolve(); }
        if (message.type === "live_host_offline") { clearTimeout(timeout); reject(new Error("The live server rejected the host connection.")); }
      } catch {}
    };
    socket.onmessage = check;
    socket.addEventListener("close", () => { clearTimeout(timeout); reject(new Error("Live connection closed before registration.")); }, { once: true });
  });
}

async function createOffer(peerClientId, isCohost = false) {
  if (!broadcastConfig || !activeStream || !ws || ws.readyState !== WebSocket.OPEN) return;
  if (pendingPeers.has(peerClientId)) return;
  pendingPeers.add(peerClientId);
  peers.get(peerClientId)?.close();
  const pc = new RTCPeerConnection({ iceServers: await getIceServers() });
  peers.set(peerClientId, pc);
  activeStream.getTracks().forEach((track) => pc.addTrack(track, activeStream));
  pc.onicecandidate = (event) => {
    if (event.candidate && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "live_relay", toClientId: peerClientId, payload: { kind: "ice", candidate: event.candidate } }));
    }
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "closed") {
      peers.delete(peerClientId);
      pendingPeers.delete(peerClientId);
    }
  };
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const mediaMids = pc.getTransceivers().map((transceiver) => {
      const track = transceiver.sender.track;
      return track && transceiver.mid ? { mid: transceiver.mid, participant: 0 } : null;
    }).filter(Boolean);
    const videoMids = mediaMids.filter((entry) => pc.getTransceivers().find((item) => item.mid === entry.mid)?.sender.track?.kind === "video").map((entry) => entry.mid);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "live_relay", toClientId: peerClientId, payload: { kind: "offer", sdpType: offer.type, sdp: offer.sdp, videoMids, mediaMids } }));
    }
  } catch (error) {
    console.error("Could not create live viewer offer", error);
    pc.close();
    peers.delete(peerClientId);
    pendingPeers.delete(peerClientId);
  }
}

function showLiveState() {
  $("liveOverlayHud").classList.remove("hidden");
  $("liveViewersPill").textContent = `👁️ ${viewerCount} viewers`;
  $("liveTimerPill").textContent = "⏱️ 00:00:00";
  btnToggleBroadcast.disabled = false;
  btnToggleBroadcast.textContent = "Stop Broadcast";
  btnToggleBroadcast.className = "btn-stream stop";
  $("chatConnectionStatus").textContent = "Connected";
  $("chatConnectionStatus").classList.add("connected");
  studioChatInput.disabled = false;
  $("btnSendStudioChat").disabled = false;
  updateWatchLink();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
    const s = String(elapsed % 60).padStart(2, "0");
    $("liveTimerPill").textContent = `⏱️ ${h}:${m}:${s}`;
  }, 1000);
}

function broadcastRuntimeState() {
  sendRuntime({ type: "BROADCAST_STATE_CHANGED", payload: {
    isLive: isBroadcasting,
    isYouTubeLive: isYouTubeLive,
    isDualLive: isDualBroadcasting,
    youtubeWatchUrl: ytWatchUrl,
    youtubeSessionId: ytSessionId,
    destination: broadcastConfig?.destination || "section",
    countryCode: broadcastConfig?.countryCode || null,
    countryName: broadcastConfig?.countryName || null,
    title: broadcastConfig?.title || "Live Screen Broadcast",
    hostClientId: broadcastConfig?.clientId || null,
    viewers: viewerCount,
    streamStartTime: startTime,
  } });
}

async function stopBroadcast(reason = "Broadcast ended.", skipStopApi = false) {
  if (isYouTubeLive || ytSessionId) {
    const token = broadcastConfig?.token || authState?.token;
    void stopYouTubeBroadcast(token, ytSessionId);
  }
  isDualBroadcasting = false;
  isYouTubeLive = false;
  if (btnOpenYouTubeWatch) btnOpenYouTubeWatch.classList.add("hidden");
  if (liveStatusText) liveStatusText.textContent = "BROADCASTING LIVE";
  clearInterval(pingInterval);
  clearInterval(timerInterval);
  clearTimeout(reconnectTimer);
  const wasLive = isBroadcasting || !!broadcastConfig;
  isBroadcasting = false;
  peers.forEach((pc) => pc.close());
  peers.clear();
  pendingPeers.clear();
  viewerPeerIds.clear();
  if (ws) {
    const socket = ws;
    ws = null;
    socket.onclose = null;
    try { socket.close(); } catch {}
  }
  if (!skipStopApi && broadcastConfig?.clientId) {
    try {
      await fetch(`${SITE}/api/live/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({ hostClientId: broadcastConfig.clientId }),
      });
    } catch {}
  }
  broadcastConfig = null;
  $("liveOverlayHud").classList.add("hidden");
  $("chatConnectionStatus").textContent = "Offline";
  $("chatConnectionStatus").classList.remove("connected");
  studioChatInput.disabled = true;
  $("btnSendStudioChat").disabled = true;
  setStatus(activeStream ? "SOURCE READY" : "OFFLINE");
  updateBroadcastButton();
  if (wasLive) toast(reason);
  broadcastRuntimeState();
}

function appendChat(author, text) {
  const row = document.createElement("div");
  row.className = "studio-chat-message";
  const title = document.createElement("strong");
  title.textContent = author;
  const body = document.createElement("p");
  body.textContent = text;
  row.append(title, body);
  studioChatFeed.appendChild(row);
  while (studioChatFeed.children.length > 70) studioChatFeed.firstElementChild.remove();
  studioChatFeed.scrollTop = studioChatFeed.scrollHeight;
}

async function sendChat(message) {
  const clean = String(message || "").trim().slice(0, 300);
  if (!clean || !isBroadcasting || !ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type: "live_chat", message: clean }));
  appendChat(`@${broadcastConfig?.username || "Creator"}`, clean);
}

function handleHudMessage(message) {
  if (message.type === "COMMAND_STOP_BROADCAST") stopAllBroadcasts("Broadcast stopped from the HUD.");
  if (message.type === "COMMAND_SEND_CHAT") sendChat(message.payload?.message);
}


// v1.2.0 Instant Random Chat + Country LIVE partner invitation helpers.
let rcStream = null;
let rcSocket = null;
let rcPeer = null;
let rcChatClientId = null;
let rcPartnerInviteUrl = "";
let rcGender = "";
let rcMicEnabled = true;
let rcCamEnabled = true;
let rcGameState = Array(9).fill("");

function rcSetStatus(text) {
  const el = $("rcStatusPill");
  if (el) el.textContent = text;
}

function rcClosePeer() {
  if (rcPeer) {
    try { rcPeer.ontrack = null; rcPeer.onicecandidate = null; rcPeer.close(); } catch {}
    rcPeer = null;
  }
  const remote = $("rcRemoteVideo");
  if (remote) remote.srcObject = null;
}

function rcDisconnect() {
  if (rcSocket) {
    try { rcSocket.close(); } catch {}
    rcSocket = null;
  }
  rcClosePeer();
  if (rcStream) {
    rcStream.getTracks().forEach((track) => track.stop());
    rcStream = null;
  }
  $("rcWaitingPanel")?.classList.remove("hidden");
  $("rcMatchedPanel")?.classList.add("hidden");
  rcSetStatus("Disconnected");
}

function rcSend(payload) {
  if (rcSocket?.readyState === WebSocket.OPEN) rcSocket.send(JSON.stringify(payload));
}

async function rcHandleSignal(message) {
  if (!rcPeer) {
    rcPeer = new RTCPeerConnection({ iceServers: await getIceServers() });
    rcStream?.getTracks().forEach((track) => rcPeer.addTrack(track, rcStream));
    rcPeer.ontrack = (event) => { if ($("rcRemoteVideo")) $("rcRemoteVideo").srcObject = event.streams[0]; };
    rcPeer.onicecandidate = (event) => { if (event.candidate) rcSend({ type: "ice-candidate", candidate: event.candidate }); };
    rcPeer.onconnectionstatechange = () => rcSetStatus(rcPeer?.connectionState === "connected" ? "Connected" : rcPeer?.connectionState || "Connecting");
  }
  if (message.type === "offer") {
    await rcPeer.setRemoteDescription(new RTCSessionDescription(message.offer));
    const answer = await rcPeer.createAnswer();
    await rcPeer.setLocalDescription(answer);
    rcSend({ type: "answer", answer: rcPeer.localDescription });
  } else if (message.type === "answer") {
    await rcPeer.setRemoteDescription(new RTCSessionDescription(message.answer));
  } else if (message.type === "ice-candidate" && message.candidate) {
    try { await rcPeer.addIceCandidate(new RTCIceCandidate(message.candidate)); } catch {}
  }
}

async function rcStartMatch() {
  const auth = await requestAuth();
  if (!auth?.authenticated || !auth.clientId) {
    toast("Sign in on TalkAStranger before starting Instant Random Chat.", true);
    return;
  }
  try {
    rcStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    $("rcLocalPreview").srcObject = rcStream;
    $("rcLocalVideo").srcObject = rcStream;
  } catch (error) {
    toast("Allow camera and microphone access to use Instant Random Chat.", true);
    rcSetStatus("Camera permission required");
    return;
  }

  rcSetStatus("Connecting…");
  const protocol = SITE.startsWith("https:") ? "wss:" : "ws:";
  rcSocket = new WebSocket(`${protocol}//${new URL(SITE).host}/ws`);
  rcSocket.onopen = () => rcSend({ type: "join", clientId: auth.clientId, nickname: auth.username || "Creator", gender: "other", country: "", preferGender: rcGender, preferCountry: $("rcCountryFilter")?.value || "" });
  rcSocket.onmessage = async (event) => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.type === "matched") {
      rcChatClientId = message.peerClientId || null;
      $("rcStrangerName").textContent = message.peerNickname || "Stranger";
      $("rcStrangerFlag").textContent = "🌍";
      $("rcStrangerGender").textContent = message.peerGender || "";
      $("rcWaitingPanel").classList.add("hidden");
      $("rcMatchedPanel").classList.remove("hidden");
      rcClosePeer();
      rcPeer = new RTCPeerConnection({ iceServers: await getIceServers() });
      rcStream.getTracks().forEach((track) => rcPeer.addTrack(track, rcStream));
      rcPeer.ontrack = (e) => { $("rcRemoteVideo").srcObject = e.streams[0]; };
      rcPeer.onicecandidate = (e) => { if (e.candidate) rcSend({ type: "ice-candidate", candidate: e.candidate }); };
      rcPeer.onconnectionstatechange = () => rcSetStatus(rcPeer?.connectionState === "connected" ? "Connected" : rcPeer?.connectionState || "Connecting");
      if (message.isInitiator) {
        const offer = await rcPeer.createOffer();
        await rcPeer.setLocalDescription(offer);
        rcSend({ type: "offer", offer: rcPeer.localDescription });
      }
      rcSetStatus("Matched — negotiating media");
    } else if (message.type === "offer" || message.type === "answer" || message.type === "ice-candidate") {
      await rcHandleSignal(message);
    } else if (message.type === "peer-disconnected" || message.type === "peer_disconnected") {
      rcClosePeer();
      $("rcMatchedPanel").classList.add("hidden");
      $("rcWaitingPanel").classList.remove("hidden");
      rcSetStatus("Peer disconnected");
    } else if (message.type === "chat") {
      appendChat(message.fromNickname || "Stranger", message.message || "");
    } else if (message.type === "game_action") {
      if (message.action?.type === "ttt_move") {
        const index = Number(message.action.index);
        if (index >= 0 && index < 9 && !rcGameState[index]) {
          rcGameState[index] = message.action.mark === "O" ? "O" : "X";
          const cell = document.querySelector(`.ttt-cell[data-index="${index}"]`);
          if (cell) cell.textContent = rcGameState[index];
        }
      }
    }
  };
  rcSocket.onclose = () => { rcSetStatus("Disconnected"); };
  rcSocket.onerror = () => { rcSetStatus("Connection error"); };
}

async function sendCountryPartnerInvite() {
  const email = $("partnerInviteEmail")?.value.trim();
  if (!email || !email.includes("@")) return toast("Enter a valid partner email.", true);
  const auth = await requestAuth();
  if (!auth?.token || !auth?.clientId) return toast("Sign in before inviting a partner.", true);
  const countryCode = countrySelect.value;
  const button = $("btnSendPartnerInvite");
  if (button) button.disabled = true;
  try {
    const response = await fetch(`${SITE}/api/country-live/${encodeURIComponent(auth.clientId)}/guest-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      credentials: "omit",
      body: JSON.stringify({ countryCode, email }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.joinUrl) throw new Error(result.error || "Could not send the partner invitation.");
    rcPartnerInviteUrl = new URL(result.joinUrl, SITE).href;
    $("partnerInviteStatus").textContent = result.emailed ? "Invite email sent." : "Invite link created.";
    $("partnerInviteResult").classList.remove("hidden");
    toast(result.emailed ? "Partner invite sent." : "Invite link ready to copy.");
  } catch (error) {
    toast(error.message || "Could not send invite.", true);
  } finally {
    if (button) button.disabled = false;
  }
}

function initV120Controls() {
  $("tabInstantRandomChat")?.addEventListener("click", () => {
    $("tabInstantRandomChat").classList.add("active");
    $("tabScreenStudio")?.classList.remove("active");
    $("randomChatContainer")?.classList.remove("hidden");
    $("destinationCard")?.classList.add("hidden");
    $("previewViewport")?.classList.add("hidden");
    document.querySelector(".studio-chat-panel")?.classList.add("hidden");
  });
  $("tabScreenStudio")?.addEventListener("click", () => {
    $("tabScreenStudio").classList.add("active");
    $("tabInstantRandomChat")?.classList.remove("active");
    $("randomChatContainer")?.classList.add("hidden");
    $("destinationCard")?.classList.remove("hidden");
    $("previewViewport")?.classList.remove("hidden");
    document.querySelector(".studio-chat-panel")?.classList.remove("hidden");
  });
  $("btnRcStartMatch")?.addEventListener("click", () => void rcStartMatch());
  $("btnRcNext")?.addEventListener("click", () => { rcSend({ type: "skip" }); rcClosePeer(); rcSetStatus("Finding next match…"); });
  $("btnRcDisconnect")?.addEventListener("click", rcDisconnect);
  $("rcToggleMic")?.addEventListener("click", (event) => {
    rcMicEnabled = !rcMicEnabled;
    rcStream?.getAudioTracks().forEach((track) => { track.enabled = rcMicEnabled; });
    event.currentTarget.classList.toggle("off", !rcMicEnabled);
  });
  $("rcToggleCam")?.addEventListener("click", (event) => {
    rcCamEnabled = !rcCamEnabled;
    rcStream?.getVideoTracks().forEach((track) => { track.enabled = rcCamEnabled; });
    event.currentTarget.classList.toggle("off", !rcCamEnabled);
  });
  document.querySelectorAll(".pill-btn[data-gender]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".pill-btn[data-gender]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    rcGender = button.dataset.gender || "";
  }));
  $("btnRcGame")?.addEventListener("click", () => $("rcGameOverlay")?.classList.toggle("hidden"));
  $("btnCloseGame")?.addEventListener("click", () => $("rcGameOverlay")?.classList.add("hidden"));
  document.querySelectorAll(".ttt-cell").forEach((cell) => cell.addEventListener("click", () => {
    const index = Number(cell.dataset.index);
    if (rcGameState[index]) return;
    rcGameState[index] = "X";
    cell.textContent = "X";
    rcSend({ type: "game_action", action: { type: "ttt_move", index, mark: "X" } });
    $("rcGameStatus").textContent = "Move sent";
  }));
  $("btnRcSendSpark")?.addEventListener("click", () => toast("Send Sparks from TalkAStranger's live gift panel."));
  $("btnSendPartnerInvite")?.addEventListener("click", () => void sendCountryPartnerInvite());
  $("partnerInviteCopyLink")?.addEventListener("click", async (event) => {
    event.preventDefault();
    if (!rcPartnerInviteUrl) return;
    await navigator.clipboard.writeText(rcPartnerInviteUrl);
    toast("Invite link copied.");
  });
}

async function init() {
  populateCountries();
  initV120Controls();
  document.querySelectorAll('input[name="broadcastDestination"]').forEach((input) => input.addEventListener("change", updateDestinationUI));
  countrySelect.addEventListener("change", updateWatchLink);
  btnSelectSource.addEventListener("click", selectSource);
  btnChangeSource.addEventListener("click", async () => {
    if (isBroadcasting) await stopBroadcast("Broadcast stopped to change source.");
    clearPreview();
    await selectSource();
  });
  btnToggleBroadcast.addEventListener("click", () => isBroadcasting ? stopBroadcast() : startBroadcast());
  if (btnGoLiveBoth) {
    btnGoLiveBoth.addEventListener("click", () => isDualBroadcasting ? stopAllBroadcasts() : startDualBroadcast());
  }
  btnConnectAccount.addEventListener("click", () => chrome.tabs.create({ url: `${SITE}/` }));
  if (btnConnectYouTube) {
    btnConnectYouTube.addEventListener("click", async () => {
      const auth = await requestAuth();
      if (!auth?.token) return toast("Sign in to TalkAStranger first.", true);
      try {
        const data = await fetch(`${SITE}/api/youtube/auth-url`, {
          headers: { Authorization: `Bearer ${auth.token}` },
          cache: "no-store",
          credentials: "omit",
        }).then((r) => r.json());
        if (data?.url) chrome.tabs.create({ url: data.url });
        else toast("Could not generate YouTube auth link.", true);
      } catch {
        toast("Could not contact YouTube auth service.", true);
      }
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("mode") === "dual") {
    toast("Dual broadcast ready: Select a screen or tab, then click 'Go Live on Both YouTube and TalkAStranger'.");
  }
  studioChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = studioChatInput.value;
    studioChatInput.value = "";
    sendChat(value);
  });
  chrome.runtime.onMessage.addListener((message) => handleHudMessage(message));
  window.addEventListener("beforeunload", () => {
    if (isBroadcasting) void stopBroadcast("Broadcast studio closed.");
    if (activeStream) activeStream.getTracks().forEach((track) => track.stop());
    if (audioContext) audioContext.close().catch(() => undefined);
  });
  updateDestinationUI();
  await checkCountryLive();
  const auth = await requestAuth();
  if (auth?.authenticated) setAccount(auth);
  else setAccount({ authenticated: false });
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
    if (state?.isLive) toast("A previous broadcast was active. Reconnect from Screen Studio if needed.");
  });
}

init();
