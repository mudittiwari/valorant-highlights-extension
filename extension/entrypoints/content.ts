import { CONTENT_SCRIPT_MATCHES } from "@/utils/Matches";
import { RecordRTCPromisesHandler } from 'recordrtc';
export default defineContentScript({
  matches: [CONTENT_SCRIPT_MATCHES],
  async main(ctx) {
    let screenStream: MediaStream | null = null;
    let isRecording = false;
    console.log("Hello from content script")
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "startRecording") {
        startScreenRecording();
      }
    });


    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "stopRecording") {
        stopScreenRecording();
      }
    });

    async function stopScreenRecording() {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => {
          track.stop();
        });
        screenStream = null;
        console.log("🛑 Screen stream stopped.");
        chrome.runtime.sendMessage({
          type: "recordingStopped", options: {
            data:"recordingStopped"
          }
        });
      }
    }

    async function getScreenStream() {
      if (!screenStream) {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
          selfBrowserSurface: "include"
        });

        console.log("🎥 Screen stream initialized.");
      }
      return screenStream;
    }
    async function startScreenRecording() {

      console.log("starting screen recording again");
      let recordedChunks: Blob[] = [];
      let recorder: RecordRTCPromisesHandler;
      try {
        if (isRecording) return;
        chrome.runtime.sendMessage({
          type: "recordingStarted", options: {
            data:"recordingStarted"
          }
        });
        console.log("🎬 Starting new 20-second recording...");
        const stream = await getScreenStream();
        const recorder = new RecordRTCPromisesHandler(stream, {
          type: "video",
          mimeType: "video/webm",
          timeSlice: 20000
        });
        isRecording = true;
        recorder.startRecording();
        setTimeout(async () => {
          await recorder.stopRecording();
          isRecording = false;
          const blob = await recorder.getBlob();
          console.log(blob);
          console.log("🛑 Recording stopped, sending file...");
          if (!blob || !(blob instanceof Blob)) {
            console.error("❌ Error: Invalid Blob received.");
            return;
          }
          await sendChunksToServer(blob);
          startScreenRecording();
        }, 20000);
      } catch (err) {
        console.error("❌ Error accessing media devices:", err);
      }
    }
    async function sendChunksToServer(chunk: Blob) {
      const formData = new FormData();
      formData.append("video_chunk", chunk, "video.webm");
      try {
        const response = await fetch("http://localhost:5000/upload-chunk", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("✅ Chunk batch uploaded:", data);
      } catch (error) {
        console.error("❌ Error uploading chunk batch:", error);
      }
    }

  },
});


const showMessagePopup = (message: string) => {
  if (document.getElementById("message-popup-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "message-popup-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0, 0, 0, 0.6)";
  overlay.style.zIndex = "10001";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.zIndex = "10000";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.padding = "20px";
  popup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
  popup.style.width = "300px";
  popup.style.display = "flex";
  popup.style.flexDirection = "column";
  popup.style.justifyContent = "center";
  popup.style.alignItems = "center";
  const messageText = document.createElement("p");
  messageText.textContent = message;
  messageText.style.marginBottom = "20px";
  messageText.style.color = "black";
  messageText.style.textAlign = "center";
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.padding = "10px 20px";
  closeButton.style.border = "none";
  closeButton.style.background = "#4CAF50";
  closeButton.style.color = "#fff";
  closeButton.style.borderRadius = "4px";
  closeButton.style.cursor = "pointer";
  closeButton.style.fontSize = "16px";
  closeButton.style.width = "max-content";
  closeButton.onclick = () => {
    document.body.removeChild(overlay);
  };
  popup.appendChild(messageText);
  popup.appendChild(closeButton);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
};
const showLoadingBar = () => {
  if (document.getElementById("loading-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "loading-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0, 0, 0, 0.6)";
  overlay.style.zIndex = "10001";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  const spinner = document.createElement("div");
  spinner.style.width = "50px";
  spinner.style.height = "50px";
  spinner.style.border = "5px solid #f3f3f3";
  spinner.style.borderTop = "5px solid #3498db";
  spinner.style.borderRadius = "50%";
  spinner.style.animation = "spin 1s linear infinite";

  overlay.appendChild(spinner);
  document.body.appendChild(overlay);
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
};
const hideLoadingBar = () => {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    document.body.removeChild(overlay);
  }
};