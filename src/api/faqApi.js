import api from './axios';

// Base endpoint for FAQs
const FAQ_ENDPOINT = '/faqs';

// Mock FAQ data to use when API is not available
const MOCK_FAQS = [
  {
    id: '1',
    question: 'What is FirstVite?',
    answer: 'FirstVite is an online learning platform that offers high-quality courses on various topics to help you advance your skills and career.',
    order: 1
  },
  {
    id: '2',
    question: 'How do I enroll in a course?',
    answer: 'Simply browse our course catalog, select a course you\'re interested in, and click the "Enroll Now" button to get started.',
    order: 2
  },
  {
    id: '3',
    question: 'Do you offer certificates?',
    answer: 'Yes, we offer certificates of completion for all our courses. You can download your certificate after successfully completing a course.',
    order: 3
  },
  {
    id: '4',
    question: 'What payment methods do you accept?',
    answer: 'We accept various payment methods including credit/debit cards, PayPal, and other popular payment gateways.',
    order: 4
  },
  {
    id: '5',
    question: 'Can I get a refund?',
    answer: 'Yes, we offer a 14-day money-back guarantee if you\'re not satisfied with your course purchase.',
    order: 5
  }
];

// Helper function to handle API errors
const handleApiError = (error, context) => {
  console.warn(`Error ${context}:`, error.message);
  
  // If this is a 404, we'll use mock data instead
  if (error.response?.status === 404) {
    console.warn('FAQ API endpoint not found, using mock data');
    return MOCK_FAQS;
  }
  
  // For other errors, show a toast notification in browser environment
  if (typeof window !== 'undefined') {
    import('react-hot-toast').then(({ toast }) => {
      toast.error(`Using mock FAQ data: ${error.message}`);
    });
  }
  
  // Return mock data instead of throwing an error
  return MOCK_FAQS;
};

// Get all FAQs (public)
export const getFAQs = async (params = {}) => {
  try {
    const defaultParams = {
      status: 'active',
      sort: 'order',
      order: 'asc',
      limit: 50
    };
    
    try {
      const response = await api.get(FAQ_ENDPOINT, { 
        params: { 
          ...defaultParams, 
          ...params,
          _t: Date.now() // Prevent caching
        },
        // Don't throw errors for 404, we'll handle it in catch
        validateStatus: (status) => status < 500
      });
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (response.data && Array.isArray(response.data.docs)) {
        return response.data.docs;
      } else if (response.data && response.data.success && Array.isArray(response.data.faqs)) {
        return response.data.faqs;
      }
      
      console.warn('Unexpected FAQ response format, using mock data');
      return MOCK_FAQS;
    } catch (error) {
      // If there's an error, use mock data
      console.warn('Error fetching FAQs, using mock data:', error.message);
      return handleApiError(error, 'fetching FAQs');
    }
  } catch (error) {
    console.error('Error in getFAQs:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return handleApiError(error, 'fetching FAQs');
  }
};

// Admin functions
const withAdminAuth = (config = {}) => ({
  ...config,
  headers: {
    ...config.headers,
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

// Get all FAQs (admin)
export const getAllFAQs = async () => {
  try {
    const response = await api.get('/admin/faqs', withAdminAuth());
    // Handle both direct array response and paginated response
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.docs)) {
      return response.data.docs; // Handle paginated response
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data; // Handle nested data array
    }
    return [];
  } catch (error) {
    console.error('Error in getAllFAQs:', error);
    return handleApiError(error, 'fetching all FAQs');
  }
};

// Get single FAQ
export const getFAQ = async (id) => {
  try {
    const response = await api.get(`/admin/faqs/${id}`, withAdminAuth());
    return response.data?.data || null;
  } catch (error) {
    return handleApiError(error, `fetching FAQ ${id}`);
  }
};

// Create FAQ
export const createFAQ = async (faqData) => {
  try {
    const response = await api.post(
      '/admin/faqs', 
      faqData, 
      withAdminAuth()
    );
    return response.data?.data || null;
  } catch (error) {
    return handleApiError(error, 'creating FAQ');
  }
};

// Update FAQ
export const updateFAQ = async (id, faqData) => {
  try {
    const response = await api.put(
      `/admin/faqs/${id}`, 
      faqData, 
      withAdminAuth()
    );
    return response.data?.data || null;
  } catch (error) {
    return handleApiError(error, `updating FAQ ${id}`);
  }
};

// Delete FAQ
export const deleteFAQ = async (id) => {
  try {
    await api.delete(`/admin/faqs/${id}`, withAdminAuth());
    return id; // Return the deleted FAQ ID
  } catch (error) {
    return handleApiError(error, `deleting FAQ ${id}`);
  }
};

// Update FAQ order
export const updateFAQOrder = async (orderedIds) => {
  try {
    const response = await api.put(
      '/admin/faqs/update-order', 
      { orderedIds },
      withAdminAuth()
    );
    return response.data?.data || null;
  } catch (error) {
    return handleApiError(error, 'updating FAQ order');
  }
};
