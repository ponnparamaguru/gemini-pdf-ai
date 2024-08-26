import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaFileUpload, FaPaperPlane, FaRegTrashAlt, FaTimes } from 'react-icons/fa';
import SplashScreen from './SplashScreen';
import { marked } from 'marked';

function App() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showNoPdfPopup, setShowNoPdfPopup] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleUploadFiles = async () => {
    if (loading) return;

    if (files.length === 0) {
      setShowNoPdfPopup(true);
      return;
    }

    setLoading(true);
    setAiTyping(true);

    const formData = new FormData();
    for (const file of files) {
      formData.append('pdfs', file);
    }
    formData.append('message', message);

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'user', text: message },
    ]);

    try {
      const response = await axios.post('https://gemini-pdf-ai-server.vercel.app/api/chat', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const formattedResponse = marked(response.data.reply);

      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'ai', text: formattedResponse },
      ]);
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'ai', text: 'An error occurred while processing the PDF.' },
      ]);
    } finally {
      setLoading(false);
      setAiTyping(false);
      setMessage('');
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const triggerFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSplashHide = () => {
    setShowSplash(false);
  };

  const handleNoPdfPopupClose = () => {
    setShowNoPdfPopup(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleUploadFiles();
    }
  };

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {showSplash && <SplashScreen onHide={handleSplashHide} />}
      <div className='bg-teal-500 w-full h-14 flex items-center pl-4 md:pl-10'>
        <h1 className='text-xl md:text-2xl font-semibold text-white'>AI PDF Assistance</h1>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 bg-gray-50 border-t border-gray-300 ${showSplash ? 'hidden' : ''}`}>
        <div className="h-full flex flex-col">
          {messages.length === 0 && !aiTyping ? (
            <div className="flex-1 text-center mt-32 md:mt-10 text-gray-500">No messages yet</div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-2 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`px-4 py-2 rounded-lg ${msg.type === 'user' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-800'} shadow-md`}
                    dangerouslySetInnerHTML={{ __html: msg.text }} 
                  />
                </div>
              ))}
              {aiTyping && (
                <div className="mb-2 flex justify-start">
                  <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 shadow-md">
                    AI is typing...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} /> 
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 border-t border-gray-300 bg-white flex items-center space-x-2 ${showSplash ? 'hidden' : ''}`}>
        <button
          onClick={openModal}
          className='p-2 bg-teal-500 text-white hover:bg-teal-600 rounded-md'
        >
          <FaFileUpload className="text-white" size={20} />
        </button>

        <input
          id="message"
          type="text"
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 sm:text-sm"
          placeholder="Ask a question..."
        />

        <button
          type="button"
          onClick={() => { if (!loading) handleUploadFiles() }} 
          disabled={loading}
          className={`p-2 border border-transparent rounded-md shadow-md text-white ${loading ? 'bg-gray-400' : 'bg-teal-500 hover:bg-teal-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
        >
          <FaPaperPlane size={20} />
        </button>

        <button
          type="button"
          onClick={handleClear}
          className={`hidden md:block p-2 border border-transparent rounded-md shadow-md text-white ${messages.length === 0 ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          disabled={messages.length === 0}
        >
          <FaRegTrashAlt size={20} />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900"
            >
              <FaTimes size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Selected Files</h2>
            {files.length === 0 ? (
              <p className="text-gray-500">No files selected</p>
            ) : (
              <ul className="list-disc pl-5 mb-4">
                {[...files].map((file, index) => (
                  <li key={index} className="text-gray-800">{file.name}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-col space-y-4">
              <input
                ref={fileInputRef} 
                id="file-upload"
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden" 
              />
              <div className="flex space-x-4">
                <button
                  onClick={triggerFileInputClick}
                  className="px-4 py-2 border border-transparent rounded-md shadow-md text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Choose Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoPdfPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center">
            <h2 className="text-lg font-semibold mb-4">No PDF Files Selected</h2>
            <p className="mb-4">Please upload at least one PDF file before asking questions.</p>
            <button
              onClick={handleNoPdfPopupClose}
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
