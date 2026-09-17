import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "https://www.eklabya.com/api";

// Helper function to extract filename from URL or path
const getFilename = (urlOrPath) => {
  if (!urlOrPath) return "";
  // Handle both URLs and paths
  const parts = urlOrPath.split(/[\\/]/);
  return parts[parts.length - 1];
};

// Helper function to get the full media URL
export const getImageUrl = (filename) => {
  if (!filename) return "";

  // If it's already a full URL, convert it to use our API endpoint
  if (filename.startsWith("http")) {
    const url = new URL(filename);
    const pathParts = url.pathname.split("/");
    const cleanFilename = pathParts[pathParts.length - 1];
    return `${API_URL}/upload/file/${encodeURIComponent(cleanFilename)}`;
  }

  // If it's a path, extract just the filename
  const cleanFilename = getFilename(filename);
  return `${API_URL}/upload/file/${encodeURIComponent(cleanFilename)}`;
};

// Get all uploaded media files (images and videos)
export const getUploadedImages = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/upload/files`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      withCredentials: true,
    });

    // The backend now returns properly formatted data with type information
    if (response.data && response.data.data) {
      // Ensure each file has the required fields
      response.data.data = response.data.data.map((file) => ({
        ...file,
        // Ensure type is set correctly
        type:
          file.type ||
          (file.mimetype?.startsWith("video/") ? "video" : "image"),
        // Ensure URL is properly formatted
        url: file.url || getImageUrl(file.name || file.path),
        // Add thumbnail URL (same as URL for now, can be optimized later)
        thumbnailUrl: file.url || getImageUrl(file.name || file.path),
      }));
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching images:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    throw error;
  }
};

// Upload an image
export const uploadImage = async (file) => {
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/upload/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      withCredentials: true,
    });

    // Transform the response to include the full URL and type
    if (response.data) {
      const result = response.data.data || response.data;
      if (result) {
        const filename =
          result.name || getFilename(result.path) || getFilename(result.url);
        const type =
          result.mimetype && result.mimetype.startsWith("video/")
            ? "video"
            : "image";

        return {
          ...result,
          url: getImageUrl(filename),
          type: type,
        };
      }
    }
    return response.data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Delete a media file
export const deleteMediaFile = async (filename) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(
      `${API_URL}/upload/file/${encodeURIComponent(filename)}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        withCredentials: true,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

// Upload a video
export const uploadVideo = async (file) => {
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(`${API_URL}/upload/video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      withCredentials: true,
      // Increase timeout for larger video files (in milliseconds)
      timeout: 300000, // 5 minutes
    });

    // Transform the response to include the full URL and type
    if (response.data) {
      const result = response.data.data || response.data;
      if (result) {
        const filename =
          result.name || getFilename(result.path) || getFilename(result.url);
        return {
          ...result,
          url: getImageUrl(filename),
          type: "video",
        };
      }
    }
    return response.data;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
};
