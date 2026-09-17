import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { submitContactForm } from "../../api/contactApi";
import { Link, useNavigate } from "react-router-dom";

const ContactFormModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    courseInterest: "",
    agreedToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(Array.isArray(data) ? data : data.data || []);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent rapid submissions (5 second cooldown)
    const now = Date.now();
    if (now - lastSubmitTime < 5000) {
      toast.warning("Please wait a few seconds before submitting again");
      return;
    }

    if (!formData.agreedToTerms) {
      toast.error("Please accept the terms & conditions and privacy policy");
      return;
    }

    setLastSubmitTime(now);

    setIsSubmitting(true);

    try {
      // Prepare the data to match backend expectations
      const submissionData = {
        ...formData,
        // Map courseInterest to courseId and find the course title
        courseId: formData.courseInterest,
        courseTitle: formData.courseInterest
          ? courses.find((c) => c._id === formData.courseInterest)?.title || ""
          : "",
      };

      // Remove the courseInterest field as it's not needed by the backend
      delete submissionData.courseInterest;

      const result = await submitContactForm(submissionData);

      if (result.success) {
        // Save trackingId to localStorage for future visit tracking
        if (result.data?.trackingId) {
          localStorage.setItem("user_tracker_id", result.data.trackingId);
        }

        // Reset form data
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          courseInterest: "",
          agreedToTerms: false,
        });

        // Close the modal and redirect to thank you page
        onClose();
        navigate("/thank-you", {
          state: {
            message:
              result.message || "Your message has been sent successfully!",
            conversionData: {
              transaction_id: "",
              value: 1.0,
              currency: "INR",
            },
          },
        });
      } else {
        // Handle API validation errors
        if (result.errors) {
          Object.values(result.errors).forEach((error) => {
            toast.error(error);
          });
        } else {
          toast.error(
            result.message || "Failed to send message. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error.message ||
          error.response?.data?.message ||
          "Failed to send message. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 mt-20">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-middle bg-white dark:bg-gray-800 rounded-lg text-left overflow-y-auto shadow-xl transform transition-all max-h-[90vh] sm:my-4 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 py-4 sm:px-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Request A Call Back
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            </div>

            {isSuccess ? (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-base font-medium text-gray-900 dark:text-white">
                  Message Sent!
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  Thank you for contacting us.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full justify-center rounded-md border border-transparent shadow-sm px-3 py-1.5 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 border-gray-800 text-black"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 border-gray-800 text-black"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 border-gray-800 text-black"
                    placeholder="+91 8080808080"
                  />
                </div>

                <div>
                  <label
                    htmlFor="courseInterest"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    I'm interested in: (Optional)
                  </label>
                  {isLoadingCourses ? (
                    <div className="relative">
                      <select
                        id="courseInterest"
                        name="courseInterest"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 border-gray-800 text-black"
                      >
                        <option>Loading courses...</option>
                      </select>
                    </div>
                  ) : courses.length > 0 ? (
                    <select
                      id="courseInterest"
                      name="courseInterest"
                      value={formData.courseInterest}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 border-gray-800 text-black"
                    >
                      <option value="">Select a course (optional)</option>
                      {courses.map((course) => (
                        <option
                          key={course._id || course.id}
                          value={course._id || course.id}
                        >
                          {course.title || course.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      id="courseInterest"
                      name="courseInterest"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 border-gray-800 text-black"
                    >
                      <option>No courses available</option>
                    </select>
                  )}
                </div>

                {/* <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Write Something
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="2"
                    value={formData.message}
                    onChange={handleChange}
                    // required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white bg-gray-50 border-gray-800 text-black"
                    placeholder="How can we help you?"
                  ></textarea>
                </div> */}

                <div className="flex items-start space-x-2">
                  <input
                    id="agreedToTerms"
                    name="agreedToTerms"
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    className="mt-1 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 bg-gray-50 border-gray-800 text-black"
                    required
                  />
                  <div className="text-xs">
                    <label
                      htmlFor="agreedToTerms"
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      I hereby agree to receive the promotional emails &
                      messages through WhatsApp/RCS/SMS{" "}
                      <Link
                        to="/terms-of-service"
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        T&C
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy-policy"
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Privacy Policy
                      </Link>
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactFormModal;
