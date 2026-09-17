import React, { useState } from 'react';
import { FaComment, FaTimes } from 'react-icons/fa';
import ContactFormModal from './ContactFormModal';

const ChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-8 right-8 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none"
        aria-label="Chat with us"
      >
        {isOpen ? (
          <FaTimes className="w-6 h-6" />
        ) : (
          <FaComment className="w-6 h-6" />
        )}
      </button>
      <ContactFormModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatButton;
