import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaTrashAlt,
} from "react-icons/fa";
import api from "../../utils/api";

const questionTypes = [
  { value: "short_answer", label: "Short Answer" },
  { value: "true_false", label: "True/False" },
  {
    value: "multiple_choice_single",
    label: "Multiple Choice (Single Correct)",
  },
  {
    value: "multiple_choice_multiple",
    label: "Multiple Choice (Multiple Correct)",
  },
  { value: "essay", label: "Essay" },
];

const TestQAPage = () => {
  const [qas, setQAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQA, setEditingQA] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    questionType: "short_answer",
    options: [{ text: "", isCorrect: false }],
    correctAnswer: "",
    explanation: "",
    isActive: true,
  });

  const fetchQAs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/test-qa");
      setQAs(response.data.data || []);
    } catch (err) {
      toast.error("Failed to load Q&A");
      console.error("Error fetching Q&A:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQAs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target || {};
    if (!name) return; // Guard against undefined target

    setFormData((prev) => {
      const newValue = type === "checkbox" ? checked : value || "";
      return {
        ...prev,
        [name]: newValue,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        // For multiple choice questions, we don't need correctAnswer
        ...(formData.questionType === "multiple_choice_single" ||
        formData.questionType === "multiple_choice_multiple"
          ? { correctAnswer: undefined }
          : { options: undefined }),
      };

      if (editingQA) {
        await api.put(`/api/admin/test-qa/${editingQA._id}`, payload);
        toast.success("Q&A updated successfully");
      } else {
        await api.post("/api/admin/test-qa", payload);
        toast.success("Q&A added successfully");
      }

      setShowForm(false);
      setEditingQA(null);
      setFormData({
        question: "",
        questionType: "short_answer",
        options: [{ text: "", isCorrect: false }],
        correctAnswer: "",
        explanation: "",
        isActive: true,
      });
      fetchQAs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleEdit = (qa) => {
    setEditingQA(qa);
    setFormData({
      question: qa.question,
      questionType: qa.questionType,
      options: qa.options || [],
      correctAnswer: qa.correctAnswer || "",
      explanation: qa.explanation || "",
      isActive: qa.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Q&A?")) {
      try {
        await api.delete(`/api/admin/test-qa/${id}`);
        toast.success("Q&A deleted successfully");
        fetchQAs();
      } catch (err) {
        toast.error("Failed to delete Q&A");
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/api/admin/test-qa/${id}/toggle`);
      toast.success(
        `Q&A ${currentStatus ? "deactivated" : "activated"} successfully`,
      );
      fetchQAs();
    } catch (err) {
      toast.error("Failed to update Q&A status");
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: "", isCorrect: false }],
    });
  };
  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };
  const toggleCorrectOption = (index) => {
    const newOptions = formData.options.map((option, i) => {
      if (formData.questionType === "multiple_choice_single") {
        return { ...option, isCorrect: i === index };
      }
      if (i === index) {
        return { ...option, isCorrect: !option.isCorrect };
      }
      return option;
    });
    setFormData({ ...formData, options: newOptions });
  };
  const renderQuestionForm = () => {
    switch (formData.questionType) {
      case "true_false":
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Correct Answer
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="correctAnswer"
                  value="true"
                  checked={formData.correctAnswer === "true"}
                  onChange={handleInputChange}
                  className="form-radio"
                />
                <span className="ml-2">True</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="correctAnswer"
                  value="false"
                  checked={formData.correctAnswer === "false"}
                  onChange={handleInputChange}
                  className="form-radio"
                />
                <span className="ml-2">False</span>
              </label>
            </div>
          </div>
        );
      case "multiple_choice_single":
      case "multiple_choice_multiple":
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Options{" "}
              {formData.questionType === "multiple_choice_single"
                ? "(Select one correct answer)"
                : "(Select all that apply)"}
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type={
                    formData.questionType === "multiple_choice_single"
                      ? "radio"
                      : "checkbox"
                  }
                  name={`option-${index}`}
                  checked={option.isCorrect}
                  onChange={() => toggleCorrectOption(index)}
                  className="mr-2"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) =>
                    handleOptionChange(index, "text", e.target.value)
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                  placeholder={`Option ${index + 1}`}
                />
                {formData.options.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <FaTrashAlt />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Option
            </button>
          </div>
        );
      case "short_answer":
      case "essay":
      default:
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Correct Answer
            </label>
            <textarea
              name="correctAnswer"
              value={formData.correctAnswer}
              onChange={handleInputChange}
              rows={formData.questionType === "essay" ? 6 : 2}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Manage Test Q&A</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingQA(null);
            setFormData({ question: "", answer: "", isActive: true });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" />
          {showForm ? "Cancel" : "Add New Q&A"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white text-black p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingQA ? "Edit Q&A" : "Add New Q&A"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="question"
              >
                Question *
              </label>
              <input
                type="text"
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="questionType"
              >
                Question Type *
              </label>
              <select
                id="questionType"
                name="questionType"
                value={formData.questionType}
                onChange={(e) => {
                  const isMultipleChoice =
                    e.target.value.includes("multiple_choice");
                  setFormData((prevData) => ({
                    ...prevData,
                    questionType: e.target.value,
                    options: isMultipleChoice
                      ? Array.isArray(prevData.options) &&
                        prevData.options.length > 0
                        ? prevData.options
                        : [{ text: "", isCorrect: false }]
                      : [],
                    correctAnswer: "",
                  }));
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {renderQuestionForm()}

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="explanation"
              >
                Explanation (Optional)
              </label>
              <textarea
                id="explanation"
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                rows="2"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {editingQA ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading Q&A...</p>
          </div>
        ) : qas.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No Q&A found. Click "Add New Q&A" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qas.map((qa) => (
                  <tr key={qa._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm font-medium text-gray-900">
                        {qa.question.length > 50
                          ? `${qa.question.substring(0, 50)}...`
                          : qa.question}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {questionTypes.find((t) => t.value === qa.questionType)
                          ?.label || qa.questionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          qa.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {qa.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(qa)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(qa._id)}
                          className="text-red-600 hover:text-red-900 ml-2"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                        <button
                          onClick={() => toggleStatus(qa._id, qa.isActive)}
                          className={
                            qa.isActive
                              ? "text-yellow-600 hover:text-yellow-900"
                              : "text-green-600 hover:text-green-900"
                          }
                          title={qa.isActive ? "Deactivate" : "Activate"}
                        >
                          {qa.isActive ? (
                            <FaToggleOff size={18} />
                          ) : (
                            <FaToggleOn size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap with ProtectedRoute to ensure only admins can access
export default function ProtectedTestQAPage() {
  return <TestQAPage />;
}
