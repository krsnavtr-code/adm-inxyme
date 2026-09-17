import { useState } from "react";
import { toast } from "react-toastify";
import { FaUpload, FaTimes } from "react-icons/fa";

const ImageUploader = ({
  onUploadSuccess,
  label = "Upload Image",
  className = "",
  maxSizeMB = 5,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (!selectedFiles || selectedFiles.length === 0) return;

    // Check file types and sizes
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes

    const validFiles = [];
    const newPreviewUrls = [];

    for (const file of selectedFiles) {
      if (!validTypes.includes(file.type)) {
        toast.error(
          `${file.name} is not a valid image type. Only JPG, PNG, WebP, and GIF are allowed.`,
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
      toast.success(`${validFiles.length} image(s) added`);
    }
  };

  const removeImage = (index) => {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setFiles(files.filter((file, i) => i !== index));
    setPreviewUrls(previewUrls.filter((url, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select images to upload");
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

      // Upload each file individually
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        try {
          // Add cache-busting parameter
          const url = new URL(`${API_URL}/upload/image`);
          url.searchParams.append("_t", Date.now());

          const headers = {};
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          const response = await fetch(url, {
            method: "POST",
            headers: headers,
            credentials: "include",
            body: formData,
          });

          const responseText = await response.text();
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error("Failed to parse JSON response:", e);
            throw new Error("Invalid server response");
          }

          if (!response.ok) {
            throw new Error(
              data.message || `Upload failed with status ${response.status}`,
            );
          }

          const result = data.data || data;
          if (result) {
            uploadedFiles.push({
              url: result.url || result.path,
              path: result.path,
              name: result.name || file.name,
              type: "image",
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} image(s) uploaded successfully`);
        if (onUploadSuccess) {
          onUploadSuccess(uploadedFiles);
        }
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} image(s) failed to upload`);
      }

      // Clean up all previews and reset files
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviewUrls([]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File selector */}
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="image-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer 
            border-blue-500 hover:bg-blue-50 dark:border-blue-600 dark:hover:border-blue-500 dark:hover:bg-gray-700
            transition-colors duration-200 relative`}
        >
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <FaUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, WebP, GIF (MAX. {maxSizeMB}MB each) - Multiple files
              allowed
            </p>
          </div>
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Image previews grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder.svg";
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
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
            ? `Uploading ${files.length} image(s)...`
            : `Upload ${files.length} Image(s)`}
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;
