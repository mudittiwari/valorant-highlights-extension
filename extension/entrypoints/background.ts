export default defineBackground(async () => {
  console.log("background service running");

  // let mediaRecorder: MediaRecorder | null = null;
  // let chunks: Blob[] = [];
  // let isRecording: boolean = false;
  // let currentStream: MediaStream | null = null;

  // Listen for messages from the popup or content scripts
  // browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //   if (message.action === 'getTabId') {
  //     browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //       if (tabs.length > 0) {
  //         const activeTab = tabs[0];
  //         if (tabs.length > 0 && activeTab.id != undefined) {
  //           browser.tabs.sendMessage(activeTab.id, { action: "tabId", ID: activeTab },
  //             function (response) {
  //               if (browser.runtime.lastError) {
  //                 console.error("Error sending message:", browser.runtime.lastError);
  //               }
  //             });
  //         }
  //       }
  //     });
  //   }
  // });


  // browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //   if (message.action === "startRecording") {
  //     console.log("starting recording")
  //     console.log(chrome.tabCapture.capture);
  //     browser.tabCapture.capture(
  //       {
  //         audio: true, // Capture audio from the tab
  //         video: true  // Capture video from the tab
  //       },
  //       (stream) => {
  //         if (stream) {
  //           const mediaRecorder = new MediaRecorder(stream);
  //           const chunks: BlobPart[] | undefined = [];
  
  //           mediaRecorder.ondataavailable = function (e) {
  //             chunks.push(e.data);
  //           };
  
  //           mediaRecorder.onstop = function () {
  //             const blob = new Blob(chunks, { type: 'video/webm' });
  //             const url = URL.createObjectURL(blob);
  
  //             // Here you can download the recording or upload it
  //             const link = document.createElement('a');
  //             link.href = url;
  //             link.download = 'tab-recording.webm';
  //             link.click();
  //           };
  
  //           mediaRecorder.start();
  
  //           // Stop the recording after 10 seconds for demonstration
  //           setTimeout(() => {
  //             mediaRecorder.stop();
  //           }, 10000);
  //         } else {
  //           console.error('Failed to capture tab');
  //         }
  //       }
  //     );
  //   }
  // });

  // // Start recording when the screen is selected
  // function startRecording(): void {
  //   if (isRecording) return;
  //   browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //     if (tabs.length > 0) {
  //       const activeTab = tabs[0];
  //       if (tabs.length > 0 && activeTab.id != undefined) {
  //         browser.desktopCapture.chooseDesktopMedia(['screen', 'window', 'tab'], activeTab, (streamId: string) => {
  //           if (browser.runtime.lastError || !streamId) {
  //             console.error('Failed to capture screen:', browser.runtime.lastError);
  //             return;
  //           }
  //           const constraints = {
  //             audio: true,
  //             video: true,
  //           };

  //           navigator.mediaDevices.getUserMedia(constraints)
  //             .then((stream) => {
  //               console.log("video started")
  //               currentStream = stream;
  //               mediaRecorder = new MediaRecorder(stream);

  //               mediaRecorder.ondataavailable = (event: BlobEvent) => {
  //                 chunks.push(event.data);
  //                 console.log("chunk pushed");
  //               };

  //               mediaRecorder.onstop = () => {
  //                 if (chunks.length > 0) {
  //                   const blob = new Blob(chunks, { type: 'video/webm' });
  //                   sendToServer(blob);
  //                   chunks = [];  // Reset chunks after sending
  //                 }
  //               };

  //               mediaRecorder.start();
  //               isRecording = true;
  //               console.log("Recording started...");
  //             })
  //             .catch((error: DOMException) => {
  //               console.error('Error starting screen capture:', error);
  //             });
  //         });
  //       }
  //     }
  //   });
  // }

  // // Stop recording
  // function stopRecording(): void {
  //   if (mediaRecorder && isRecording) {
  //     mediaRecorder.stop();
  //     if (currentStream) {
  //       currentStream.getTracks().forEach((track) => track.stop());  // Stop all tracks
  //     }
  //     isRecording = false;
  //     console.log("Recording stopped.");
  //   }
  // }

  // // Send video to the server
  // function sendToServer(blob: Blob): void {
  //   const formData = new FormData();
  //   formData.append('video', blob, 'video.webm');

  //   fetch('https://yourserver.com/upload', {
  //     method: 'POST',
  //     body: formData,
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log('Video uploaded successfully:', data);
  //     })
  //     .catch((error) => {
  //       console.error('Error uploading video:', error);
  //     });
  // }



});


