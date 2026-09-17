import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import {
  FiSend,
  FiPaperclip,
  FiX,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiMail,
} from "react-icons/fi";
import { format } from "date-fns";

const CustomEmailSender = () => {
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [plainTextBody, setPlainTextBody] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewEmail, setViewEmail] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("custom");

  // Email templates
  const emailTemplates = {
    custom: {
      name: "Custom",
      subject: "",
      body: "",
    },
    portalInvite: {
      name: "Portal Register Invite",
      subject: "Invitation to Join Eklabya Learning Portal",
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Next Step: Register on Eklabya Learning Portal</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #667eea; margin: 0; font-size: 28px;">Welcome to Eklabya!</h1>
    </div>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Dear User,
    </p>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We are thrilled to have you with us! To take the next step and officially kickstart your learning journey, you just need to complete a quick registration on our portal. 
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #667eea; margin-top: 0;">Here is how to get started:</h3>
      <ol style="color: #333; line-height: 1.8; padding-left: 20px;">
        <li><strong>Enter your details</strong> on our registration page.</li>
        <li><strong>Verify your email</strong> using the One-Time Password (OTP) sent to your inbox.</li>
        <li><strong>Registration complete!</strong> You are now officially enrolled.</li>
      </ol>
      <p style="color: #333; font-size: 15px; margin-top: 15px;">
        <em>Once your registration is done, simply log in to check your profile and start exploring your learning dashboard.</em>
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.eklabya.com/register" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
        Complete Registration
      </a>
    </div>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      If you face any issues or have any questions, feel free to reach out to our support team. We are here to help!
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">Best regards,</p>
      <p style="margin: 5px 0 0 0; font-weight: bold;">The Eklabya Team</p>
      <p style="margin: 5px 0 0 0;">www.eklabya.com</p>
    </div>
  </div>
</body>
</html>`,
    },
    paymentConfirmation: {
      name: "Payment Confirmation",
      subject: "Payment Confirmation - Eklabya",
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <svg style="width: 30px; height: 30px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h1 style="color: #667eea; margin: 0; font-size: 28px;">Payment Successful!</h1>
    </div>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      Dear User,
    </p>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      We're pleased to confirm that your payment has been successfully processed. Thank you for choosing Eklabya for your learning journey!
    </p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #667eea; margin-top: 0;">Payment Details:</h3>
      <p style="color: #333; margin: 5px 0;"><strong>Transaction ID:</strong> [TRANSACTION_ID]</p>
      <p style="color: #333; margin: 5px 0;"><strong>Amount:</strong> [AMOUNT]</p>
      <p style="color: #333; margin: 5px 0;"><strong>Date:</strong> [DATE]</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.eklabya.com/profile" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                display: inline-block;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
        View Your Courses
      </a>
    </div>
    
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      You can now access your enrolled courses and start learning immediately. If you have any questions or need assistance, please don't hesitate to contact our support team.
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">Best regards,</p>
      <p style="margin: 5px 0 0 0; font-weight: bold;">The Eklabya Team</p>
      <p style="margin: 5px 0 0 0;">www.eklabya.com</p>
    </div>
  </div>
</body>
</html>`,
    },
  };

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = emailTemplates[templateKey];
    setSubject(template.subject);
    setBody(template.body);
    setPlainTextBody(""); // Clear plain text when using HTML template
    setIsHtmlMode(true); // Templates are HTML, so switch to HTML mode
  };

  const handleFormatChange = (isHtml) => {
    setIsHtmlMode(isHtml);
    // Clear the field that's not being used to avoid confusion
    if (isHtml) {
      setPlainTextBody("");
    } else {
      setBody("");
    }
  };

  useEffect(() => {
    fetchEmailHistory();
  }, [page]);

  const fetchEmailHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await api.get(`/email/history?page=${page}&limit=10`);
      setEmailHistory(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error("Failed to fetch email history:", error);
      toast.error("Failed to load email history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB limit
    );

    if (validFiles.length !== files.length) {
      toast.error("Some files were too large (max 10MB)");
    }

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!recipients || !subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    const currentBody = isHtmlMode ? body : plainTextBody;

    if (!currentBody) {
      toast.error(
        `Please fill in the ${isHtmlMode ? "HTML" : "plain text"} body`,
      );
      return;
    }

    // For plain text, ensure line breaks are preserved (convert \n to \r\n for email standards)
    const formattedBody = isHtmlMode
      ? body
      : plainTextBody.replace(/\n/g, "\r\n");

    const formData = new FormData();
    formData.append("recipients", recipients);
    formData.append("subject", subject);
    formData.append("body", formattedBody);
    formData.append("isHtml", isHtmlMode);

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    try {
      setIsSending(true);
      await api.post("/email/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Email sent successfully!");
      setRecipients("");
      setSubject("");
      setBody("");
      setPlainTextBody("");
      setAttachments([]);
      setIsHtmlMode(false);

      // Refresh email history
      fetchEmailHistory();
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to send email. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleViewEmail = async (id) => {
    try {
      const response = await api.get(`/email/history/${id}`);
      setViewEmail(response.data.data);
    } catch (error) {
      console.error("Failed to fetch email details:", error);
      toast.error("Failed to load email details");
    }
  };

  const handleDeleteEmail = async (id) => {
    if (!window.confirm("Are you sure you want to delete this email record?")) {
      return;
    }

    try {
      await api.delete(`/email/history/${id}`);
      toast.success("Email record deleted successfully");
      fetchEmailHistory();
    } catch (error) {
      console.error("Failed to delete email:", error);
      toast.error("Failed to delete email record");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="w-3 h-3 mr-1" />
            Sent
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiXCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Custom Email Sender
          </h1>
          <p className="text-gray-600 mt-1">
            Send custom emails with attachments to multiple recipients
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Composer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Compose Email
            </h2>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(emailTemplates).map(([key, template]) => (
                    <option key={key} value={key}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a template to pre-fill the email content (all templates
                  are editable)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients *
                </label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body Format *
                </label>
                <div className="flex space-x-4 mb-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="emailFormat"
                      checked={!isHtmlMode}
                      onChange={() => handleFormatChange(false)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Plain Text</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="emailFormat"
                      checked={isHtmlMode}
                      onChange={() => handleFormatChange(true)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">HTML</span>
                  </label>
                </div>

                {isHtmlMode ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body (HTML supported) *
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Write your HTML email content here..."
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use HTML tags for formatting. This will be sent as HTML
                      email.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body (Plain Text) *
                    </label>
                    <textarea
                      value={plainTextBody}
                      onChange={(e) => setPlainTextBody(e.target.value)}
                      placeholder="Write your email content here..."
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Plain text format. No HTML tags will be processed. This is
                      the default format.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments (Max 10MB each, Max 5 files)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <FiPaperclip className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF, DOC, DOCX, XLS, XLSX up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Files:
                  </p>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <FiPaperclip className="text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend className="mr-2" />
                    Send Email
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Email History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Email History
              </h2>
              <button
                onClick={fetchEmailHistory}
                className="text-indigo-600 hover:text-indigo-700"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-8">
                <FiRefreshCw className="animate-spin mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-gray-500">Loading...</p>
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="text-center py-8">
                <FiMail className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-gray-500">No email history yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {emailHistory.map((email) => (
                  <div
                    key={email._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {email.subject}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          To: {email.recipients.join(", ")}
                        </p>
                      </div>
                      {getStatusBadge(email.status)}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {format(
                          new Date(email.createdAt),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewEmail(email._id)}
                          className="text-indigo-600 hover:text-indigo-700"
                          title="View details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmail(email._id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <button
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Email Detail Modal */}
        {viewEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Email Details
                  </h3>
                  <button
                    onClick={() => setViewEmail(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <p className="mt-1 text-gray-900">{viewEmail.subject}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Recipients
                    </label>
                    <p className="mt-1 text-gray-900">
                      {viewEmail.recipients.join(", ")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <div className="mt-1">
                      {getStatusBadge(viewEmail.status)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sent At
                    </label>
                    <p className="mt-1 text-gray-900">
                      {viewEmail.sentAt
                        ? format(
                            new Date(viewEmail.sentAt),
                            "MMM dd, yyyy HH:mm:ss",
                          )
                        : "Not sent yet"}
                    </p>
                  </div>

                  {viewEmail.attachments &&
                    viewEmail.attachments.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Attachments
                        </label>
                        <div className="mt-2 space-y-2">
                          {viewEmail.attachments.map((att, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg"
                            >
                              <FiPaperclip className="text-gray-400" />
                              <span className="text-sm text-gray-700">
                                {att.originalName}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({(att.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Body
                    </label>
                    <div
                      className="mt-1 p-4 bg-gray-50 rounded-lg text-gray-900"
                      dangerouslySetInnerHTML={{ __html: viewEmail.body }}
                    />
                  </div>

                  {viewEmail.error && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Error
                      </label>
                      <p className="mt-1 text-red-600">{viewEmail.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomEmailSender;
