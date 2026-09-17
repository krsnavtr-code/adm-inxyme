import React from "react";
import MediaUploader from "../../components/common/MediaUploader";
import ImageGallery from "../../components/admin/ImageGallery";
import { Link } from "react-router-dom";

const AdminMediaGallery = () => {
  const handleImageUpload = (file) => {
    // You can add additional logic here if needed
  };

  const handleVideoUpload = (file) => {
    // You can add additional logic here if needed
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Media Library
          </h1>
          <Link
            to="/admin/image-gallery"
            className="flex items-center text-blue-600 px-6 py-3 hover:bg-blue-700 hover:text-white rounded"
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
              />
            </svg>
            Image Gallery
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Upload and manage your media files. Supported formats: JPG, PNG, GIF,
          MP4, WebM, MOV.
        </p>
      </div>

      <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Upload New Media
        </h2>
        <MediaUploader
          onImageUploadSuccess={handleImageUpload}
          onVideoUploadSuccess={handleVideoUpload}
          maxVideoSizeMB={500}
        />
      </div>

      {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          Media Library
        </h2>
        <ImageGallery />
      </div> */}
    </div>
  );
};

export default AdminMediaGallery;
