import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  getAllFAQs, 
  createFAQ, 
  updateFAQ, 
  deleteFAQ, 
  updateFAQOrder 
} from '../../api/faqApi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaBars } from 'react-icons/fa';

const FAQForm = ({ faq, onSave, onCancel, isEditing }) => {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    status: faq?.status || 'active',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {isEditing ? 'Edit FAQ' : 'Add New FAQ'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Question *
          </label>
          <input
            type="text"
            id="question"
            name="question"
            value={formData.question}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Answer *
          </label>
          <textarea
            id="answer"
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You can use basic HTML for formatting
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isEditing ? 'Update FAQ' : 'Add FAQ'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ManageFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const data = await getAllFAQs();
      
      if (!Array.isArray(data)) {
        console.error('Expected an array of FAQs but got:', data);
        setFaqs([]);
        return;
      }
      
      setFaqs(data);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again.');
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFAQ = async (faqData) => {
    try {
      await createFAQ(faqData);
      toast.success('FAQ created successfully');
      setShowForm(false);
      fetchFAQs();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error('Failed to create FAQ');
    }
  };

  const handleUpdateFAQ = async (id, faqData) => {
    try {
      await updateFAQ(id, faqData);
      toast.success('FAQ updated successfully');
      setEditingFAQ(null);
      fetchFAQs();
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFAQ = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await deleteFAQ(id);
        toast.success('FAQ deleted successfully');
        fetchFAQs();
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        toast.error('Failed to delete FAQ');
      }
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(faqs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFaqs(items);
    
    try {
      const orderedIds = items.map(item => item._id);
      await updateFAQOrder(orderedIds);
      toast.success('FAQ order updated');
    } catch (error) {
      console.error('Error updating FAQ order:', error);
      toast.error('Failed to update FAQ order');
      // Revert on error
      fetchFAQs();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <Helmet>
        <title>Manage FAQs - Admin Panel</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage FAQs
          </h1>
          <button
            onClick={() => {
              setEditingFAQ(null);
              setShowForm(!showForm);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2" />
            {showForm ? 'Cancel' : 'Add New FAQ'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {(showForm || editingFAQ) && (
          <FAQForm
            faq={editingFAQ || {}}
            onSave={async (data) => {
              if (editingFAQ) {
                await handleUpdateFAQ(editingFAQ._id, data);
              } else {
                await handleCreateFAQ(data);
              }
            }}
            onCancel={() => {
              setEditingFAQ(null);
              setShowForm(false);
            }}
            isEditing={!!editingFAQ}
          />
        )}

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          {faqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No FAQs found. Click "Add New FAQ" to get started.
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="faqs">
                {(provided) => (
                  <ul 
                    className="divide-y divide-gray-200 dark:divide-gray-700"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {faqs.map((faq, index) => (
                      <Draggable key={faq._id} draggableId={faq._id} index={index}>
                        {(provided) => (
                          <li 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div 
                                    className="p-2 mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-move"
                                    {...provided.dragHandleProps}
                                  >
                                    <FaBars />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                      {faq.question}
                                    </h3>
                                    <div className="mt-1 flex items-center">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        faq.status === 'active' 
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                      }`}>
                                        {faq.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingFAQ(faq);
                                      setShowForm(true);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFAQ(faq._id)}
                                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                              {editingFAQ?._id === faq._id && (
                                <div className="mt-4 pl-8">
                                  <FAQForm
                                    faq={editingFAQ}
                                    onSave={async (data) => {
                                      await handleUpdateFAQ(editingFAQ._id, data);
                                    }}
                                    onCancel={() => setEditingFAQ(null)}
                                    isEditing={true}
                                  />
                                </div>
                              )}
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageFAQs;
