import axios from './axios';

// Get user's cart
export const getCart = async () => {
  try {
    const response = await axios.get('/cart');
    return response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// Add item to cart
export const addToCart = async (courseId, quantity = 1) => {
  try {
    const response = await axios.post('/cart', { courseId, quantity });
    return response.data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  try {
    const response = await axios.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (itemId) => {
  try {
    const response = await axios.delete(`/cart/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const response = await axios.delete('/cart');
    return response.data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
