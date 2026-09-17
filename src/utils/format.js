// Format price with currency symbol and decimal places
export const formatPrice = (price) => {
  if (price === 0 || price === '0') return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};

// Format duration in minutes to human-readable format
export const formatDuration = (minutes) => {
  if (!minutes) return null;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  let result = [];
  if (hours > 0) result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (mins > 0) result.push(`${mins} min${mins > 1 ? 's' : ''}`);
  
  return result.join(' ');
};

// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Truncate text to a certain length and add ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Format number with commas
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Convert HTML to plain text
export const htmlToText = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};
