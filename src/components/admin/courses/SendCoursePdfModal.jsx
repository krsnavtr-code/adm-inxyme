import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaPaperPlane, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import api from '../../../api/axios';

const SendCoursePdfModal = ({ course, isOpen, onClose, onSuccess }) => {
  const [emails, setEmails] = useState(['']);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index) => {
    if (emails.length <= 1) return;
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty emails and validate
    const validEmails = emails.filter(email => email.trim() !== '');
    
    if (validEmails.length === 0) {
      setError('At least one email is required');
      return;
    }
    
    // Validate all emails
    const invalidEmails = validEmails.filter(email => !validateEmail(email));
    if (invalidEmails.length > 0) {
      setError('Please enter valid email addresses');
      return;
    }
    
    try {
      setIsSending(true);
      setError('');
      
      const response = await api.post(`/courses/${course._id}/send-pdf`, { emails: validEmails });
      
      if (response.data.success) {
        toast.success(`PDF sent successfully to ${validEmails.length} email(s)`);
        setEmails(['']);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        throw new Error(response.data.message || 'Failed to send PDF');
      }
    } catch (error) {
      console.error('Error sending course PDF:', error);
      setError(error.response?.data?.message || error.message || 'Failed to send PDF');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Send Course PDF</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSending}
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Emails
            </label>
            <div className="space-y-2 mb-2">
              {emails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email address"
                    disabled={isSending}
                  />
                  {emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="p-2 text-red-500 hover:text-red-700 focus:outline-none"
                      disabled={isSending}
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEmailField}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-1 mb-2"
              disabled={isSending}
            >
              <FaPlus className="mr-1" /> Add another email
            </button>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" />
                  Send PDF to {emails.filter(e => e.trim() !== '').length} email(s)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendCoursePdfModal;
