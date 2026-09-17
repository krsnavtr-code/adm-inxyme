// import { VITE_API_URL } from '../api/axios.js';
const VITE_API_URL= import.meta.env.VITE_API_URL;

/**
 * Get full image URL from a path
 * @param {string} path - Image path (can be relative or absolute)
 * @returns {string} Full image URL
 */
// export const getImageUrl = (path) => {
//   if (!path) return '';
  
//   // If it's already a full URL, return as is
//   if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
//     return path;
//   }
  
//   // If it's a path starting with /, use the API URL as base
//   if (path.startsWith('/')) {
//     return `${VITE_API_URL}${path}`;
//   }
  
//   // Otherwise, assume it's a relative path from the uploads directory
//   return `${VITE_API_URL}/public/uploads/${path}`;
// };
export const getImageUrl = (path) => {
  if (!path) {
    console.log('No path provided, returning empty string');
    return '';
  }

  // If it's a data URL, return as is
  if (path.startsWith('data:')) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  
  // If it's already a full URL
  if (path.startsWith('http')) {
    // If it's from our own domain or eklabya.com, return as is
    if (path.includes(window.location.hostname) || path.includes('eklabya.com')) {
      return path;
    }
    // For other external URLs, proxy through our backend
    return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(path)}`;
  }

  // Remove any leading slashes or uploads/ from the path
  let cleanPath = path.replace(/^\/+|^uploads\/+/, '');
  
  // Make sure we don't have any double slashes
  cleanPath = cleanPath.replace(/\/+/g, '/');
  
  // Construct the final URL
  return `${baseUrl}/uploads/${cleanPath}`;
};

/**
 * Get thumbnail URL with optional size parameters
 * @param {string} path - Original image path
 * @param {Object} options - Options for thumbnail generation
 * @param {number} [options.width=300] - Thumbnail width
 * @param {number} [options.height=200] - Thumbnail height
 * @param {boolean} [options.crop=true] - Whether to crop the image to exact dimensions
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (path, { width = 300, height = 200, crop = true } = {}) => {
  if (!path) return '';
  
  // For external images, return as is (or implement your CDN logic here)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  
  // For local images, you might want to use an image processing service
  // This is a placeholder - adjust based on your backend capabilities
  const baseUrl = path.startsWith('/') ? VITE_API_URL : `${VITE_API_URL}/uploads`;
  const imagePath = path.startsWith('/') ? path : `/${path}`;
  
  // Example: Using a hypothetical image processing endpoint
  // return `${baseUrl}/image/process${imagePath}?width=${width}&height=${height}&crop=${crop}`;
  
  // For now, just return the full URL
  return `${baseUrl}${imagePath}`;
};

/**
 * Get avatar URL with fallback to default avatar
 * @param {string} avatarPath - User's avatar path
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (avatarPath) => {
  if (avatarPath) {
    return getImageUrl(avatarPath);
  }
  // Return default avatar URL
  return '/images/default-avatar.png';
};

/**
 * Get course thumbnail URL with fallback to default course image
 * @param {string} thumbnailPath - Course thumbnail path
 * @returns {string} Thumbnail URL
 */
export const getCourseThumbnail = (thumbnailPath) => {
  if (thumbnailPath) {
    return getImageUrl(thumbnailPath);
  }
  // Return default course thumbnail URL
  return '/images/course-placeholder.jpg';
};

/**
 * Preload an image
 * @param {string} src - Image URL to preload
 * @returns {Promise<HTMLImageElement>} Promise that resolves when image is loaded
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};
