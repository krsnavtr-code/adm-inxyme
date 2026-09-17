import React, { useState } from 'react';
import ImageUploader from "../../components/common/ImageUploader";
import { Link } from 'react-router-dom';

const ImageUploadDemo = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const handleUploadSuccess = (filePath) => {
    setUploadedImageUrl(filePath);
  };

  return (
      <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Image Upload Demo</h1>
      <Link to="/admin/media">Media Upload</Link>
        
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload an Image</h2>
          
          <ImageUploader 
            onUploadSuccess={handleUploadSuccess}
            className="mb-8"
            maxSizeMB={5}
          />
          
          {uploadedImageUrl && (
            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Uploaded Image URL:</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  readOnly
                  value={uploadedImageUrl}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  onClick={(e) => e.target.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedImageUrl);
                    alert('URL copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Copy URL
                </button>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Preview:</h4>
                <div className="max-w-md">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Uploaded preview" 
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Usage Instructions</h3>
            <ol className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
              <li>Click the upload area or drag and drop an image</li>
              <li>Click "Upload Image" to upload to the server</li>
              <li>Use the copy button to copy the image URL</li>
              <li>Use this URL in your application where needed</li>
            </ol>
          </div>
        </div>
      </div>
  );
};

export default ImageUploadDemo;
