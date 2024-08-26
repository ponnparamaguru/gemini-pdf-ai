import React, { useEffect } from 'react';

const SplashScreen = ({ onHide }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onHide]);

  return (
    <div className="bg-teal-500 text-white fixed inset-0 flex items-center justify-center z-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">AI PDF Assisstance</h1>
        <p className="text-lg">Upload PDF and ask question related to this PDF</p>
      </div>
    </div>
  );
};

export default SplashScreen;
