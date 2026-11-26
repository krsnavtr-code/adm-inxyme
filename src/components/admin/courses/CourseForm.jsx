import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  FileText,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  RefreshCw,
  Maximize2,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import NativeModalDialog from "../payments/NativeModalDialog";
import {
  createCourse,
  updateCourse,
  getCourseById,
  getCategoriesForForm,
  uploadCourseImage,
  deleteUploadedFile,
} from "../../../api/courseApi";
import userApi from "../../../api/userApi";

// Error boundary for the file upload component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in FileUploadInput:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-600 p-4 border border-red-300 bg-red-50 rounded">
          <p>Something went wrong with the file upload.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Separate component for file input to prevent re-renders and isolate errors
const FileUploadInput = ({ onFileSelect, thumbnail, onRemove }) => {
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size too large. Maximum size is 5MB.");
        return;
      }

      // Reset file input to allow re-uploading the same file
      e.target.value = "";

      const formData = new FormData();
      formData.append("image", file);

      const response = await uploadCourseImage(formData);

      if (!response || !response.success) {
        throw new Error(response?.message || "Upload failed");
      }

      // Make sure we're storing just the path part, not the full URL
      const imagePath = response.location;

      onFileSelect(imagePath);
      toast.success("Thumbnail uploaded successfully");
    } catch (error) {
      console.error("Error in file upload:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload thumbnail",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Create a safe thumbnail URL
  const getThumbnailUrl = (thumb) => {
    if (!thumb) return "";
    try {
      if (thumb.startsWith("http")) return thumb;
      // Ensure there's exactly one slash between domain and path
      const baseUrl = import.meta.env.VITE_API_URL;
      const path = thumb.startsWith("/") ? thumb : `/${thumb}`;
      return `${baseUrl}${path}`;
    } catch (error) {
      console.error("Error creating thumbnail URL:", error);
      return "";
    }
  };

  const thumbnailUrl = getThumbnailUrl(thumbnail);

  return (
    <div className="flex items-center space-x-6">
      {/* Thumbnail Preview */}
      <div className="flex-shrink-0">
        <div className="w-40 h-32 bg-gray-100 rounded-md overflow-hidden border border-gray-300 flex items-center justify-center">
          {thumbnail ? (
            <img
              key={thumbnail} // Force re-render when thumbnail changes
              src={thumbnailUrl}
              alt="Course thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("Error loading image:", e);
                console.error("Failed to load image at URL:", e.target.src);
                console.error("Current thumbnail value:", thumbnail);
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/400x225?text=Thumbnail+Not+Found";
              }}
              onLoad={(e) => {
                console.log("Image loaded successfully:", e.target.src);
              }}
            />
          ) : (
            <span className="text-gray-400 text-sm">No thumbnail</span>
          )}
        </div>
      </div>

      {/* Upload Controls */}
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <label
            className={`relative cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isUploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={(e) => {
              if (isUploading) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            {isUploading ? "Uploading..." : "Choose File"}
            <input
              type="file"
              className="sr-only"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
            />
          </label>
          {thumbnail && (
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Recommended size: 800x450px (16:9 aspect ratio)
        </p>
      </div>
    </div>
  );
};

const getServerOrigins = () => {
  const rawApiBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  const rawSiteBase = String(import.meta.env.VITE_API_URL || "").trim();

  const normalizeOrigin = (val) =>
    val
      .replace(/\/api\/?$/i, "")
      .replace(/^http:\/\/(?:www\.)?inxyme\.com/i, "https://www.inxyme.com")
      .replace(/^https:\/\/inxyme\.com/i, "https://www.inxyme.com")
      .replace(/\/+$/, "");

  const origin =
    (rawSiteBase && normalizeOrigin(rawSiteBase)) ||
    (rawApiBase && normalizeOrigin(rawApiBase)) ||
    window.location.origin;

  const apiBase = rawApiBase
    ? rawApiBase
        .replace(/^http:\/\/(?:www\.)?inxyme\.com/i, "https://www.inxyme.com")
        .replace(/^https:\/\/inxyme\.com/i, "https://www.inxyme.com")
        .replace(/\/+$/, "")
    : `${origin}/api`;

  return { origin, apiBase };
};

const getBrochureUrlCandidates = (url, courseId = "") => {
  if (!url) return [];
  const trimmed = String(url).trim();
  if (!trimmed) return [];

  try {
    if (/^(blob:|data:)/i.test(trimmed)) {
      return [trimmed];
    }

    const { origin, apiBase } = getServerOrigins();
    const candidates = [];
    const addUnique = (candidate) => {
      if (candidate && !candidates.includes(candidate)) {
        candidates.push(candidate);
      }
    };

    const normalizeInxymeUrl = (val) =>
      val
        .replace(/^http:\/\/(?:www\.)?inxyme\.com/i, "https://www.inxyme.com")
        .replace(/^https:\/\/inxyme\.com/i, "https://www.inxyme.com");

    // Extract /uploads/<filename> whether stored as relative path or full URL,
    // because Next.js serves non-/api routes and returns 404 for /uploads/*.
    const uploadsMatch = trimmed.match(/^(?:https?:\/\/[^/]+)?\/?uploads\/([^?#]+)$/i);
    if (uploadsMatch && uploadsMatch[1]) {
      const uploadFile = uploadsMatch[1].replace(/^\/+/, "");
      const fileSegment = uploadFile.split("/").filter(Boolean).pop();
      if (fileSegment) {
        addUnique(`${apiBase}/upload/file/${encodeURIComponent(decodeURIComponent(fileSegment))}`);
      }
    } else if (/^https?:\/\//i.test(trimmed)) {
      addUnique(normalizeInxymeUrl(trimmed));
    } else {
      const normalizedPath = `/${trimmed.replace(/^\/+/, "")}`;
      if (normalizedPath.startsWith("/api/")) {
        addUnique(`${origin}${normalizedPath}`);
      } else if (courseId) {
        addUnique(`${apiBase}/courses/${encodeURIComponent(courseId)}/download-brochure`);
      }
      addUnique(`${origin}${normalizedPath}`);
    }

    if (courseId) {
      addUnique(`${apiBase}/courses/${encodeURIComponent(courseId)}/download-brochure`);
    }

    return candidates;
  } catch (error) {
    console.error("Error creating brochure URL:", error);
    return [];
  }
};

const resolveBrochureUrl = (url, courseId = "") =>
  getBrochureUrlCandidates(url, courseId)[0] || "";

const getPdfFileParts = (url, fallbackName = "course-brochure.pdf") => {
  const clean = String(url || "").split(/[?#]/)[0];
  const rawSegment = clean.split("/").filter(Boolean).pop() || "";
  let fileName = fallbackName;
  if (rawSegment) {
    try {
      fileName = decodeURIComponent(rawSegment);
    } catch {
      fileName = rawSegment;
    }
  }
  const match = fileName.match(/^(.*?)(\.[^./]+)$/);
  return {
    fileName,
    baseName: match && match[1] ? match[1] : fileName,
    extension: match && match[1] ? match[2] : "",
  };
};

const formatPdfFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const PdfPreviewViewport = ({
  loading,
  error,
  previewSrc,
  fullBrochureUrl,
  fileName,
  heightClass = "h-[520px]",
  onRetry,
}) => {
  if (loading) {
    return (
      <div className={`${heightClass} flex flex-col items-center justify-center gap-2 text-gray-500 bg-white`}>
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-hidden="true" />
        <span className="text-xs font-medium">Loading brochure PDF preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${heightClass} flex flex-col items-center justify-center p-6 text-center gap-3 bg-white`}>
        <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
        <p className="text-xs text-red-700 max-w-md">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry Preview
          </button>
          {fullBrochureUrl && (
            <a
              href={fullBrochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open PDF in New Tab
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!previewSrc) return null;

  return (
    <iframe
      key={previewSrc}
      src={`${previewSrc}#navpanes=0&view=FitH`}
      title={`Course brochure preview: ${fileName}`}
      className={`w-full ${heightClass} border-0 bg-white`}
    />
  );
};

// Component for PDF brochure upload & live inline preview
const BrochureUploadInput = ({ onFileSelect, brochureUrl, courseId = "", onRemove }) => {
  const inputId = useId();
  const expandTitleId = useId();

  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewBlobUrl, setPreviewBlobUrl] = useState("");
  const [pdfSize, setPdfSize] = useState(0);

  const remoteBlobUrlRef = useRef("");
  const localUploadedRef = useRef({ path: "", blobUrl: "", size: 0 });
  const abortControllerRef = useRef(null);

  const brochureUrlCandidates = getBrochureUrlCandidates(brochureUrl, courseId);
  const fullBrochureUrl = brochureUrlCandidates[0] || "";
  const { fileName, baseName, extension } = getPdfFileParts(brochureUrl);
  const formattedSize = formatPdfFileSize(pdfSize);

  const revokeRemoteBlob = useCallback(() => {
    if (remoteBlobUrlRef.current) {
      URL.revokeObjectURL(remoteBlobUrlRef.current);
      remoteBlobUrlRef.current = "";
    }
  }, []);

  const revokeLocalBlob = useCallback(() => {
    if (localUploadedRef.current.blobUrl) {
      URL.revokeObjectURL(localUploadedRef.current.blobUrl);
      localUploadedRef.current = { path: "", blobUrl: "", size: 0 };
    }
  }, []);

  const loadPdfPreview = useCallback(
    async ({ forceRemote = false } = {}) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!brochureUrl || brochureUrlCandidates.length === 0) {
        revokeRemoteBlob();
        setPreviewBlobUrl("");
        setPreviewError("");
        setPdfSize(0);
        setLoadingPreview(false);
        return;
      }

      // Use instant local File object URL when freshly uploaded in this session
      if (
        !forceRemote &&
        localUploadedRef.current.path === brochureUrl &&
        localUploadedRef.current.blobUrl
      ) {
        revokeRemoteBlob();
        setPreviewBlobUrl(localUploadedRef.current.blobUrl);
        setPdfSize(localUploadedRef.current.size);
        setPreviewError("");
        setLoadingPreview(false);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoadingPreview(true);
      setPreviewError("");

      try {
        let loadedBlob = null;
        let lastErrorMessage = "Failed to load uploaded brochure PDF preview.";

        for (const candidateUrl of brochureUrlCandidates) {
          if (controller.signal.aborted) return;

          try {
            const res = await fetch(candidateUrl, {
              signal: controller.signal,
            });

            if (!res.ok) {
              lastErrorMessage = `Uploaded brochure could not be loaded (HTTP ${res.status}).`;
              continue;
            }

            const rawBlob = await res.blob();
            if (controller.signal.aborted) return;

            if (!rawBlob || rawBlob.size === 0) {
              lastErrorMessage = "Uploaded brochure PDF file appears to be empty.";
              continue;
            }

            const headerText = await rawBlob.slice(0, 64).text();
            if (controller.signal.aborted) return;

            if (
              rawBlob.type?.includes("text/html") ||
              (!headerText.includes("%PDF-") && !rawBlob.type?.includes("pdf"))
            ) {
              lastErrorMessage = "Brochure endpoint returned HTML/non-PDF content instead of a PDF.";
              continue;
            }

            loadedBlob =
              rawBlob.type === "application/pdf"
                ? rawBlob
                : new Blob([rawBlob], { type: "application/pdf" });
            break;
          } catch (candidateErr) {
            if (candidateErr?.name === "AbortError" || controller.signal.aborted) {
              return;
            }
            lastErrorMessage = candidateErr?.message || lastErrorMessage;
          }
        }

        if (!loadedBlob) {
          throw new Error(lastErrorMessage);
        }

        const nextObjectUrl = URL.createObjectURL(loadedBlob);
        revokeRemoteBlob();
        remoteBlobUrlRef.current = nextObjectUrl;

        setPreviewBlobUrl(nextObjectUrl);
        setPdfSize(loadedBlob.size);
      } catch (err) {
        if (err?.name === "AbortError" || controller.signal.aborted) return;

        console.error("Failed to load course brochure preview:", err);
        revokeRemoteBlob();
        setPreviewBlobUrl("");
        setPdfSize(0);
        setPreviewError(err?.message || "Failed to load uploaded brochure PDF preview.");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPreview(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [brochureUrl, courseId, revokeRemoteBlob],
  );

  useEffect(() => {
    if (brochureUrl) {
      setShowPreview(true);
    } else {
      setIsExpanded(false);
    }
    loadPdfPreview();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [brochureUrl, loadPdfPreview]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      revokeRemoteBlob();
      revokeLocalBlob();
    };
  }, [revokeRemoteBlob, revokeLocalBlob]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdfFile =
      file.type === "application/pdf" ||
      file.name?.toLowerCase().endsWith(".pdf");

    if (!isPdfFile) {
      toast.error("Only PDF files are allowed for brochures.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size too large. Maximum size is 10MB.");
      e.target.value = "";
      return;
    }

    e.target.value = "";

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("image", file);

      const response = await uploadCourseImage(formData);

      if (!response || !response.success) {
        throw new Error(response?.message || "Upload failed");
      }

      const filePath = response.location;
      revokeLocalBlob();
      const instantUrl = URL.createObjectURL(file);
      localUploadedRef.current = {
        path: filePath,
        blobUrl: instantUrl,
        size: file.size,
      };

      setPreviewBlobUrl(instantUrl);
      setPdfSize(file.size);
      setPreviewError("");
      setShowPreview(true);

      onFileSelect(filePath);
      toast.success("Brochure uploaded successfully");
    } catch (error) {
      console.error("Error in brochure upload:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload brochure",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!brochureUrl) return;

    try {
      setIsDeleting(true);

      await deleteUploadedFile(brochureUrl);

      revokeRemoteBlob();
      revokeLocalBlob();
      setPreviewBlobUrl("");
      setPreviewError("");
      setPdfSize(0);
      setIsExpanded(false);

      onRemove();
      toast.success("Brochure removed successfully");
    } catch (error) {
      console.error("Error deleting brochure:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete brochure",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const effectivePreviewSrc = previewBlobUrl;

  return (
    <div className="space-y-4">
      {/* Brochure Status & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
              brochureUrl
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-gray-200 bg-white text-gray-400"
            }`}
          >
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            {brochureUrl ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex min-w-0 items-baseline text-sm font-semibold text-gray-900"
                    title={fileName}
                  >
                    <span className="truncate">{baseName}</span>
                    {extension && <span className="shrink-0">{extension}</span>}
                  </span>
                  {formattedSize && (
                    <span className="shrink-0 rounded-full bg-gray-200/80 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                      {formattedSize}
                    </span>
                  )}
                </div>
                <p className="text-xs text-green-700 font-medium mt-0.5">
                  PDF uploaded &amp; attached to this course
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700">
                  No brochure PDF uploaded
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload course brochure (PDF only, max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload / Preview / Download / Remove Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label
            htmlFor={inputId}
            className={`inline-flex items-center gap-1.5 cursor-pointer bg-white py-2 px-3.5 border border-gray-300 rounded-md shadow-sm text-xs font-semibold text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-blue-500 ${
              isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {isUploading ? "Uploading..." : brochureUrl ? "Replace PDF" : "Choose PDF"}
            </span>
            <input
              id={inputId}
              type="file"
              className="sr-only"
              accept="application/pdf,.pdf"
              disabled={isUploading}
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
            />
          </label>

          {brochureUrl && (
            <>
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Preview PDF
                  </>
                )}
              </button>

              <a
                href={previewBlobUrl || fullBrochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Open
              </a>

              <a
                href={previewBlobUrl || fullBrochureUrl}
                download={fileName}
                target={previewBlobUrl ? undefined : "_blank"}
                rel={previewBlobUrl ? undefined : "noopener noreferrer"}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download
              </a>

              <button
                type="button"
                onClick={handleRemove}
                disabled={isDeleting}
                className={`inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 ${
                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Uploaded PDF Preview */}
      {brochureUrl && showPreview && (
        <div className="rounded-lg border border-gray-300 bg-white overflow-hidden shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-100 px-4 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold text-gray-800 shrink-0">
                Uploaded Brochure Preview
              </span>
              <span
                className="hidden sm:flex min-w-0 max-w-xs items-baseline rounded bg-white px-2 py-0.5 font-mono text-[11px] text-gray-600 border border-gray-200"
                title={fileName}
              >
                <span className="truncate">{baseName}</span>
                {extension && <span className="shrink-0">{extension}</span>}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadPdfPreview({ forceRemote: true })}
                disabled={loadingPreview}
                className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loadingPreview ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                disabled={!effectivePreviewSrc || Boolean(previewError)}
                className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                Full View
              </button>
            </div>
          </div>

          <PdfPreviewViewport
            loading={loadingPreview}
            error={previewError}
            previewSrc={effectivePreviewSrc}
            fullBrochureUrl={fullBrochureUrl}
            fileName={fileName}
            heightClass="h-[520px]"
            onRetry={() => loadPdfPreview({ forceRemote: true })}
          />
        </div>
      )}

      {/* Expanded Modal PDF Preview */}
      <NativeModalDialog
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        titleId={expandTitleId}
        closedBy="any"
        maxWidthClass="max-w-5xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-900 px-5 py-3.5 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="h-4 w-4 text-red-400 shrink-0" aria-hidden="true" />
            <h4
              id={expandTitleId}
              className="flex min-w-0 items-baseline text-sm font-bold text-white"
              title={fileName}
            >
              <span className="truncate">{baseName}</span>
              {extension && <span className="shrink-0">{extension}</span>}
            </h4>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(previewBlobUrl || fullBrochureUrl) && (
              <a
                href={previewBlobUrl || fullBrochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Open Tab
              </a>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close brochure preview modal"
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 overflow-hidden">
          <PdfPreviewViewport
            loading={loadingPreview}
            error={previewError}
            previewSrc={effectivePreviewSrc}
            fullBrochureUrl={fullBrochureUrl}
            fileName={fileName}
            heightClass="h-[78vh]"
            onRetry={() => loadPdfPreview({ forceRemote: true })}
          />
        </div>
      </NativeModalDialog>
    </div>
  );
};

// Component to handle each week in the curriculum
const WeekItem = ({
  week,
  weekIndex,
  removeWeek,
  register,
  control,
  errors,
}) => {
  const {
    fields: topicFields,
    append: appendTopic,
    remove: removeTopic,
  } = useFieldArray({
    control,
    name: `curriculum.${weekIndex}.topics`,
    keyName: "topicId", // Ensure we have a unique key for each topic
  });

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium">Module {weekIndex + 1}</h4>
        <button
          type="button"
          onClick={() => removeWeek(weekIndex)}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Remove Module
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Module Title *
          </label>
          <input
            type="text"
            {...register(`curriculum.${weekIndex}.title`, {
              required: "Module title is required",
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Introduction to React"
          />
          {errors.curriculum?.[weekIndex]?.title && (
            <p className="mt-1 text-sm text-red-600">
              {errors.curriculum[weekIndex].title.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (hours) *
          </label>
          <input
            type="number"
            {...register(`curriculum.${weekIndex}.duration`, {
              required: "Duration is required",
              min: { value: 1, message: "Minimum 1 hour" },
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 5"
          />
          {errors.curriculum?.[weekIndex]?.duration && (
            <p className="mt-1 text-sm text-red-600">
              {errors.curriculum[weekIndex].duration.message}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register(`curriculum.${weekIndex}.description`)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
          placeholder="What will students learn this week?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Topics / Lessons
        </label>
        <div className="space-y-2">
          {topicFields.map((topic, topicIndex) => (
            <div key={topic.topicId} className="flex items-center space-x-2">
              <input
                type="text"
                {...register(`curriculum.${weekIndex}.topics.${topicIndex}`, {
                  required: "Topic is required",
                })}
                className="flex-1 px-3 py-2 border border-gray-300 bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Topic ${topicIndex + 1}`}
              />
              <button
                type="button"
                onClick={() => removeTopic(topicIndex)}
                className="px-3 py-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendTopic("")}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Topic
          </button>
        </div>
      </div>
    </div>
  );
};

export const CourseForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [brochureFile, setBrochureFile] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
    getValues,
    trigger,
  } = useForm({
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      category: "",
      instructor: "",
      isFree: false,
      price: 0,
      originalPrice: 0,
      discount: 0,
      duration: "",
      totalHours: 0,
      level: "Beginner",
      language: "English",
      certificateIncluded: true,
      isFeatured: false,
      isPublished: false,
      showOnHome: false,
      status: "draft",
      image: "",
      thumbnail: "",
      previewVideo: "",
      brochureUrl: "",
      whatYouWillLearn: ["Learn valuable skills"],
      requirements: ["No special requirements"],
      whoIsThisFor: ["Anyone interested in learning"],
      prerequisites: ["No Requirements required"],
      tags: [],
      faqs: [],
      curriculum: [
        {
          week: 1,
          title: "Introduction",
          description: "",
          duration: "0 min",
          topics: ["Course introduction"],
        },
      ],
      customHeadings: {
        aboutCourse: "About This Course",
        aboutCourseInIndia: "About the course in India",
        whatYouWillLearn: "What You'll Learn",
        requirements: "Requirements",
        whoIsThisFor: "Who is this course for?",
        curriculum: "Full Curriculum",
        skills: "Skills Student Will Learn",
        topics: "Topics Student Will Learn",
        prerequisites: "Requirements",
        faq: "Frequently Asked Questions",
      },
      aboutCourseInIndia: "",
    },
  });

  // FAQ form array methods
  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: "faqs",
  });

  // Fetch course data in edit mode
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const categoriesData = await getCategoriesForForm();
        setCategories(categoriesData);

        // Fetch instructors
        const instructorsData = await userApi.getUsers({ role: "instructor" });
        setInstructors(instructorsData);

        // If in edit mode, fetch course data
        if (isEdit && id) {
          try {
            const response = await getCourseById(id);
            const courseData = response.data;

            // Helper function to ensure array fields have at least one empty string
            const ensureArray = (arr) =>
              Array.isArray(arr) && arr.length > 0 ? arr : [""];

            // Format the data to match form structure
            const formattedData = {
              ...courseData,
              // Map category (it might be an object with _id or just the ID)
              category: courseData.category?._id || courseData.category || "",
              // Ensure all arrays are properly initialized
              benefits: ensureArray(courseData.benefits),
              whatYouWillLearn: ensureArray(courseData.whatYouWillLearn),
              requirements: ensureArray(courseData.requirements),
              whoIsThisFor: ensureArray(courseData.whoIsThisFor),
              prerequisites: ensureArray(courseData.prerequisites),
              skills: ensureArray(courseData.skills),
              // Meta fields
              metaTitle: courseData.metaTitle || "",
              metaDescription: courseData.metaDescription || "",
              metaKeywords: courseData.metaKeywords || "",
              // Handle curriculum - ensure it has at least one week
              curriculum: courseData.curriculum?.length
                ? courseData.curriculum
                : [
                    {
                      week: 1,
                      title: "Introduction",
                      description: "",
                      duration: 0,
                      topics: [""],
                    },
                  ],
              // Handle other fields
              tags: courseData.tags || [],
              faqs: courseData.faqs || [],
              // Ensure boolean fields are properly set
              isFree: Boolean(courseData.isFree),
              isFeatured: Boolean(courseData.isFeatured),
              isPublished: Boolean(courseData.isPublished),
              showOnHome: Boolean(courseData.showOnHome),
              certificateIncluded: courseData.certificateIncluded !== false, // default to true if not set
              // Handle custom headings
              customHeadings: courseData.customHeadings || {
                aboutCourse: "About This Course",
                aboutCourseInIndia: "About the course in India",
                whatYouWillLearn: "What You'll Learn",
                requirements: "Requirements",
                whoIsThisFor: "Who is this course for?",
                curriculum: "Full Curriculum",
                skills: "Skills Student Will Learn",
                topics: "Topics Student Will Learn",
                prerequisites: "Requirements",
                faq: "Frequently Asked Questions",
              },
              // Handle about course in India content
              aboutCourseInIndia: courseData.aboutCourseInIndia || "",
            };

            reset(formattedData);

            // Log the form values after reset to verify
            const formValues = getValues();
          } catch (error) {
            console.error("Error loading course data:", error);
            toast.error("Failed to load course data. Please try again.");
          }
        }
      } catch (error) {
        console.error("Error loading form data:", error);
        toast.error("Failed to load form data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, isEdit, reset, getCategoriesForForm, userApi, getCourseById, toast]);

  // Field arrays for curriculum
  const {
    fields: curriculumFields,
    append: appendWeek,
    remove: removeWeek,
  } = useFieldArray({
    control,
    name: "curriculum",
    shouldUnregister: true,
  });

  const {
    fields: prerequisiteFields,
    append: appendPrerequisite,
    remove: removePrerequisite,
  } = useFieldArray({
    control,
    name: "prerequisites",
  });

  const {
    fields: learningsFields,
    append: appendLearning,
    remove: removeLearning,
  } = useFieldArray({
    control,
    name: "whatYouWillLearn",
  });

  const {
    fields: skillsFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: "skills",
  });

  // Handle image upload
  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await uploadCourseImage(formData);
      return { location: response.imageUrl };
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
      return { location: "" };
    }
  };

  // Form submission
  const onSubmit = async (formData) => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.title || formData.title.trim().length < 5) {
        throw new Error("Title must be at least 5 characters long");
      }

      if (!formData.description || formData.description.trim().length < 10) {
        throw new Error("Description must be at least 10 characters long");
      }

      if (!formData.category) {
        throw new Error("Please select a category");
      }

      if (!formData.instructor || formData.instructor.trim().length < 2) {
        throw new Error("Instructor name is required");
      }

      // Ensure price is always included and properly formatted
      const price = formData.isFree
        ? 0
        : Math.max(0, Number(formData.price) || 0);
      const originalPrice = formData.isFree
        ? 0
        : Math.max(0, Number(formData.originalPrice) || price);

      const dataToSend = {
        ...formData,
        // Ensure boolean fields are properly set
        isFree: Boolean(formData.isFree),
        isFeatured: Boolean(formData.isFeatured),
        isPublished: Boolean(formData.isPublished),
        certificateIncluded: formData.certificateIncluded !== false,

        // Ensure strings are properly trimmed
        title: formData.title?.toString().trim(),
        description: formData.description?.toString().trim(),
        instructor: formData.instructor?.toString().trim(),
        shortDescription: formData.shortDescription?.toString().trim() || "",

        // Meta fields for SEO
        metaTitle: formData.metaTitle?.toString().trim() || "",
        metaDescription: formData.metaDescription?.toString().trim() || "",
        metaKeywords: formData.metaKeywords?.toString().trim() || "",

        // Set price and originalPrice with proper formatting
        price: price,
        originalPrice: originalPrice,
        totalHours: Math.max(0, Number(formData.totalHours) || 0),

        // Include brochure URL
        brochureUrl: formData.brochureUrl || "",

        // Ensure arrays are properly formatted
        benefits: Array.isArray(formData.benefits)
          ? formData.benefits.filter((b) => b && b.toString().trim() !== "")
          : ["No specific benefits listed"],

        prerequisites: Array.isArray(formData.prerequisites)
          ? formData.prerequisites
              .filter((p) => p && p.toString().trim() !== "")
              .map((p) => p.toString().trim())
          : ["No Requirements required"],

        skills: Array.isArray(formData.skills)
          ? formData.skills
              .filter((s) => s && s.toString().trim() !== "")
              .map((s) => s.toString().trim())
          : [],

        whatYouWillLearn: Array.isArray(formData.whatYouWillLearn)
          ? formData.whatYouWillLearn
              .filter((w) => w && w.toString().trim() !== "")
              .map((w) => w.toString().trim())
          : ["Learn valuable skills"],

        requirements: Array.isArray(formData.requirements)
          ? formData.requirements
              .filter((r) => r && r.toString().trim() !== "")
              .map((r) => r.toString().trim())
          : ["No special requirements"],

        whoIsThisFor: Array.isArray(formData.whoIsThisFor)
          ? formData.whoIsThisFor
              .filter((w) => w && w.toString().trim() !== "")
              .map((w) => w.toString().trim())
          : ["Anyone interested in learning"],
        // Ensure curriculum is properly formatted
        curriculum: Array.isArray(formData.curriculum)
          ? formData.curriculum
              .filter((week) => week && (week.title || week.week))
              .map((week, index) => ({
                week: Number(week.week) || index + 1,
                title: week.title?.toString().trim() || `Week ${index + 1}`,
                description: week.description?.toString().trim() || "",
                duration: week.duration?.toString().trim() || "0 min",
                topics: Array.isArray(week.topics)
                  ? week.topics
                      .map((topic) => topic?.toString().trim())
                      .filter((topic) => topic && topic !== "")
                  : [],
              }))
          : [
              {
                week: 1,
                title: "Introduction",
                description: "",
                duration: "0 min",
                topics: ["Course introduction"],
              },
            ],
        level: ["Beginner", "Intermediate", "Advanced"].includes(formData.level)
          ? formData.level
          : "Beginner",
        language: formData.language?.toString().trim() || "English",
        duration: formData.duration?.toString().trim() || "0 min",

        // Include custom headings
        customHeadings: formData.customHeadings || {
          aboutCourse: "About This Course",
          aboutCourseInIndia: "About the course in India",
          whatYouWillLearn: "What You'll Learn",
          requirements: "Requirements",
          whoIsThisFor: "Who is this course for?",
          curriculum: "Full Curriculum",
          skills: "Skills Student Will Learn",
          topics: "Topics Student Will Learn",
          prerequisites: "Requirements",
          faq: "Frequently Asked Questions",
        },

        // Include about course in India content
        aboutCourseInIndia:
          formData.aboutCourseInIndia?.toString().trim() || "",
      };

      if (isEdit) {
        await updateCourse(id, dataToSend);
        toast.success("Course updated successfully!");
      } else {
        await createCourse(dataToSend);
        toast.success("Course created successfully!");
      }
      navigate("/admin/courses");
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(error.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    // Your existing form JSX
    <div className="container mx-auto text-black px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "Edit Course" : "Create New Course"}
      </h1>
      {/* Your form fields here */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Title *
              </label>
              <input
                type="text"
                {...register("title", { required: "Title is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Complete Web Development Bootcamp"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                {...register("slug", { required: "Slug is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., web-development-bootcamp"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                {...register("category", { required: "Category is required" })}
                className="w-full px-3 py-2 bg-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {Array.isArray(categories) &&
                  categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor *
              </label>
              <select
                {...register("instructor", {
                  required: "Instructor is required",
                })}
                className="w-full px-3 py-2 bg-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an instructor</option>
                {Array.isArray(instructors) &&
                  instructors.map((instructor, index) => (
                    <option key={index} value={instructor._id}>
                      {instructor.fullname || instructor.name}
                    </option>
                  ))}
              </select>
              {errors.instructor && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.instructor.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description *
            </label>
            <textarea
              {...register("shortDescription", {
                required: "Short description is required",
                maxLength: {
                  value: 300,
                  message: "Maximum 300 characters",
                },
              })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-300 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="A brief summary of the course (max 300 characters)"
            />
            {errors.shortDescription && (
              <p className="mt-1 text-sm text-red-600">
                {errors.shortDescription.message}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Description *
            </label>
            <div className="prose max-w-none">
              <Controller
                name="description"
                control={control}
                rules={{ required: "Description is required" }}
                render={({ field: { onChange, value } }) => (
                  <ReactQuill
                    theme="snow"
                    value={value || ""}
                    onChange={(content) => {
                      onChange(content);
                      // Trigger validation when content changes
                      trigger("description");
                    }}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link", "image"],
                        ["clean"],
                      ],
                    }}
                    formats={[
                      "header",
                      "bold",
                      "italic",
                      "underline",
                      "strike",
                      "list",
                      "bullet",
                      "link",
                      "image",
                    ]}
                    placeholder="Enter course description..."
                    className="bg-white rounded-md [&_.ql-container]:min-h-[160px] [&_.ql-editor]:min-h-[160px]"
                  />
                )}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              About Course in India
            </label>
            <div className="prose max-w-none">
              <Controller
                name="aboutCourseInIndia"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <ReactQuill
                    theme="snow"
                    value={value || ""}
                    onChange={onChange}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link", "image"],
                        ["clean"],
                      ],
                    }}
                    formats={[
                      "header",
                      "bold",
                      "italic",
                      "underline",
                      "strike",
                      "list",
                      "bullet",
                      "link",
                      "image",
                    ]}
                    placeholder="Enter information about this course in India..."
                    className="bg-white rounded-md [&_.ql-container]:min-h-[160px] [&_.ql-editor]:min-h-[160px]"
                  />
                )}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Optional: Add specific information about this course in the Indian
              context
            </p>
          </div>
        </div>

        {/* SEO & Meta Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">SEO & Meta Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                {...register("metaTitle")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Complete Web Development Bootcamp - Learn from Scratch"
                maxLength={60}
              />
              <p className="mt-1 text-sm text-gray-500">
                Recommended: 50-60 characters for optimal SEO
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Keywords
              </label>
              <input
                type="text"
                {...register("metaKeywords")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., web development, javascript, react, html, css"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate keywords with commas
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meta Description
            </label>
            <textarea
              {...register("metaDescription", {
                maxLength: {
                  value: 160,
                  message: "Maximum 160 characters for optimal SEO",
                },
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
              placeholder="A compelling description for search engines (max 160 characters)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Recommended: 150-160 characters for optimal SEO
            </p>
            {errors.metaDescription && (
              <p className="mt-1 text-sm text-red-600">
                {errors.metaDescription.message}
              </p>
            )}
          </div>
        </div>

        {/* Custom Headings */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Custom Headings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Customize the section headings that appear on the course detail
            page. Leave blank to use default headings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About Course Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.aboutCourse")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="About This Course"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                About Course in India Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.aboutCourseInIndia")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="About the course in India"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What You'll Learn Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.whatYouWillLearn")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="What You'll Learn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.requirements")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Requirements"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who Is This For Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.whoIsThisFor")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Who is this course for?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Curriculum Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.curriculum")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Full Curriculum"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.skills")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Skills Student Will Learn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.topics")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Topics Student Will Learn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prerequisites Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.prerequisites")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Requirements"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FAQ Heading
              </label>
              <input
                type="text"
                {...register("customHeadings.faq")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="Frequently Asked Questions"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Duration */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Pricing & Duration</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 mr-2">
                  Price (INR) *
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFree"
                    {...register("isFree", {
                      onChange: (e) => {
                        if (e.target.checked) {
                          setValue("price", 0);
                        }
                      },
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isFree"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Free Course
                  </label>
                </div>
              </div>
              <input
                type="number"
                {...register("price", {
                  required: !watch("isFree") ? "Price is required" : false,
                  min: { value: 0, message: "Price cannot be negative" },
                  valueAsNumber: true,
                  validate: (value) => {
                    if (watch("isFree")) {
                      setValue("price", 0);
                      return true;
                    }
                    return true;
                  },
                })}
                disabled={watch("isFree")}
                className={`w-full px-3 py-2 border ${
                  watch("isFree")
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white"
                } border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder={watch("isFree") ? "Free" : "e.g., 2999"}
                value={watch("isFree") ? 0 : watch("price") || ""}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setValue("price", value, { shouldValidate: true });
                }}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Original Price (INR)
              </label>
              <input
                type="number"
                {...register("originalPrice", {
                  min: { value: 0, message: "Price cannot be negative" },
                })}
                disabled={watch("isFree")}
                className={`w-full px-3 py-2 border ${
                  watch("isFree")
                    ? "bg-gray-100 cursor-not-allowed"
                    : "bg-white"
                } border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder={watch("isFree") ? "N/A" : "e.g., 4999"}
              />
              {errors.originalPrice && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.originalPrice.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (weeks) *
              </label>
              <input
                type="number"
                {...register("duration", {
                  required: "Duration is required",
                  min: { value: 1, message: "Minimum 1 week" },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 12"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Hours *
              </label>
              <input
                type="number"
                {...register("totalHours", {
                  required: "Total hours is required",
                  min: { value: 1, message: "Minimum 1 hour" },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 40"
              />
              {errors.totalHours && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.totalHours.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level *
              </label>
              <select
                {...register("level", { required: "Level is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none  bg-gray-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Beginner">Beginner</option>
                <option value="Advanced">Advanced</option>
              </select>
              {errors.level && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.level.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="certificateIncluded"
                  {...register("certificateIncluded")}
                  className="h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="certificateIncluded"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Certificate Included
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  {...register("isFeatured", { value: false })}
                  defaultChecked={watch("isFeatured")}
                  className="h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isFeatured"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Featured Course
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  {...register("isPublished")}
                  className="h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isPublished"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Publish Now
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showOnHome"
                  {...register("showOnHome")}
                  className="h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="showOnHome"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Show on Home
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            What Students Will Learn
          </h3>

          {learningsFields.map((field, index) => (
            <div key={field.id} className="flex items-start space-x-2 mb-2">
              <input
                type="text"
                {...register(`whatYouWillLearn.${index}`, {
                  required: "This field is required",
                })}
                className="flex-1 px-3 py-2 border border-gray-300 bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Learning point ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeLearning(index)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => appendLearning("")}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Learning Point
          </button>
        </div>

        {/* Requirements */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Requirements</h3>

          {prerequisiteFields.map((field, index) => (
            <div key={field.id} className="flex items-start space-x-2 mb-2">
              <input
                type="text"
                {...register(`prerequisites.${index}`)}
                className="flex-1 px-3 py-2 border border-gray-300 bg-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Prerequisite ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removePrerequisite(index)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => appendPrerequisite("")}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Prerequisite
          </button>
        </div>

        {/* Skills Covered */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Skills Covered</h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {skillsFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <span>{watch(`skills.${index}`)}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex">
            <input
              type="text"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = e.target.value.trim();
                  if (value) {
                    appendSkill(value);
                    e.target.value = "";
                  }
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 bg-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a skill and press Enter"
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.target.previousElementSibling;
                const value = input.value.trim();
                if (value) {
                  appendSkill(value);
                  input.value = "";
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
        </div>

        {/* Curriculum */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Course Curriculum</h3>
            <button
              type="button"
              onClick={() =>
                appendWeek({
                  week: curriculumFields.length + 1,
                  title: "",
                  description: "",
                  topics: [""],
                  duration: 0,
                })
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              + Add Module
            </button>
          </div>

          {curriculumFields.map((week, weekIndex) => (
            <WeekItem
              key={week.id}
              week={week}
              weekIndex={weekIndex}
              removeWeek={removeWeek}
              register={register}
              control={control}
              errors={errors}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Frequently Asked Questions
            </h3>
            <button
              type="button"
              onClick={() => appendFaq({ question: "", answer: "" })}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add FAQ
            </button>
          </div>

          <div className="space-y-4">
            {faqFields.map((faq, index) => (
              <div
                key={faq.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">FAQ {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register(`faqs.${index}.question`, {
                        required: "Question is required",
                      })}
                      className="w-full px-3 py-2 border border-gray-300 bg-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter question"
                    />
                    {errors.faqs?.[index]?.question && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.faqs[index].question.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register(`faqs.${index}.answer`, {
                        required: "Answer is required",
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter answer"
                    />
                    {errors.faqs?.[index]?.answer && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.faqs[index].answer.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {faqFields.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500">No FAQs added yet.</p>
                <button
                  type="button"
                  onClick={() => appendFaq({ question: "", answer: "" })}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add your first FAQ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail URL */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Course Thumbnail</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="url"
                {...register("thumbnail")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the URL of the course thumbnail image
              </p>
            </div>
            {watch("thumbnail") && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Preview:
                </p>
                <div className="w-64 h-36 border border-gray-300 rounded-md overflow-hidden">
                  <img
                    src={watch("thumbnail")}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/400x225?text=Thumbnail+Not+Found";
                    }}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preview Video URL
              </label>
              <input
                type="url"
                {...register("previewVideo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.youtube.com/watch?v=example"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the URL of the course preview video (YouTube, Vimeo, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Course Brochure */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Course Brochure</h3>
          <ErrorBoundary>
            <BrochureUploadInput
              courseId={isEdit ? id : ""}
              onFileSelect={(url) => {
                setBrochureFile(url);
                setValue("brochureUrl", url, { shouldDirty: true });
              }}
              brochureUrl={watch("brochureUrl")}
              onRemove={() => {
                setBrochureFile("");
                setValue("brochureUrl", "", { shouldDirty: true });
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/admin/courses")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : isEdit ? "Update Course" : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
