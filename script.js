"use strict";

const $ = (id) => document.getElementById(id);
let recorder = null;
let audioStream = null;
let audioUrl = null;

function updateClock() {
  $("clock").textContent = new Date().toLocaleTimeString("nl-NL");
}
updateClock();
setInterval(updateClock, 1000);

function getPhoneNumber() {
  return $("phone").value.trim().replace(/[^\d+]/g, "");
}

$("callBtn").addEventListener("click", () => {
  const phone = getPhoneNumber();
  if (!phone) return alert("Vul eerst een telefoonnummer in.");
  window.location.href = `tel:${phone}`;
});

$("smsBtn").addEventListener("click", () => {
  const phone = getPhoneNumber();
  if (!phone) return alert("Vul eerst een telefoonnummer in.");
  window.location.href = `sms:${phone}`;
});

$("recordBtn").addEventListener("click", async () => {
  if (recorder?.state === "recording") {
    recorder.stop();
    $("recordBtn").disabled = true;
    $("status").textContent = "Opname wordt opgeslagen…";
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    $("status").textContent =
      "Opnemen wordt niet ondersteund. Gebruik een moderne browser via HTTPS of localhost.";
    return;
  }

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    recorder = new MediaRecorder(audioStream);

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    });

    recorder.addEventListener("stop", () => {
      const blob = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm"
      });

      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(blob);

      $("player").src = audioUrl;
      $("player").hidden = false;
      $("download").href = audioUrl;
      $("download").download = "spraakbericht.webm";
      $("download").textContent = "⬇️ Download spraakbericht";
      $("download").hidden = false;

      audioStream?.getTracks().forEach((track) => track.stop());
      audioStream = null;
      $("recordBtn").disabled = false;
      $("recordBtn").textContent = "🎙️ Start opname";
      $("status").textContent = "Opname klaar. Je kunt hem afspelen of downloaden.";
    });

    recorder.addEventListener("error", (event) => {
      $("status").textContent = `Opnamefout: ${event.error?.message || "onbekende fout"}`;
      audioStream?.getTracks().forEach((track) => track.stop());
      audioStream = null;
      $("recordBtn").disabled = false;
      $("recordBtn").textContent = "🎙️ Start opname";
    });

    recorder.start();
    $("recordBtn").textContent = "⏹️ Stop opname";
    $("status").textContent = "Opname loopt…";
  } catch (error) {
    $("status").textContent = `Geen microfoontoegang: ${error.message}`;
  }
});

$("savePinBtn").addEventListener("click", () => {
  const pin = $("pin").value.trim();

  if (!/^\d{4,8}$/.test(pin)) {
    alert("Kies een pincode van 4 tot 8 cijfers.");
    return;
  }

  localStorage.setItem("freddoPin", pin);
  $("pin").value = "";
  alert("Pincode opgeslagen op dit apparaat.");
});

$("lockBtn").addEventListener("click", () => {
  if (!localStorage.getItem("freddoPin")) {
    alert("Stel eerst een pincode in.");
    return;
  }

  $("lockScreen").style.display = "grid";
  $("unlockPin").value = "";
  $("lockError").textContent = "";
  $("unlockPin").focus();
});

$("unlockBtn").addEventListener("click", unlockApp);
$("unlockPin").addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlockApp();
});

function unlockApp() {
  const savedPin = localStorage.getItem("freddoPin");

  if ($("unlockPin").value === savedPin) {
    $("lockScreen").style.display = "none";
    $("unlockPin").value = "";
    $("lockError").textContent = "";
  } else {
    $("lockError").textContent = "Onjuiste pincode.";
    $("unlockPin").value = "";
    $("unlockPin").focus();
  }
}