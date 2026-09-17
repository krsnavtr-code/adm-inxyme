import { useState } from "react";
import { toast } from "react-toastify";
import { FaUpload, FaVideo, FaTimes } from "react-icons/fa";

const VideoUploader = ({
  onUploadSuccess,
  label = "Upload Video",
  className = "",
  maxSizeMB = 100,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (!selectedFiles || selectedFiles.length === 0) return;

    // Check file types and sizes
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const maxSize = maxSizeMB * 1024 * 1024;

    const validFiles = [];
    const newPreviewUrls = [];

    for (const file of selectedFiles) {
      if (!validTypes.includes(file.type)) {
        toast.error(
          `${file.name} is not a valid video type. Only MP4, WebM, and QuickTime are allowed.`,
        );
        continue;
      }

      if (file.size > maxSize) {
        toast.error(
          `${file.name} is too large. Maximum size is ${maxSizeMB}MB.`,
        );
        continue;
      }

      validFiles.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...validFiles]);
      setPreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls]);
      toast.success(`${validFiles.length} video(s) added`);
    }
  };

  const removeVideo = (index) => {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setFiles((prevFiles) => prevFiles.filter((file, i) => i !== index));
    setPreviewUrls((prevUrls) => prevUrls.filter((url, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select videos to upload");
      return;
    }

    const uploadedFiles = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      setIsUploading(true);
      const token = localStorage.getItem("token");
      const API_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4002/api";

      // Show uploading toast
      const toastId = toast.loading(`Uploading ${files.length} video(s)...`);

      // Upload each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch(`${API_URL}/upload/video`, {
            method: "POST",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
            credentials: "include",
            body: formData,
          });

          let data;
          try {
            const responseText = await response.text();
            try {
              data = responseText ? JSON.parse(responseText) : {};
            } catch (e) {
              console.error(
                "Failed to parse JSON response:",
                e,
                "Response:",
                responseText,
              );
              if (response.status === 413) {
                throw new Error("File is too large. Maximum size is 1GB.");
              } else if (responseText.includes("Request Entity Too Large")) {
                throw new Error("File is too large. Maximum size is 1GB.");
              } else {
                throw new Error(
                  "Server returned an invalid response. Please try again.",
                );
              }
            }
          } catch (e) {
            if (e.message.includes("Failed to fetch")) {
              throw new Error(
                "Network error. Please check your connection and try again.",
              );
            }
            throw e; // Re-throw other errors
          }

          if (!response.ok) {
            throw new Error(
              data.message || `Upload failed with status ${response.status}`,
            );
          }

          const result = data.data || data;
          if (result) {
            uploadedFiles.push({
              ...result,
              url: result.url || `${API_URL}${result.path}`,
              type: "video",
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          errorCount++;
        }
      }

      // Update toast to final status
      if (successCount > 0 && errorCount === 0) {
        toast.update(toastId, {
          render: `${successCount} video(s) uploaded successfully!`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast.update(toastId, {
          render: `${successCount} uploaded, ${errorCount} failed`,
          type: "warning",
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
      } else {
        toast.update(toastId, {
          render: "All videos failed to upload",
          type: "error",
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
      }

      if (onUploadSuccess && uploadedFiles.length > 0) {
        onUploadSuccess(uploadedFiles);
      }

      // Clean up all previews and reset files
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error("Failed to upload videos");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File selector */}
      <div
        className="flex items-center justify-center w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <label
          htmlFor="video-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer 
            border-blue-500 hover:bg-blue-50 dark:border-blue-600 dark:hover:border-blue-500 dark:hover:bg-gray-700
            transition-colors duration-200 relative`}
        >
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <FaVideo className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload video</span> or
              drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              MP4, WebM or MOV (MAX. {maxSizeMB}MB each) - Multiple files
              allowed
            </p>
          </div>
          <input
            id="video-upload"
            type="file"
            className="hidden"
            accept="video/mp4,video/webm,video/quicktime"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Video previews grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <video
                className="w-full h-32 object-cover rounded-lg border"
                controls
                src={url}
              />
              <button
                type="button"
                onClick={() => removeVideo(index)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <FaTimes size={12} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                {files[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${files.length === 0 || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isUploading
            ? `Uploading ${files.length} video(s)...`
            : `Upload ${files.length} Video(s)`}
        </button>
      </div>
    </div>
  );
};

export default VideoUploader;
