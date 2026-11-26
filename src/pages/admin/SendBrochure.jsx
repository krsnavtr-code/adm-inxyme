import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import {
  FiSend,
  FiFileText,
  FiMail,
  FiType,
  FiMessageSquare,
  FiUpload,
  FiFilePlus,
  FiList,
  FiUser,
  FiBook,
  FiVideo,
  FiX,
  FiPlus,
  FiCheck,
  FiAlertCircle,
  FiExternalLink,
} from "react-icons/fi";

const normalizeBrochureAttachmentPath = (url) => {
  if (!url) return "";
  let clean = String(url).trim().split(/[?#]/)[0];
  if (/^https?:\/\//i.test(clean)) {
    try {
      clean = new URL(clean).pathname;
    } catch {
      return "";
    }
  }
  const apiUploadMatch = clean.match(/^\/?api\/upload\/file\/([^/?#]+)$/i);
  if (apiUploadMatch && apiUploadMatch[1]) {
    try {
      return `/uploads/${decodeURIComponent(apiUploadMatch[1])}`;
    } catch {
      return `/uploads/${apiUploadMatch[1]}`;
    }
  }
  return clean.startsWith("/") ? clean : `/${clean}`;
};

const buildCourseBrochureViewUrl = (url, courseId) => {
  if (!url) return "";
  const rawApiBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  const rawSiteBase = String(import.meta.env.VITE_API_URL || "").trim();
  const origin =
    (rawSiteBase || rawApiBase.replace(/\/api\/?$/i, "") || window.location.origin).replace(
      /\/+$/,
      "",
    );
  const apiBase = (rawApiBase || `${origin}/api`).replace(/\/+$/, "");

  const cleanPath = normalizeBrochureAttachmentPath(url);
  const uploadsMatch = cleanPath.match(/^\/uploads\/(.+)$/i);
  if (uploadsMatch && uploadsMatch[1]) {
    const fileSegment = uploadsMatch[1].split("/").filter(Boolean).pop();
    if (fileSegment) {
      return `${apiBase}/upload/file/${encodeURIComponent(fileSegment)}`;
    }
  }
  if (courseId) {
    return `${apiBase}/courses/${encodeURIComponent(courseId)}/download-brochure`;
  }
  return `${origin}${cleanPath}`;
};

const escapeEmailHtml = (val) =>
  String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeSafeHttpUrl = (val) => {
  const trimmed = String(val || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : "";
};

const sanitizeEmailHtmlFragment = (html) => {
  if (!html) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(String(html), "text/html");
    doc
      .querySelectorAll("script, iframe, object, embed, link, meta, base")
      .forEach((el) => el.remove());

    doc.body.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
        } else if (
          (name === "href" || name === "src" || name === "xlink:href") &&
          /^\s*javascript:/i.test(value)
        ) {
          el.removeAttribute(attr.name);
        }
      }
    });

    return doc.body.innerHTML;
  } catch {
    return escapeEmailHtml(html);
  }
};

const formatEmailBodyHtml = (rawMessage) => {
  const sanitized = sanitizeEmailHtmlFragment(rawMessage || "");
  if (!sanitized) return "";

  const hasBlockTags = /<(p|div|ul|ol|li|h[1-6]|table|br)\b/i.test(sanitized);
  const withLineBreaks = hasLineBreaksHandled(sanitized, hasBlockTags);

  return withLineBreaks
    .replace(
      /<p>/g,
      '<p style="margin: 0 0 10px 0; line-height: 1.65; font-size: 14px; color: #1f2937;">',
    )
    .replace(
      /<ul>/g,
      '<ul style="margin: 8px 0 14px 20px; padding: 0; font-size: 14px; color: #1f2937;">',
    )
    .replace(
      /<ol>/g,
      '<ol style="margin: 8px 0 14px 20px; padding: 0; font-size: 14px; color: #1f2937;">',
    )
    .replace(
      /<li>/g,
      '<li style="margin-bottom: 6px; line-height: 1.55;">',
    )
    .replace(
      /<h2>/g,
      '<h2 style="font-size: 17px; font-weight: 700; margin: 16px 0 8px 0; color: #111827;">',
    )
    .replace(
      /<h3>/g,
      '<h3 style="font-size: 15px; font-weight: 700; margin: 14px 0 6px 0; color: #1e3a8a;">',
    );
};

function hasLineBreaksHandled(html, hasBlockTags) {
  if (!hasBlockTags) {
    return html.replace(/\r?\n/g, "<br />");
  }
  return html.replace(/>\s*\r?\n\s*</g, "><");
}

const buildBrandedBrochureEmailHtml = ({
  bodyHtml,
  courseName = "",
  videoUrl = "",
  attachmentNames = [],
  logoSrc = "https://www.inxyme.com/images/inxyme-logo.png",
}) => {
  const formattedBody =
    formatEmailBodyHtml(bodyHtml) ||
    '<p style="margin:0 0 10px 0;line-height:1.65;font-size:14px;color:#1f2937;">Please find attached the official Inxyme course brochure.</p>';
  const cleanCourse = String(courseName || "").trim();
  const safeVideoUrl = normalizeSafeHttpUrl(videoUrl);
  const attachmentLabel =
    attachmentNames.length > 0
      ? attachmentNames.map((n) => escapeEmailHtml(n)).join(", ")
      : "Official Course Brochure PDF";

  return `<div style="margin:0;padding:20px 12px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111827;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 18px rgba(15,23,42,0.06);">
    <tr>
      <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:20px 26px;color:#ffffff;border-bottom:3px solid #f47c26;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
          <tr>
            <td style="vertical-align:middle;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#ffffff;border-radius:8px;padding:5px 9px;">
                    <img src="${escapeEmailHtml(logoSrc)}" alt="Inxyme" height="34" style="display:block;height:34px;width:auto;" />
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;">
                    <div style="font-size:18px;font-weight:800;letter-spacing:0.3px;color:#ffffff;">Inxyme</div>
                    <div style="font-size:12px;color:#bfdbfe;margin-top:2px;">Official Course Brochure &amp; Program Details</div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align:right;vertical-align:middle;">
              <span style="display:inline-block;padding:5px 11px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.06em;background-color:#eef2ff;color:#1e3a8a;border:1px solid #c7d2fe;">COURSE BROCHURE</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>${
      cleanCourse
        ? `<tr>
      <td style="background-color:#eef2ff;padding:12px 26px;border-bottom:1px solid #e0e7ff;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#4338ca;">Program Featured</div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;margin-top:2px;">${escapeEmailHtml(cleanCourse)}</div>
      </td>
    </tr>`
        : ""
    }<tr>
      <td style="padding:26px;">
        <div style="font-size:14px;line-height:1.65;color:#1f2937;">${formattedBody}</div>
        <div style="margin-top:20px;background-color:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #4f46e5;border-radius:8px;padding:12px 16px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#4338ca;margin-bottom:3px;">Attached Brochure Document</div>
          <div style="font-size:13px;font-weight:600;color:#0f172a;">&#128206; ${attachmentLabel}</div>
        </div>
        <div style="margin-top:22px;text-align:center;">
          <a href="https://www.inxyme.com/courses" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-size:13px;font-weight:700;padding:11px 22px;border-radius:8px;text-decoration:none;margin:4px;">Explore Courses on Inxyme</a>${
            safeVideoUrl
              ? `<a href="${escapeEmailHtml(safeVideoUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#f47c26;color:#ffffff;font-size:13px;font-weight:700;padding:11px 22px;border-radius:8px;text-decoration:none;margin:4px;">Watch Demo Video</a>`
              : ""
          }
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color:#f8fafc;padding:16px 26px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;">
        <div style="margin-top:4px;">Support: <a href="mailto:info@inxyme.com" style="color:#4f46e5;text-decoration:none;">info@inxyme.com</a> &bull; +91 9891030303 &bull; <a href="https://www.inxyme.com" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;text-decoration:none;">www.inxyme.com</a></div>
      </td>
    </tr>
  </table>
</div>`;
};

const SendBrochure = () => {
  const [pdfs, setPdfs] = useState({ generated: [], uploaded: [] });
  const [courseBrochures, setCourseBrochures] = useState([]);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [subject, setSubject] = useState("Course Brochure");
  const [message, setMessage] = useState("");
  const [useBrandedFrame, setUseBrandedFrame] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("generated");
  const [videos, setVideos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [videoSearchTerm, setVideoSearchTerm] = useState("");
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const lastAutoCourseMessageRef = useRef("");
  const lastAutoCourseSubjectRef = useRef("");
  const tabRefs = useRef({});
  const navigate = useNavigate();

  const BROCHURE_TABS = ["generated", "uploaded", "course"];

  const handleTabKeyDown = (e, currentIndex) => {
    let nextIndex = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % BROCHURE_TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + BROCHURE_TABS.length) % BROCHURE_TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = BROCHURE_TABS.length - 1;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = BROCHURE_TABS[nextIndex];
      setActiveTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  // Handle successful video upload
  const handleVideoUploadSuccess = (newVideo) => {
    setVideos((prevVideos) => [newVideo, ...prevVideos]);
    setSelectedVideos((prev) => [...prev, newVideo.path]);
  };

  // Video Upload Component
  const VideoUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [name, setName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
      const selectedFile = e.target.files[0];
      if (!selectedFile) return;

      // Check file type
      const allowedTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
        "video/webm",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error(
          "Invalid file type. Please select a valid video file (MP4, MOV, AVI, MKV, or WebM).",
        );
        return;
      }

      // Check file size (500MB limit)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (selectedFile.size > maxSize) {
        toast.error("File is too large. Maximum size is 500MB.");
        return;
      }

      setFile(selectedFile);
      if (!name) {
        // Set default name without extension
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setName(fileName);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!file) {
        toast.error("Please select a video file");
        return;
      }

      const formData = new FormData();
      formData.append("video", file);
      if (name) {
        formData.append("name", name);
      }

      try {
        setIsUploading(true);
        setProgress(0);

        const response = await api.post("/admin/videos", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setProgress(percentCompleted);
          },
        });

        toast.success("Video uploaded successfully");
        onUploadSuccess(response.data.data);
        onClose();
      } catch (error) {
        console.error("Error uploading video:", error);
        toast.error(error.response?.data?.message || "Failed to upload video");
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">Upload Video</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isUploading}
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video File
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                {file ? (
                  <div className="space-y-2">
                    <FiCheck className="mx-auto h-12 w-12 text-green-500" />
                    <p className="text-sm text-gray-600">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to select a video file
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported formats: MP4, MOV, AVI, MKV, WebM (max 500MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="video-name"
                className="block text-sm font-medium text-gray-700"
              >
                Video Name (optional)
              </label>
              <input
                type="text"
                id="video-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter a name for the video"
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className="pt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isUploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <FiUpload className="-ml-1 mr-2 h-4 w-4" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Fetch videos from the server
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await api.get("/admin/videos");
        setVideos(response.data);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, []);

  const handleVideoSelection = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setSelectedVideos(selectedOptions);
  };

  const filteredVideos = useMemo(() => {
    if (!videoSearchTerm.trim()) return videos;
    const term = videoSearchTerm.toLowerCase();
    return videos.filter(
      (video) =>
        video.name.toLowerCase().includes(term) ||
        video.path.toLowerCase().includes(term),
    );
  }, [videos, videoSearchTerm]);

  useEffect(() => {
    const fetchBrochuresAndCourses = async () => {
      try {
        setLoading(true);
        const [pdfsResult, coursesResult] = await Promise.allSettled([
          api.get("/pdfs"),
          api.get("/courses", {
            params: {
              all: "true",
              fields: "title,brochureUrl,slug,category,isPublished,updatedAt,createdAt",
            },
          }),
        ]);

        if (pdfsResult.status === "fulfilled") {
          const list = Array.isArray(pdfsResult.value?.data) ? pdfsResult.value.data : [];
          const generated = list.filter((pdf) => pdf.type === "generated");
          const uploaded = list.filter((pdf) => pdf.type === "uploaded");
          setPdfs({ generated, uploaded });
        } else {
          console.error("Error fetching PDFs:", pdfsResult.reason);
          toast.error("Failed to load PDFs. Please try again later.");
        }

        if (coursesResult.status === "fulfilled") {
          const rawCourses = coursesResult.value?.data;
          const courseList = Array.isArray(rawCourses)
            ? rawCourses
            : Array.isArray(rawCourses?.data)
            ? rawCourses.data
            : [];

          const mappedCourseBrochures = courseList
            .filter((course) => course?.brochureUrl && String(course.brochureUrl).trim() !== "")
            .map((course) => {
              const attachPath = normalizeBrochureAttachmentPath(course.brochureUrl);
              const fileName = attachPath.split("/").filter(Boolean).pop() || "brochure.pdf";
              return {
                id: course._id,
                courseTitle: course.title || "Untitled Course",
                categoryName: course.category?.name || "",
                isPublished: course.isPublished !== false,
                name: course.title || fileName,
                fileName,
                attachmentName: `${course.title || fileName}_Brochure.pdf`,
                path: attachPath,
                viewUrl: buildCourseBrochureViewUrl(course.brochureUrl, course._id),
                type: "course",
                size: 0,
                createdAt: course.updatedAt || course.createdAt || null,
              };
            })
            .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));

          setCourseBrochures(mappedCourseBrochures);
        } else {
          console.error("Error fetching course brochures:", coursesResult.reason);
          toast.error("Failed to load course brochures.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBrochuresAndCourses();
  }, []);

  const handlePdfSelection = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setSelectedPdfs(selectedOptions);
  };

  const handleCourseBrochureToggle = (item) => {
    const isAlreadySelected = selectedPdfs.includes(item.path);
    const nextSelected = isAlreadySelected
      ? selectedPdfs.filter((p) => p !== item.path)
      : [...selectedPdfs, item.path];

    setSelectedPdfs(nextSelected);

    if (!isAlreadySelected) {
      setCourseName(item.courseTitle);

      if (
        !subject ||
        subject === "Course Brochure" ||
        subject === lastAutoCourseSubjectRef.current
      ) {
        const nextSubject = `Course Brochure – ${item.courseTitle}`;
        lastAutoCourseSubjectRef.current = nextSubject;
        setSubject(nextSubject);
      }

      if (
        selectedTemplate === "custom" &&
        (!message.trim() ||
          message === lastAutoCourseMessageRef.current ||
          message.trim() === messageTemplates.custom.content.trim())
      ) {
        const template = messageTemplates.professionalBrochure;
        const resolvedMsg = renderTemplateText(template.content, {
          studentName,
          courseName: item.courseTitle,
          videoUrl,
        });
        const resolvedSubj = renderTemplateText(template.subject, {
          studentName,
          courseName: item.courseTitle,
          videoUrl,
        });
        lastAutoCourseMessageRef.current = resolvedMsg;
        lastAutoCourseSubjectRef.current = resolvedSubj;
        setSelectedTemplate("professionalBrochure");
        setUseBrandedFrame(true);
        setSubject(resolvedSubj);
        setMessage(resolvedMsg);
      }
    }
  };

  const filteredPdfs = useMemo(() => {
    const currentPdfs =
      activeTab === "generated"
        ? pdfs.generated
        : activeTab === "uploaded"
        ? pdfs.uploaded
        : courseBrochures;
    if (!searchTerm.trim()) return currentPdfs;

    const term = searchTerm.toLowerCase();
    return currentPdfs.filter(
      (pdf) =>
        (pdf.name || "").toLowerCase().includes(term) ||
        (pdf.courseTitle || "").toLowerCase().includes(term) ||
        (pdf.fileName || "").toLowerCase().includes(term) ||
        (pdf.categoryName || "").toLowerCase().includes(term) ||
        (pdf.path || "").toLowerCase().includes(term),
    );
  }, [activeTab, pdfs, courseBrochures, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedPdfs.length === 0 && selectedVideos.length === 0) {
      toast.error("Please select at least one PDF or video to send");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Get the selected video details
    const selectedVideoDetails = videos.filter((video) =>
      selectedVideos.includes(video.path),
    );

    try {
      setSending(true);

      // Get the selected PDF details
      const allPdfs = [...pdfs.generated, ...pdfs.uploaded, ...courseBrochures];
      const selectedPdfDetails = selectedPdfs
        .map((selectedPath) => allPdfs.find((pdf) => pdf.path === selectedPath))
        .filter(Boolean);

      const emailPayloadHtml = useBrandedFrame
        ? buildBrandedBrochureEmailHtml({
            bodyHtml: message.trim(),
            courseName: courseName.trim(),
            videoUrl: videoUrl.trim(),
            attachmentNames: selectedPdfDetails.map(
              (pdf) => pdf.attachmentName || pdf.fileName || pdf.name,
            ),
            logoSrc: "https://www.inxyme.com/images/inxyme-logo.png",
          })
        : message.trim();

      // Prepare request data with both PDFs and videos
      const requestData = {
        pdfPaths: selectedPdfs,
        videoPaths: selectedVideos,
        email: email.trim(),
        subject: subject.trim() || "Course Brochure",
        message: emailPayloadHtml,
        studentName: studentName.trim(),
        courseName: courseName.trim(),
        videoUrl: videoUrl.trim(),
        templateUsed: selectedTemplate,
        pdfDetails: selectedPdfDetails.map((pdf) => ({
          name: pdf.name,
          attachmentName: pdf.attachmentName || undefined,
          path: pdf.path,
          type: pdf.type,
          size: pdf.size,
        })),
        videoDetails: selectedVideoDetails.map((video) => ({
          name: video.name,
          path: video.path,
          type: "video",
          size: video.size,
        })),
      };

      // Send the request with both PDFs and videos
      const response = await api.post("/pdfs/send-brochure", requestData, {
        timeout: 60000 * (selectedPdfs.length + selectedVideos.length),
      });

      // Save email record to database
      if (response.data && response.data.success) {
        try {
          await api.post("/emails/save-email-record", {
            to: email.trim(),
            subject: subject.trim() || "Course Brochure",
            message: emailPayloadHtml,
            studentName: studentName.trim(),
            courseName: courseName.trim(),
            videoUrl: videoUrl.trim(),
            templateUsed: selectedTemplate,
            attachments: [
              ...selectedPdfDetails.map((pdf) => ({
                name: pdf.name,
                path: pdf.path,
                type: pdf.type || "pdf",
                size: pdf.size,
              })),
              ...selectedVideoDetails.map((video) => ({
                name: video.name,
                path: video.path,
                type: "video",
                size: video.size,
              })),
            ],
            sentAt: new Date().toISOString(),
            status: "sent",
          });
        } catch (dbError) {
          console.error("Error saving email record:", dbError);
          // Don't fail the entire operation if saving to DB fails
          toast.error(
            "Email sent but failed to save record. Please check console for details.",
          );
        }
      }

      toast.success("Brochure sent and record saved successfully!", {
        duration: 4000,
        icon: "🎉",
        style: {
          background: "#10B981",
          color: "#fff",
        },
      });

      // Reset form but keep the PDF and video selected for convenience
      setEmail("");
      setStudentName("");
      setCourseName("");
      setVideoUrl("");
      setSubject("");
      setMessage("");
      lastAutoCourseSubjectRef.current = "";
      lastAutoCourseMessageRef.current = "";
      setSelectedTemplate("custom");
      setUseBrandedFrame(false);
      setSelectedVideos([]);
      setVideoSearchTerm("");
    } catch (error) {
      console.error("Error sending brochure:", error);
      // Try to save failed attempt to database
      try {
        const allPdfs = [...pdfs.generated, ...pdfs.uploaded, ...courseBrochures];
        const selectedPdfDetails = selectedPdfs
          .map((selectedPath) => allPdfs.find((pdf) => pdf.path === selectedPath))
          .filter(Boolean);

        await api.post("/emails/save-email-record", {
          to: email.trim(),
          subject: subject.trim() || "Course Brochure",
          message: message.trim(),
          studentName: studentName.trim(),
          courseName: courseName.trim(),
          videoUrl: videoUrl.trim(),
          templateUsed: selectedTemplate,
          attachments: selectedPdfDetails.map((pdf) => ({
            name: pdf.name,
            path: pdf.path,
            type: pdf.type,
            size: pdf.size,
          })),
          sentAt: new Date().toISOString(),
          status: "failed",
          error: error.response?.data?.message || error.message,
        });
      } catch (dbError) {
        console.error("Error saving failed email record:", dbError);
      }

      toast.error(
        error.response?.data?.message ||
          "Failed to send mail. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  // Message templates for different scenarios
  const messageTemplates = useMemo(
    () => ({
      custom: {
        name: "Custom",
        subject: `Write Custom Email or Select The Email Template For send`,
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  Write Custom Email or Select The Email Template For send
</div>
      `,
      },
      professionalBrochure: {
        name: "Course Brochure (Professional)",
        subject: `{{courseName}} – Official Course Brochure & Program Details | Inxyme`,
        content: `<p>Dear <strong>{{studentName}}</strong>,</p><p>Warm greetings from <strong style="color:#4f46e5;">Inxyme</strong>.</p><p>Thank you for your interest in <strong>{{courseName}}</strong>. Please find attached our <strong>Official Course Brochure</strong> containing complete details about the curriculum, training methodology, and certification.</p><h3>Why Learn With Inxyme – {{courseName}}</h3><ul><li><strong>Live Interactive + Recorded Classes:</strong> Attend mentor-led live sessions with 24/7 access to session recordings.</li><li><strong>Certified Industry Practitioners:</strong> Learn practical workflows, real-world architecture, and industry best practices.</li><li><strong>Hands-On Projects &amp; Case Studies:</strong> Gain applied experience on live scenarios, assignments, and capstone projects.</li><li><strong>Practical Lab / Server Access:</strong> Dedicated practice environment for hands-on exercises and troubleshooting.</li><li><strong>Career Mentorship &amp; Placement Support:</strong> Dedicated resume review, mock interviews, and job-readiness guidance.</li><li><strong>Verified Inxyme Certification:</strong> Receive an official completion certificate upon finishing the program.</li></ul><h3>What Is Included in the Attached Brochure</h3><ul><li>Complete week-by-week &amp; module-wise syllabus breakdown</li><li>Tools, technologies, and job-ready skills you will master</li><li>Batch schedules (Weekday / Weekend options) and duration details</li><li>Eligibility, enrollment workflow, and scholarship / early-bird benefits</li></ul><p>We would be delighted to help you choose the right learning track. Simply reply to this email or connect with our <strong>Admissions &amp; Academic Advisory Team</strong> to book a <strong>free 1-on-1 counseling or live demo session</strong>.</p><p>Warm regards,<br/><strong style="color:#4f46e5;">Admissions &amp; Academic Advisory Team</strong><br/>Inxyme.</p>`,
      },
      courseEnquiry: {
        name: "Course Enquiry",
        subject: `About {{courseName}} - Inxyme`,
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p style="margin: 0 0 8px 0;">Dear {{studentName}},</p>

  <p style="margin: 0 0 8px 0;">
    Greetings from 
    <strong>
      <span style="color: #4f46e5;">Inxyme</span>
    </strong>
  </p> 

  <p style="margin: 0 0 8px 0;">
    Are you looking to build a strong career in the domain of 
    <strong>{{courseName}}</strong>?  
    We are excited to introduce our <strong>{{courseName}}</strong> online training program,  
    designed for both beginners and professionals.
  </p>

  <h3 style="margin: 12px 0 6px 0; color: #222; font-size: 16px;">
    🌟 Course Highlights – {{courseName}}
  </h3>
  <ul style="margin: 0 0 12px 18px; padding: 0;">
    <li style="margin-bottom: 4px;">✅ 100% Online | Live + Recorded Classes</li>
    <li style="margin-bottom: 4px;">✅ Taught by Certified Professionals</li>
    <li style="margin-bottom: 4px;">✅ Real-time Case Studies & Projects</li>
    <li style="margin-bottom: 4px;">✅ Access to Server for Practical Training</li>
    <li style="margin-bottom: 4px;">✅ Resume Building + Interview Preparation</li>
    <li style="margin-bottom: 4px;">✅ Certificate from Inxyme upon Completion</li>
  </ul>

  <h3 style="margin: 12px 0 6px 0; color: #222; font-size: 16px;">
    📅 Course Duration & Timings: 3 to 4 Months | Weekdays / Weekends Available
  </h3>

  <p style="margin: 0 0 8px 0;">💰 Special discounts available for early enrollment!</p>

  <p style="margin: 0 0 8px 0;">Looking forward to helping you take the next step in your career!</p>

  <p style="margin: 0 0 4px 0;">Warm regards,</p>
  <p style="margin: 0 0 4px 0;">
    Team – 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>
  </p>
  <p style="margin: 0 0 4px 0;">📩 info@inxyme.com</p>
  <p style="margin: 0;">
    🌐 
    <a href="https://www.inxyme.com" style="color: rgb(30, 144, 255); text-decoration: none;">
      www.inxyme.com
    </a>
  </p>
</div>
      `,
      },
      webinarInvite: {
        name: "Learning Approach Invitation",
        subject: `Take the Next Step in Your Career with Inxyme`,
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p style="margin: 0 0 8px 0;">Dear {{studentName}},</p>

  <p style="margin: 0 0 8px 0;">
    Greetings from 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>!
  </p>

  <p style="margin: 0 0 8px 0;">
    We are excited to invite you to explore our career-advancing online courses.
  </p>

  <p style="margin: 0 0 4px 0;">Warm regards,</p>
  <p style="margin: 0 0 4px 0;">
    Team – 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>
  </p>
  <p style="margin: 0 0 4px 0;">📩 info@inxyme.com</p>
  <p style="margin: 0;">
    🌐 
    <a href="https://www.inxyme.com" style="color: rgb(30, 144, 255); text-decoration: none;">
      www.inxyme.com
    </a>
  </p>
</div>
`,
      },
      videoSender: {
        name: "Video Sender",
        subject: `Take the Next Step in Your Career with Inxyme`,
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <p style="margin: 0 0 8px 0;">Dear {{studentName}},</p>

  <p style="margin: 0 0 8px 0;">
    Greetings from 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>!
  </p>

  <p style="margin: 0 0 8px 0;">
    We’re excited to invite you to enroll in one of our professional certification programs designed to help you enhance your skills and career growth.
  </p>

  <p style="margin: 0 0 8px 0;">
    At 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>, we offer a wide range of in-demand programs such as 
    <strong>Java</strong>, <strong>Python</strong>, <strong>AI & Machine Learning</strong>, 
    <strong>Cyber Security</strong>, <strong>Digital Marketing</strong>, <strong>SAP</strong>, 
    <strong>Power BI</strong>, <strong>Cloud Computing (Azure)</strong>, <strong>Salesforce</strong>, and more.
  </p>

  <p style="margin: 0 0 8px 0;">
    Each program is structured to provide hands-on learning with real-world applications — helping you gain the expertise needed to stand out in today’s competitive job market.
  </p>

  <p style="margin: 0 0 8px 0;">
    If you’re looking to upgrade your skills or switch to a high-growth career path, this is the perfect time to get started!
  </p>

  <p style="margin: 0 0 8px 0;">
    Please feel free to reply to this email or contact us directly for more details about the courses, duration, and fee structure.
  </p>

  <p style="margin: 0 0 8px 0;">
    Looking forward to helping you begin your learning journey with us.
  </p>

  <p style="margin: 0 0 8px 0;">
    <a href="{{videoUrl}}">Watch the demo video</a>
  </p>

  <p style="margin: 0 0 4px 0;">Warm regards,</p>
  <p style="margin: 0 0 4px 0;">
    Team – 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>
  </p>
  <p style="margin: 0 0 4px 0;">📩 info@inxyme.com</p>
  <p style="margin: 0;">🌐 <a href="https://www.inxyme.com" style="color: rgb(30, 144, 255); text-decoration: none;">www.inxyme.com</a></p>
</div>
`,
      },
      allCoursesProposal: {
        name: "All Courses Proposal",
        subject: `Proposal for Student Skill Development & Certification Programs – Inxyme`,
        content: `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
  <p style="margin: 0 0 8px 0;">
    Dear {{studentName}},
  </p>

  <p style="margin: 0 0 8px 0;">
    Warm greetings from 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>
  </p>

  <p style="margin: 0 0 8px 0;">
    We are pleased to introduce 
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>, a leading online learning platform focused on delivering high-quality certification programs designed to enhance students’ employability and industry readiness.
  </p>

  <p style="margin: 0 0 8px 0;">
    We would like to propose a collaboration (tie-up) with <strong>{{courseName}}</strong>, to offer a range of industry-relevant certification programs for your students. These programs are structured and delivered by our expert trainers who possess extensive experience in their respective domains.
  </p>

  <p style="margin: 8px 0;"><strong>Courses We Offer</strong></p>

  <ul style="margin: 0 0 8px 20px; padding: 0;">
    <li>Java Programming</li>
    <li>Python Programming</li>
    <li>SAP (Enterprise Management System)</li>
    <li>Artificial Intelligence & Machine Learning</li>
    <li>Cyber Security</li>
    <li>Database Management</li>
    <li>Digital Marketing</li>
    <li>Game Development</li>
    <li>Microsoft Azure (Cloud Computing)</li>
    <li>Salesforce (CRM Platform)</li>
    <li>Android App Development</li>
    <li>Power BI (Business Analytics)</li>
  </ul>

  <p style="margin: 0 0 8px 0;">
    Additionally, we also provide free value-added short courses to help students strengthen their profiles and gain an edge in their career journey.
  </p>

  <p style="margin: 8px 0;"><strong>Key Highlights of Our Programs</strong></p>

  <ul style="margin: 0 0 8px 20px; padding: 0;">
    <li>100% Online Learning (Live + Recorded Classes)</li>
    <li>Delivered by Industry Experts from Inxyme</li>
    <li>Practical, Project-Based Learning</li>
    <li>Certification from Inxyme</li>
    <li>Placement Guidance and Career Support</li>
    <li>Internship Assistance (where applicable)</li>
  </ul>

  <p style="margin: 8px 0;"><strong>Proposal for Tie-Up</strong></p>

  <p style="margin: 0 0 8px 0;">
    We are looking forward to forming a strategic academic partnership with your institution. Through this collaboration, students will gain access to our certified programs at special institutional pricing and benefit from joint skill enhancement initiatives like webinars, workshops, and hackathons.
  </p>

  <p style="margin: 0 0 8px 0;">
    We truly believe this partnership will help bridge the gap between academic learning and industry expectations, empowering your students with the skills needed to succeed in today’s competitive job market.
  </p>

  <p style="margin: 0 0 8px 0;">
    If this proposal aligns with your vision, we would be happy to schedule a meeting or presentation to discuss the details further.
  </p>

  <p style="margin: 0 0 8px 0;">Looking forward to your positive response and a fruitful collaboration.</p>

  <p style="margin: 0 0 4px 0;">Warm regards,</p>
  <p style="margin: 0 0 4px 0;">
    Team <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>
  </p>
  <p style="margin: 0 0 4px 0;">
    <span style="color: #4f46e5; font-weight: bold;">Inxyme</span>
  </p>
  <p style="margin: 0 0 4px 0;">📧 info@inxyme.com</p>
  <p style="margin: 0;">🌐 www.inxyme.com</p>
</div>
`,
      },
    }),
    [],
  );

  const [selectedTemplate, setSelectedTemplate] = useState("custom");

  const renderTemplateText = (rawText, vars) =>
    String(rawText || "")
      .replace(/\{\{studentName\}\}/g, (vars.studentName || "").trim() || "Learner")
      .replace(/\{\{courseName\}\}/g, (vars.courseName || "").trim() || "this program")
      .replace(/\{\{videoUrl\}\}/g, (vars.videoUrl || "").trim());

  // Update message when template or variables change
  useEffect(() => {
    if (selectedTemplate !== "custom") {
      const template = messageTemplates[selectedTemplate];
      if (!template) return;

      const updatedContent = renderTemplateText(template.content, {
        studentName,
        courseName,
        videoUrl,
      });
      const updatedSubject = renderTemplateText(template.subject, {
        studentName,
        courseName,
        videoUrl,
      });

      setMessage(updatedContent);

      // Only update subject if it hasn't been manually modified or is auto/empty
      if (
        subject === "" ||
        subject === "Course Brochure" ||
        subject.startsWith("About ") ||
        subject.startsWith("Following up") ||
        subject.startsWith("Course Brochure –") ||
        subject.includes("Official Course Brochure & Program Details")
      ) {
        setSubject(updatedSubject);
      }
    }
  }, [
    studentName,
    courseName,
    videoUrl,
    selectedTemplate,
    messageTemplates,
  ]);

  // Handle template change
  const handleTemplateChange = (e) => {
    const templateKey = e.target.value;
    setSelectedTemplate(templateKey);
    setUseBrandedFrame(templateKey === "professionalBrochure");

    // Apply immediately with current studentName/courseName variables
    if (templateKey !== "custom") {
      const template = messageTemplates[templateKey];
      setMessage(
        renderTemplateText(template.content, { studentName, courseName, videoUrl }),
      );
      setSubject(
        renderTemplateText(template.subject, { studentName, courseName, videoUrl }),
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const currentTabList =
    activeTab === "generated"
      ? pdfs.generated
      : activeTab === "uploaded"
      ? pdfs.uploaded
      : courseBrochures;
  const hasPdfs = currentTabList.length > 0;
  const totalPdfs =
    pdfs.generated.length + pdfs.uploaded.length + courseBrochures.length;
  const selectedCount = selectedPdfs.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FiSend className="mr-2 text-indigo-600" />
                  Send Mail To (Student, Colleges, University, etc)
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Select a brochure and send it via email to potential students
                  or clients.
                </p>
              </div>
              <div>
                <div className="mt-2 sm:mt-0 text-sm text-gray-500">
                  {totalPdfs} brochures available
                </div>
                <div className="mt-2 sm:mt-0 text-sm text-gray-500">
                  <Link
                    to="/admin/email-records"
                    className="flex items-center bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 transition-colors text-white"
                  >
                    <FiSend className="mr-2" /> Sended To
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div
              role="tablist"
              aria-label="Brochure categories"
              className="flex -mb-px overflow-x-auto"
            >
              <button
                ref={(el) => {
                  tabRefs.current.generated = el;
                }}
                id="tab-generated"
                type="button"
                role="tab"
                tabIndex={activeTab === "generated" ? 0 : -1}
                aria-selected={activeTab === "generated"}
                onClick={() => setActiveTab("generated")}
                onKeyDown={(e) => handleTabKeyDown(e, 0)}
                className={`relative flex-1 flex-none sm:flex-1 py-4 px-3 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "generated"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center">
                  <FiFileText className="mr-2 shrink-0" aria-hidden="true" />
                  <span>Generated Brochures</span>
                  {pdfs.generated.length > 0 && (
                    <span className="ml-2 bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {pdfs.generated.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                ref={(el) => {
                  tabRefs.current.uploaded = el;
                }}
                id="tab-uploaded"
                type="button"
                role="tab"
                tabIndex={activeTab === "uploaded" ? 0 : -1}
                aria-selected={activeTab === "uploaded"}
                onClick={() => setActiveTab("uploaded")}
                onKeyDown={(e) => handleTabKeyDown(e, 1)}
                className={`relative flex-1 flex-none sm:flex-1 py-4 px-3 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "uploaded"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center">
                  <FiUpload className="mr-2 shrink-0" aria-hidden="true" />
                  <span>Uploaded Brochures</span>
                  {pdfs.uploaded.length > 0 && (
                    <span className="ml-2 bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {pdfs.uploaded.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                ref={(el) => {
                  tabRefs.current.course = el;
                }}
                id="tab-course"
                type="button"
                role="tab"
                tabIndex={activeTab === "course" ? 0 : -1}
                aria-selected={activeTab === "course"}
                onClick={() => setActiveTab("course")}
                onKeyDown={(e) => handleTabKeyDown(e, 2)}
                className={`relative flex-1 flex-none sm:flex-1 py-4 px-3 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "course"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center">
                  <FiBook className="mr-2 shrink-0" aria-hidden="true" />
                  <span>Course Brochures</span>
                  {courseBrochures.length > 0 && (
                    <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {courseBrochures.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="p-6 space-y-6"
        >
          <div className="space-y-2">
            {activeTab === "course" ? (
              <span
                id="brochure-picker-label"
                className="block text-sm font-medium text-gray-700 flex items-center"
              >
                <FiBook className="mr-2" aria-hidden="true" />
                Select Course Brochure
              </span>
            ) : (
              <label
                htmlFor="pdf"
                className="block text-sm font-medium text-gray-700 flex items-center"
              >
                {activeTab === "generated" ? (
                  <FiFileText className="mr-2" aria-hidden="true" />
                ) : (
                  <FiUpload className="mr-2" aria-hidden="true" />
                )}
                {activeTab === "generated"
                  ? "Select Generated Brochure"
                  : "Select Uploaded Brochure"}
              </label>
            )}

            {/* Select Brochure */}
            <div className="space-y-4">
              {/* Search Box */}
              <div className="relative">
                <label htmlFor="course-brochure-search" className="sr-only">
                  Search brochures
                </label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="course-brochure-search"
                  type="search"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 text-black placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={
                    activeTab === "course"
                      ? "Search courses or brochure filenames..."
                      : "Search brochures..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="animate-pulse flex items-center space-x-4 p-4 bg-gray-50 rounded-md">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : hasPdfs ? (
                activeTab === "course" ? (
                  filteredPdfs.length > 0 ? (
                    <fieldset
                      aria-labelledby="brochure-picker-label"
                      className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-72 overflow-y-auto overscroll-contain bg-white"
                    >
                      <legend className="sr-only">Available course brochures</legend>
                      {filteredPdfs.map((item) => {
                        const isChecked = selectedPdfs.includes(item.path);
                        const checkboxId = `course-brochure-${item.id}`;
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors ${
                              isChecked ? "bg-indigo-50/80" : "hover:bg-gray-50"
                            }`}
                          >
                            <label
                              htmlFor={checkboxId}
                              className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                            >
                              <input
                                id={checkboxId}
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCourseBrochureToggle(item)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {item.courseTitle}
                                  </span>
                                  {item.categoryName && (
                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                                      {item.categoryName}
                                    </span>
                                  )}
                                  {!item.isPublished && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                                      Draft
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-mono text-gray-500 truncate mt-0.5">
                                  {item.fileName}
                                </p>
                              </div>
                            </label>
                            {item.viewUrl && (
                              <a
                                href={item.viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 shrink-0"
                              >
                                <FiExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                View
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </fieldset>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-500">
                        No course brochures match &ldquo;{searchTerm}&rdquo;.
                      </p>
                    </div>
                  )
                ) : (
                  <select
                    id="pdf"
                    multiple
                    size={Math.min(6, Math.max(3, filteredPdfs.length))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={selectedPdfs}
                    onChange={handlePdfSelection}
                    required
                  >
                    {filteredPdfs.map((pdf) => (
                      <option key={pdf.path} value={pdf.path}>
                        {pdf.name.replace(/_/g, " ").replace(/\.pdf$/i, "")} •{" "}
                        {formatFileSize(pdf.size)} •{" "}
                        {new Date(pdf.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                  <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    {activeTab === "course"
                      ? "No courses with uploaded brochures found."
                      : `No ${activeTab} brochures found.`}
                  </p>
                </div>
              )}

              {selectedCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
                  <span>
                    <strong>{selectedCount}</strong> brochure{selectedCount !== 1 ? "s" : ""} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPdfs([])}
                    className="font-semibold text-indigo-700 hover:text-indigo-900 underline"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>

            {/* Select Video */}
            <div className="mt-6 space-y-2">
              {/* Add Video */}
              <button
                type="button"
                onClick={() => setShowVideoUpload(true)}
                className="flex items-center justify-center w-full text-black p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <FiPlus className="mr-2" />
                Add Video
              </button>

              <label
                htmlFor="video"
                className="block text-sm font-medium text-gray-700 flex items-center"
              >
                <FiVideo className="mr-2" />
                Select Video (Optional)
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 text-black placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search videos..."
                    value={videoSearchTerm}
                    onChange={(e) => setVideoSearchTerm(e.target.value)}
                  />
                </div>

                {videos.length > 0 ? (
                  <select
                    id="video"
                    multiple
                    size={Math.min(3, Math.max(1, filteredVideos.length))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={selectedVideos}
                    onChange={handleVideoSelection}
                  >
                    {filteredVideos.map((video) => (
                      <option key={video.path} value={video.path}>
                        {video.name.replace(/\.(mp4|mov|avi|mkv)$/i, "")} •
                        {formatFileSize(video.size)} •
                        {new Date(video.uploadedAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                    <FiVideo className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-1 text-sm text-gray-500">
                      No videos found in the library.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {selectedVideos.length} video
                  {selectedVideos.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 flex items-center"
                  >
                    <FiMail className="mr-2" />
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    required
                  />
                </div>
                {(activeTab === "uploaded" ||
                  activeTab === "course" ||
                  selectedTemplate !== "custom") && (
                  <div className="space-y-2">
                    <label
                      htmlFor="studentName"
                      className="block text-sm font-medium text-gray-700 flex items-center"
                    >
                      <FiUser className="mr-2" />
                      Recipient Name {activeTab !== "uploaded" ? "(optional)" : ""}
                    </label>
                    <input
                      type="text"
                      id="studentName"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Pradeep Mishra / Manipal Placement Cell"
                      required={activeTab === "uploaded"}
                    />
                  </div>
                )}
              </div>

              {(activeTab === "uploaded" ||
                activeTab === "course" ||
                selectedTemplate !== "custom") && (
                <div className="space-y-2">
                  <label
                    htmlFor="courseName"
                    className="block text-sm font-medium text-gray-700 flex items-center"
                  >
                    <FiBook className="mr-2" />
                    Recipient (College / University / Organizations /
                    Consultancy / Course) Name
                  </label>
                  <input
                    type="text"
                    id="courseName"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Manipal University / Manipal College"
                  />
                </div>
              )}
              {(activeTab === "uploaded" || activeTab === "course") && (
                <div className="space-y-2">
                  <label
                    htmlFor="videoUrl"
                    className="block text-sm font-medium text-gray-700 flex items-center"
                  >
                    <FiVideo className="mr-2" />
                    Video URL
                  </label>
                  <input
                    type="text"
                    id="videoUrl"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="e.g., https://www.youtube.com/watch?v=VIDEO_ID"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-4 space-y-2">
                  <label
                    htmlFor="email-template-select"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Select Email Template
                  </label>
                  <select
                    id="email-template-select"
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                  >
                    {Object.entries(messageTemplates).map(([key, template]) => (
                      <option key={key} value={key}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-2 pt-1 text-xs font-medium text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useBrandedFrame}
                      onChange={(e) => setUseBrandedFrame(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      Include Branded Inxyme Email Layout (Header, Attachment Card &amp; Official Footer)
                    </span>
                  </label>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mail Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1 mt-5">
                  Mail Message
                </label>
                <div className="mb-2 text-xs text-red-600">
                  Use {"{{studentName}}"} and {"{{courseName}} "} and{" "}
                  {"(VideoUrl {{videoUrl}} only in Video Sender)"} as
                  placeholders that will be replaced with actual values.
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  You can edit the email content in the editor below
                </p>
                <div className="h-64 mb-4">
                  <ReactQuill
                    theme="snow"
                    value={message}
                    onChange={setMessage}
                    className="h-48 bg-white text-gray-700"
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link"],
                        ["clean"],
                      ],
                    }}
                    placeholder="Enter your message here..."
                  />
                </div>

                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Email Preview:
                  </h4>

                  <div className="border-t border-gray-200 pt-3">
                    <div
                      className="max-w-none text-sm bg-gray-50 p-4 rounded-md border border-gray-100 shadow-sm"
                      style={{
                        fontFamily: "Arial, sans-serif",
                        lineHeight: "1.6",
                        color: "#333",
                        fontSize: "14px",
                      }}
                    >
                      {message ? (
                        useBrandedFrame ? (
                          <div
                            className="email-preview rounded-md overflow-hidden"
                            dangerouslySetInnerHTML={{
                              __html: buildBrandedBrochureEmailHtml({
                                bodyHtml: message,
                                courseName,
                                videoUrl,
                                attachmentNames: selectedPdfs.map((selectedPath) => {
                                  const match = [
                                    ...pdfs.generated,
                                    ...pdfs.uploaded,
                                    ...courseBrochures,
                                  ].find((p) => p.path === selectedPath);
                                  return (
                                    match?.attachmentName ||
                                    match?.fileName ||
                                    match?.name ||
                                    selectedPath.split("/").pop()
                                  );
                                }),
                                logoSrc: "/inxyme-logo.png",
                              }),
                            }}
                          />
                        ) : (
                          <div
                            className="email-preview"
                            style={{
                              backgroundColor: "#fff",
                              padding: "16px",
                              borderRadius: "6px",
                              boxShadow: "0 0 6px rgba(0,0,0,0.05)",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: formatEmailBodyHtml(message),
                            }}
                          />
                        )
                      ) : (
                        <div className="text-gray-400 italic">
                          Your message will appear here...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={sending || loading}
              >
                {sending ? "Sending..." : "Send Brochure"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Video Upload Modal */}
      <VideoUploadModal
        isOpen={showVideoUpload}
        onClose={() => setShowVideoUpload(false)}
        onUploadSuccess={handleVideoUploadSuccess}
      />
    </div>
  );
};

export default SendBrochure;
