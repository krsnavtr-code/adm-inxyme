import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getCategoryById,
  createCategory,
  updateCategory,
} from "../../../api/categoryApi";

const CategoryForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    master: false,
    isActive: true,
    showOnHome: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchCategory();
    }
  }, [id, isEditing]); // Add isEditing to dependency array

  const fetchCategory = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const category = await getCategoryById(id);

      if (!category) {
        throw new Error("Category not found");
      }

      setFormData({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
        imageFile: null,
        master: category.master || false,
        isActive: category.isActive !== false,
        showOnHome: category.showOnHome || false,
      });
    } catch (err) {
      console.error("Error fetching category:", err);
      toast.error(err.message || "Failed to load category");
      navigate("/admin/categories");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: newValue,
      };
      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 3 || formData.name.length > 50) {
      newErrors.name = "Name must be between 3 and 50 characters";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    // Validate image URL
    if (!formData.image) {
      newErrors.image = "Image URL is required";
    } else if (!/^(https?:\/\/|\/)/i.test(formData.image)) {
      newErrors.image =
        "Please enter a valid URL (must start with http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.name || !formData.name.trim()) {
      console.error("Validation failed: Name is required");
      toast.error("Name is required");
      setErrors((prev) => ({ ...prev, name: "Name is required" }));
      return;
    }

    const trimmedName = formData.name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      console.error(
        "Validation failed: Name must be between 3 and 50 characters"
      );
      toast.error("Name must be between 3 and 50 characters");
      setErrors((prev) => ({
        ...prev,
        name: "Name must be between 3 and 50 characters",
      }));
      return;
    }

    try {
      setLoading(true);

      // Prepare the category data as a plain object
      const categoryData = {
        name: trimmedName,
        description: formData.description?.trim() || "",
        isActive: formData.isActive,
        showOnHome: formData.showOnHome,
        master: formData.master,
        image: formData.image?.trim() || "",
      };

      // If there's a file to upload, use FormData
      let requestData = { ...categoryData }; // Create a copy to avoid modifying the original

      if (formData.imageFile && formData.imageFile instanceof File) {
        const formDataToSend = new FormData();
        Object.entries(categoryData).forEach(([key, value]) => {
          // Convert boolean values to strings for FormData
          const formValue = typeof value === "boolean" ? String(value) : value;
          formDataToSend.append(key, formValue);
        });
        formDataToSend.append("image", formData.imageFile);
        requestData = formDataToSend;
      }

      if (isEditing) {
        const response = await updateCategory(id, requestData);
        toast.success("Category updated successfully");
      } else {
        const response = await createCategory(requestData);
        toast.success("Category created successfully");
      }

      navigate("/admin/categories");
    } catch (err) {
      console.error("Error saving category:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to save category";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="p-8">Loading category data...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl text-black font-bold">
          {isEditing ? `Edit Category: ${formData.name}` : "Add New Category"}
        </h2>
        {isEditing && (
          <p className="text-sm text-gray-500 mt-1">
            Update the details for this category
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`mt-1 block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.name ? "border-red-500" : ""
            }`}
            disabled={loading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className={`mt-1 block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.description ? "border-red-500" : ""
            }`}
            disabled={loading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700"
          >
            Image URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className={`mt-1 block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.image ? "border-red-500" : ""
            }`}
            disabled={loading}
          />
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image}</p>
          )}
          {formData.image && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">Image Preview:</p>
              <img
                src={formData.image}
                alt="Preview"
                className="mt-1 h-32 w-32 object-cover rounded"
                onError={(e) => {
                  e.target.style.display = "none";
                  setErrors((prev) => ({
                    ...prev,
                    image:
                      "Could not load image from URL. Please check the URL and try again.",
                  }));
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={loading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-black">
              Active
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="showOnHome"
              name="showOnHome"
              type="checkbox"
              checked={formData.showOnHome}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={loading}
            />
            <label
              htmlFor="showOnHome"
              className="ml-2 block text-sm text-black"
            >
              Show on Home Page
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : isEditing
              ? "Update Category"
              : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
