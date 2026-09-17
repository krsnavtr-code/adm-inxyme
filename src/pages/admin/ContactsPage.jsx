import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import ContactsList from "../../components/admin/ContactsList";

const ContactsPage = () => {
  const { token } = useAuth();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contact Submissions
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage all contact form submissions
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <ContactsList token={token} />
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;
