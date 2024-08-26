import React, { useEffect } from 'react';

const SplashScreen = ({ onHide }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onHide();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onHide]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">AI PDF Assisstance</h1>
        <p className="text-lg text-gray-600">Upload PDF and ask question related to this PDF</p>
      </div>
    </div>
  );
};

export default SplashScreen;
