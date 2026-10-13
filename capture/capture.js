// Screen and Tab Capture Engine
let activeStream = null;
let isBroadcasting = false;
let audioContext = null;
let analyser = null;
let animFrame = null;

const previewVideo = document.getElementById("previewVideo");
const placeholder = document.getElementById("noStreamPlaceholder");
const btnSelectSource = document.getElementById("btnSelectSource");
const btnToggleBroadcast = document.getElementById("btnToggleBroadcast");
const streamStatusBadge = document.getElementById("streamStatusBadge");
const liveTag = document.getElementById("liveTag");
const audioMeterFill = document.getElementById("audioMeterFill");

async function selectSource() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        frameRate: 60
      },
      audio: true
    });

    activeStream = stream;
    previewVideo.srcObject = stream;
    placeholder.style.display = "none";
    btnToggleBroadcast.disabled = false;

    // Track when user clicks Chrome native "Stop sharing"
    stream.getVideoTracks()[0].onended = () => {
      stopBroadcast();
    };

    // Setup audio visualizer
    if (stream.getAudioTracks().length > 0) {
      setupAudioMeter(stream);
    }
  } catch (err) {
    console.error("Display media selection cancelled or failed:", err);
  }
}

function setupAudioMeter(stream) {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    function updateMeter() {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      const pct = Math.min(100, Math.round((avg / 128) * 100));
      audioMeterFill.style.width = `${pct}%`;
      animFrame = requestAnimationFrame(updateMeter);
    }
    updateMeter();
  } catch (e) {
    console.warn("Audio meter setup error:", e);
  }
}

function startBroadcast() {
  isBroadcasting = true;
  streamStatusBadge.textContent = "BROADCASTING LIVE";
  streamStatusBadge.classList.add("live");
  liveTag.classList.remove("hidden");
  btnToggleBroadcast.textContent = "Stop Broadcast";
  btnToggleBroadcast.className = "btn-stream stop";

  // Notify extension state
  chrome.runtime.sendMessage({ type: "TOGGLE_LIVE", payload: true });
}

function stopBroadcast() {
  isBroadcasting = false;
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop());
    activeStream = null;
  }
  if (animFrame) cancelAnimationFrame(animFrame);
  audioMeterFill.style.width = "0%";
  previewVideo.srcObject = null;
  placeholder.style.display = "flex";
  btnToggleBroadcast.disabled = true;
  btnToggleBroadcast.textContent = "Start Broadcast";
  btnToggleBroadcast.className = "btn-stream start";
  streamStatusBadge.textContent = "OFFLINE";
  streamStatusBadge.classList.remove("live");
  liveTag.classList.add("hidden");

  chrome.runtime.sendMessage({ type: "TOGGLE_LIVE", payload: false });
}

btnSelectSource.addEventListener("click", selectSource);

btnToggleBroadcast.addEventListener("click", () => {
  if (!isBroadcasting) {
    startBroadcast();
  } else {
    stopBroadcast();
  }
});
