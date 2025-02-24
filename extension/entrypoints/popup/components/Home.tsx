import React, { useState } from 'react';
import axios from 'axios';
import LoadingBar from './Loadingbar';

const Home: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Start recording by sending message to the background script
  const startRecording = () => {
    // setLoading(true);
    
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0 && tabs[0].id !== undefined) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "startRecording"},
          function (response) {
            if (browser.runtime.lastError) {
              console.error("Error sending message:", browser.runtime.lastError);
            }
          });
      } else {
        console.error("No active tab found or tab ID is undefined.");
      }
    });
  };

  // Stop recording by sending message to the background script
  const stopRecording = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ action: 'stopRecording' }, () => {
      setIsRecording(false);
      setLoading(false);
    });
  };

  useEffect(()=>{
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log(message);
      if (message.type === 'recordingStopped') {
        setIsRecording(false);
      }
      if(message.type === 'recordingStarted'){
        setIsRecording(true);
    }});  
  },[isRecording])

  return (
    <>
      {loading && <LoadingBar />}
      <div className="h-[600px] w-[600px] bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Screen Recording</h1>
          
          <div className="flex flex-col items-center">
            <button
              onClick={startRecording}
              disabled={isRecording}
              className="w-full py-3 mb-4 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 focus:outline-none disabled:bg-gray-400"
            >
              Start Recording
            </button>

            <button
              onClick={stopRecording}
              disabled={!isRecording}
              className="w-full py-3 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600 focus:outline-none disabled:bg-gray-400"
            >
              Stop Recording
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
