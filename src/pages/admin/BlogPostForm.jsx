import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Form, Input, Button, message, Card, Spin, Select } from "antd";
const { Option } = Select;
import { SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
} from "../../api/blogApi";

const { TextArea } = Input;

// 1. Fully Professional Quill Modules Configuration
// Ise component ke bahar rakhna zaroori hai taaki type karte time cursor focus lose na ho
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }], // Font sizes
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ color: [] }, { background: [] }], // Text Color & Background Color
    [{ script: "sub" }, { script: "super" }],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }], // Text Alignment
    ["link", "image", "video"], // Media options
    ["clean"], // Remove formatting
    ["code-block"],
  ],
  clipboard: {
    // Allows pasting formatting properly
    matchVisual: false,
  },
};

const quillFormats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "color",
  "background",
  "script",
  "list",
  "bullet",
  "indent",
  "align",
  "link",
  "image",
  "video",
  "code-block",
];

const BlogPostForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");

  // Fetch post data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode) {
        return;
      }

      try {
        setLoading(true);
        const response = await getBlogPostById(id);
        const post = response.data?.post || response.post;

        setContent(post.content);
        setFeaturedImage(post.featuredImage || "");

        form.setFieldsValue({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          status: post.status || "draft",
          tags: post.tags?.join(", ") || "",
          seo: {
            metaTitle: post.seo?.metaTitle || "",
            metaDescription: post.seo?.metaDescription || "",
            metaKeywords: post.seo?.metaKeywords || "",
          },
        });
      } catch (error) {
        console.error("Error fetching post:", error);
        message.error("Failed to load post data");
        navigate("/admin/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, form, navigate]);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      let slug = values.slug || generateSlug(values.title);

      if (!slug) {
        slug = `post-${Math.random().toString(36).substring(2, 9)}`;
      }

      const processMetaKeywords = (keywords) => {
        if (!keywords) return [];
        if (Array.isArray(keywords)) return keywords;
        if (typeof keywords === "string") {
          return keywords
            .split(",")
            .map((kw) => kw.trim())
            .filter((kw) => kw);
        }
        return [];
      };

      const postData = {
        ...values,
        slug,
        content: content || "",
        featuredImage: featuredImage || "",
        tags: values.tags
          ? values.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
        seo: {
          metaTitle: values.seo?.metaTitle || "",
          metaDescription: values.seo?.metaDescription || "",
          metaKeywords: processMetaKeywords(values.seo?.metaKeywords),
        },
      };

      if (isEditMode) {
        await updateBlogPost(id, postData);
        message.success("Post updated successfully");
      } else {
        await createBlogPost(postData);
        message.success("Post created successfully");
      }

      navigate("/admin/blog");
    } catch (error) {
      console.error("Error saving post:", error);
      message.error(`Failed to ${isEditMode ? "update" : "create"} post`);
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title) => {
    if (!title) return "";
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    const slug = generateSlug(title);
    form.setFieldsValue({ slug });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800">
        <Spin size="large" className="text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
      {/* 2. Custom Styles for Professional Editor Look & Dark Mode Support */}
      <style>{`
        .custom-quill-editor .ql-container {
          min-height: 400px;
          font-size: 16px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .custom-quill-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: #f3f4f6; /* light gray for light mode */
        }
        
        /* Dark Mode Quill Overrides */
        .dark .custom-quill-editor .ql-toolbar {
          background-color: #374151; /* gray-700 */
          border-color: #4b5563; /* gray-600 */
        }
        .dark .custom-quill-editor .ql-container {
          border-color: #4b5563; /* gray-600 */
        }
        .dark .custom-quill-editor .ql-stroke {
          stroke: #d1d5db; /* gray-300 */
        }
        .dark .custom-quill-editor .ql-fill {
          fill: #d1d5db; /* gray-300 */
        }
        .dark .custom-quill-editor .ql-picker-label {
          color: #d1d5db;
        }
        .dark .custom-quill-editor .ql-picker-options {
          background-color: #1f2937;
          border-color: #4b5563;
        }
        .dark .custom-quill-editor .ql-picker-item {
          color: #d1d5db;
        }
        .dark .custom-quill-editor .ql-picker-item:hover {
          color: #60a5fa; /* blue-400 */
        }
      `}</style>

      <div className="flex items-center mb-6">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/admin/blog")}
          className="mr-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Back to Posts
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isEditMode ? "Edit Blog Post" : "Create New Blog Post"}
        </h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: "draft",
          seo: {},
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card
              title="Content"
              className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              headStyle={{
                borderBottom: "1px solid #e5e7eb",
                color: "#1f2937",
                fontSize: "1.125rem",
                fontWeight: "600",
              }}
              bodyStyle={{ color: "#1f2937" }}
            >
              <Form.Item
                name="title"
                label="Title"
                rules={[
                  { required: true, message: "Please enter a title" },
                  { max: 200, message: "Title cannot exceed 200 characters" },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter post title"
                  onChange={handleTitleChange}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="slug"
                label="Slug (URL)"
                rules={[
                  { required: true, message: "Please enter a slug" },
                  {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message:
                      "Slug can only contain letters, numbers, and hyphens",
                  },
                ]}
              >
                <Input
                  placeholder="post-slug"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg"
                  prefix="/"
                />
              </Form.Item>

              <Form.Item
                name="excerpt"
                label="Excerpt (Short Summary)"
                rules={[
                  { max: 300, message: "Excerpt cannot exceed 300 characters" },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="A short excerpt that summarizes the post..."
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg"
                />
              </Form.Item>

              <Form.Item label="Detailed Content" required>
                <div className="custom-quill-editor rounded-lg shadow-sm">
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    formats={quillFormats}
                    className="dark:text-white"
                    placeholder="Write your amazing blog post here..."
                  />
                </div>
              </Form.Item>
            </Card>

            <Card
              title="Featured Image"
              className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              headStyle={{
                borderBottom: "1px solid #e5e7eb",
                color: "#1f2937",
              }}
              bodyStyle={{ color: "#1f2937" }}
            >
              <Input
                placeholder="https://example.com/image.jpg"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4 rounded-lg"
              />
              {featuredImage && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-2">
                    Image Preview:
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 flex justify-center">
                    <img
                      src={featuredImage}
                      alt="Featured preview"
                      className="max-h-64 object-cover rounded shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDFkMSIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMSAxNnYzYTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0ydi0xM2EyIDIgMCAwIDEgMi0yaDZsMiAyaDRsMi0yaDQiLz48Y2lyY2xlIGN4PSI5LjUiIGN5PSI5LjUiIHI9IjEuNSIvPjxwYXRoIGQ9Ik0yMSAxNWwtMy4wODYtMy4wODZhMiAyIDAgMCAwLTIuODI4IDBMNiAyMSIvPjwvc3ZnPg==";
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card
              title="Publish"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              headStyle={{
                borderBottom: "1px solid #e5e7eb",
                color: "#1f2937",
              }}
            >
              <Form.Item name="status" label="Status">
                <Select className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg">
                  <Option
                    value="draft"
                    className="dark:bg-gray-700 dark:text-white"
                  >
                    Draft
                  </Option>
                  <Option
                    value="published"
                    className="dark:bg-gray-700 dark:text-white"
                  >
                    Published
                  </Option>
                  <Option
                    value="archived"
                    className="dark:bg-gray-700 dark:text-white"
                  >
                    Archived
                  </Option>
                </Select>
              </Form.Item>

              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => navigate("/admin/blog")}
                  className="dark:bg-gray-600 dark:border-gray-500 dark:text-white hover:dark:bg-gray-500 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-lg"
                >
                  {isEditMode ? "Update Post" : "Publish Post"}
                </Button>
              </div>
            </Card>

            <Card
              title="Tags"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              headStyle={{
                borderBottom: "1px solid #e5e7eb",
                color: "#1f2937",
              }}
            >
              <Form.Item
                name="tags"
                help={
                  <span className="text-xs text-gray-400">
                    e.g. technology, react, coding
                  </span>
                }
              >
                <Input
                  placeholder="Add tags..."
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg"
                />
              </Form.Item>
            </Card>

            <Card
              title="SEO Settings"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              headStyle={{
                borderBottom: "1px solid #e5e7eb",
                color: "#1f2937",
              }}
            >
              <Form.Item name={["seo", "metaTitle"]} label="Meta Title">
                <Input
                  placeholder="Enter SEO title"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name={["seo", "metaDescription"]}
                label="Meta Description"
              >
                <TextArea
                  rows={4}
                  placeholder="Enter a compelling description for search results"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg"
                />
              </Form.Item>

              <Form.Item name={["seo", "metaKeywords"]} label="Meta Keywords">
                <Input
                  placeholder="keyword1, keyword2..."
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg"
                />
              </Form.Item>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default BlogPostForm;
