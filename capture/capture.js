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

const $ = (id) => document.getElementById(id);
const previewVideo = $("previewVideo");
const placeholder = $("noStreamPlaceholder");
const btnSelectSource = $("btnSelectSource");
const btnChangeSource = $("btnChangeSource");
const btnToggleBroadcast = $("btnToggleBroadcast");
const streamStatusBadge = $("streamStatusBadge");
const audioMeterFill = $("audioMeterFill");
const audioStateLabel = $("audioStateLabel");
const destinationDetails = $("countryDetailsPanel");
const countrySelect = $("countrySelect");
const countryLaneOption = $("optCountryLane");
const btnOpenLiveWatch = $("btnOpenLiveWatch");
const studioChatFeed = $("studioChatFeed");
const studioChatInput = $("studioChatInput");
const studioChatForm = $("studioChatForm");
const accountLabel = $("accountLabel");
const accountDot = $("accountDot");
const btnConnectAccount = $("btnConnectAccount");

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
  updateBroadcastButton();
}

function updateBroadcastButton() {
  btnToggleBroadcast.disabled = !activeStream || (!isBroadcasting && !authState.authenticated);
  btnToggleBroadcast.textContent = isBroadcasting ? "Stop Broadcast" : !authState.authenticated ? "Sign in to Broadcast" : "Start Broadcast";
  btnToggleBroadcast.className = `btn-stream ${isBroadcasting ? "stop" : "start"}`;
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
  if (message.type === "COMMAND_STOP_BROADCAST") stopBroadcast("Broadcast stopped from the HUD.");
  if (message.type === "COMMAND_SEND_CHAT") sendChat(message.payload?.message);
}

async function init() {
  populateCountries();
  document.querySelectorAll('input[name="broadcastDestination"]').forEach((input) => input.addEventListener("change", updateDestinationUI));
  countrySelect.addEventListener("change", updateWatchLink);
  btnSelectSource.addEventListener("click", selectSource);
  btnChangeSource.addEventListener("click", async () => {
    if (isBroadcasting) await stopBroadcast("Broadcast stopped to change source.");
    clearPreview();
    await selectSource();
  });
  btnToggleBroadcast.addEventListener("click", () => isBroadcasting ? stopBroadcast() : startBroadcast());
  btnConnectAccount.addEventListener("click", () => chrome.tabs.create({ url: `${SITE}/` }));
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
