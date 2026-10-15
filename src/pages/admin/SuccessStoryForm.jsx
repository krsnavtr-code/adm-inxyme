import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Spin,
  Select,
  Switch,
  InputNumber,
  Rate,
  Upload,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  TrophyOutlined,
  CheckCircleFilled,
  IdcardOutlined,
  SafetyCertificateFilled,
} from "@ant-design/icons";
import {
  getSuccessStoryById,
  createSuccessStory,
  updateSuccessStory,
} from "../../api/successStoryApi";
import { uploadImage } from "../../api/imageApi";

const { TextArea } = Input;
const { Option } = Select;

const CATEGORIES = [
  "Career Switch",
  "Upskilling",
  "College Graduates",
  "SAP Enterprise",
  "AI & Data",
];

const SuccessStoryForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Live preview state watching form values
  const [previewValues, setPreviewValues] = useState({
    name: "Student Name",
    role: "MLOps & AI Engineer",
    company: "Cognitive Solutions",
    course: "LLMOps & Machine Learning Operations",
    category: "Career Switch",
    hike: "140% Hike",
    content:
      "The practical mentoring, real-world sandbox environments, and placement support at Inxyme helped me transition smoothly into my target technology career.",
    rating: 5,
    featured: false,
    batchYear: 2026,
    cardIdNumber: "INX-2026-0428",
    status: "published",
    displayOrder: 0,
  });

  useEffect(() => {
    if (!isEditMode) return;

    const fetchStory = async () => {
      try {
        setLoading(true);
        const res = await getSuccessStoryById(id);
        const story = res.data?.story || res.story;

        if (story) {
          setImageUrl(story.image || "");
          form.setFieldsValue({
            name: story.name,
            role: story.role,
            company: story.company,
            course: story.course,
            category: story.category || "Career Switch",
            image: story.image,
            hike: story.hike,
            content: story.content,
            rating: story.rating || 5,
            featured: story.featured || false,
            batchYear: story.batchYear || 2026,
            cardIdNumber: story.cardIdNumber,
            status: story.status || "published",
            displayOrder: story.displayOrder || 0,
          });

          setPreviewValues({
            name: story.name || "Student Name",
            role: story.role || "Role",
            company: story.company || "",
            course: story.course || "Course Specialization",
            category: story.category || "Career Switch",
            hike: story.hike || "",
            content: story.content || "",
            rating: story.rating || 5,
            featured: story.featured || false,
            batchYear: story.batchYear || 2026,
            cardIdNumber: story.cardIdNumber || "INX-2026-0428",
            status: story.status || "published",
            displayOrder: story.displayOrder || 0,
          });
        }
      } catch (err) {
        console.error("Error loading story:", err);
        message.error("Failed to load story details");
        navigate("/admin/success-stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, isEditMode, form, navigate]);

  const handleFormValuesChange = (_, allValues) => {
    setPreviewValues((prev) => ({
      ...prev,
      ...allValues,
      image: imageUrl || allValues.image,
    }));
  };

  const handleImageFileUpload = async (file) => {
    try {
      setUploadingImage(true);
      const res = await uploadImage(file);
      const uploadedUrl = res.url || res.path || (res.data && res.data.url);

      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        form.setFieldsValue({ image: uploadedUrl });
        setPreviewValues((prev) => ({ ...prev, image: uploadedUrl }));
        message.success("Image uploaded successfully!");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      message.error("Failed to upload image. Please try again or paste URL.");
    } finally {
      setUploadingImage(false);
    }
    return false; // Prevent antd default post
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        image: imageUrl || values.image || "",
        rating: Number(values.rating || 5),
        batchYear: Number(values.batchYear || 2026),
        displayOrder: Number(values.displayOrder || 0),
        featured: Boolean(values.featured),
      };

      if (isEditMode) {
        await updateSuccessStory(id, payload);
        message.success("Success story card updated successfully!");
      } else {
        await createSuccessStory(payload);
        message.success("Success story card created successfully!");
      }

      navigate("/admin/success-stories");
    } catch (err) {
      console.error("Error saving story:", err);
      message.error(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} success story`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800 rounded-2xl">
        <Spin size="large" />
      </div>
    );
  }

  const previewCardId =
    previewValues.cardIdNumber ||
    `INX-${previewValues.batchYear || 2026}-0${Math.floor(100 + Math.random() * 900)}`;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/success-stories")}
            className="text-gray-700 dark:text-gray-200"
          >
            Back to Stories
          </Button>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <TrophyOutlined className="text-indigo-600" />
            <span>{isEditMode ? "Edit Success Story Card" : "Add New Success Story Card"}</span>
          </h1>
        </div>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => form.submit()}
          className="bg-indigo-600 hover:bg-indigo-700 font-bold"
        >
          {isEditMode ? "Update Story" : "Publish Story"}
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleFormValuesChange}
        initialValues={{
          category: "Career Switch",
          rating: 5,
          batchYear: 2026,
          status: "published",
          featured: false,
          displayOrder: 0,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              title="1. Student & Placement Dossier"
              className="border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="name"
                  label="Student / Cardholder Name"
                  rules={[{ required: true, message: "Please enter student name" }]}
                >
                  <Input placeholder="e.g. Krishna Avtar" size="large" />
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Designation / Role"
                  rules={[{ required: true, message: "Please enter the job role" }]}
                >
                  <Input placeholder="e.g. MLOps & AI Engineer" size="large" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="company" label="Placed Company / Organization">
                  <Input placeholder="e.g. Cognitive Solutions or Accenture" size="large" />
                </Form.Item>

                <Form.Item name="hike" label="Salary Hike / Placement Tag">
                  <Input placeholder="e.g. 140% Hike or Campus Placed" size="large" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="course"
                  label="Certified Specialization / Course"
                  rules={[{ required: true, message: "Please specify the course taken" }]}
                >
                  <Input placeholder="e.g. LLMOps & Machine Learning Operations" size="large" />
                </Form.Item>

                <Form.Item
                  name="category"
                  label="Category Tab"
                  rules={[{ required: true, message: "Please select category" }]}
                >
                  <Select size="large">
                    {CATEGORIES.map((cat) => (
                      <Option key={cat} value={cat}>
                        {cat}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item name="rating" label="Star Rating">
                  <Rate />
                </Form.Item>

                <Form.Item name="batchYear" label="Alumni Batch Year">
                  <InputNumber min={2020} max={2030} className="w-full" size="large" />
                </Form.Item>

                <Form.Item name="cardIdNumber" label="Custom Alumni ID (Optional)">
                  <Input placeholder="Auto-generated if blank" size="large" />
                </Form.Item>
              </div>
            </Card>

            <Card
              title="2. Student Photo Upload"
              className="border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl"
            >
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Upload
                    beforeUpload={handleImageFileUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadingImage}
                      size="large"
                      className="bg-slate-100 hover:bg-slate-200 font-semibold"
                    >
                      {uploadingImage ? "Uploading to Server..." : "Upload Student Photo File"}
                    </Button>
                  </Upload>
                  <span className="text-xs text-slate-400">
                    Supports PNG, JPG, WebP (Max 10MB)
                  </span>
                </div>

                <Form.Item
                  name="image"
                  label="Or Direct Image URL"
                  extra="Can be an existing inxyme upload URL or external image link"
                >
                  <Input
                    placeholder="https://www.inxyme.com/api/upload/file/Krishna-4629.png"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      form.setFieldsValue({ image: e.target.value });
                      setPreviewValues((p) => ({ ...p, image: e.target.value }));
                    }}
                    size="large"
                  />
                </Form.Item>
              </div>
            </Card>

            <Card
              title="3. Alumni Testimony Log (Review / Story)"
              className="border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl"
            >
              <Form.Item
                name="content"
                rules={[{ required: true, message: "Please enter the student's testimonial" }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Share their career transition journey, what they learned, and how Inxyme assisted with placement..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </Card>
          </div>

          {/* Right Column: Publishing Controls + Real-Time Live Card Preview */}
          <div className="space-y-6">
            <Card
              title="Publishing Options"
              className="border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      ★ Featured Spotlight
                    </div>
                    <div className="text-xs text-slate-500">
                      Showcase in the top hero spotlight banner
                    </div>
                  </div>
                  <Form.Item name="featured" valuePropName="checked" className="mb-0">
                    <Switch />
                  </Form.Item>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Publication Status
                    </div>
                    <div className="text-xs text-slate-500">
                      Published cards appear live on website
                    </div>
                  </div>
                  <Form.Item name="status" className="mb-0">
                    <Select style={{ width: 120 }}>
                      <Option value="published">Published</Option>
                      <Option value="draft">Draft</Option>
                    </Select>
                  </Form.Item>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Display Order
                    </div>
                    <div className="text-xs text-slate-500">Lower numbers appear first</div>
                  </div>
                  <Form.Item name="displayOrder" className="mb-0">
                    <InputNumber min={0} max={999} />
                  </Form.Item>
                </div>
              </div>
            </Card>

            {/* Live Website Card Preview */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Live Website Card Preview</span>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full font-mono">
                  Exact Frontend Style
                </span>
              </div>

              {/* Replica of the website alumni ID card */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-blue-200/90 dark:border-blue-900/60 shadow-lg overflow-hidden flex flex-col justify-between pt-2">
                {/* Lanyard Slot */}
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-2" />

                {/* Header Strip */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 px-4 py-2 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-black tracking-wider text-[10px] uppercase">
                    <IdcardOutlined />
                    <span>Inxyme Alumni ID</span>
                  </div>
                  <div className="font-mono text-[10px] tracking-widest opacity-90">
                    {previewCardId}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3.5 bg-white dark:bg-slate-900">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">
                        ID // INX-{previewValues.batchYear || 2026}-ALU
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {previewValues.category}
                    </span>
                  </div>

                  {/* Profile Row */}
                  <div className="flex items-stretch gap-3">
                    <div className="relative shrink-0">
                      <div className="p-0.5 rounded-xl bg-slate-100 border border-slate-200">
                        {imageUrl || previewValues.image ? (
                          <img
                            src={imageUrl || previewValues.image}
                            alt="Preview"
                            className="w-14 h-18 rounded-lg object-cover ring-1 ring-blue-500/40"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-14 h-18 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl">
                            {previewValues.name?.charAt(0) || "A"}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[8px] font-black uppercase ring-2 ring-white">
                        ✓ Verified
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="block text-[8px] font-mono font-bold uppercase text-slate-400">
                        Cardholder Name
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                        {previewValues.name || "Student Name"}
                      </h3>

                      <div className="mt-1 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-100">
                        <span className="block text-[8px] font-mono uppercase text-slate-400">
                          Designation
                        </span>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                          {previewValues.role || "Role"}
                        </p>
                        {previewValues.company && (
                          <div className="text-[10px] text-slate-600 flex items-center justify-between gap-1 mt-0.5">
                            <span className="truncate">🏢 {previewValues.company}</span>
                            {previewValues.hike && (
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 rounded">
                                ⚡ {previewValues.hike}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Course Strip */}
                  <div className="bg-slate-900 text-white p-2 rounded-xl text-xs flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="block text-[7px] font-mono text-slate-400 uppercase">
                        Certified Specialization
                      </span>
                      <span className="block text-[11px] font-bold truncate">
                        {previewValues.course || "Course Specialization"}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-0.5 text-amber-400 text-[9px]">
                      {Array.from({ length: previewValues.rating || 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>

                  {/* Testimony Quote */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border-l-2 border-slate-300">
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 italic line-clamp-2">
                      &ldquo;{previewValues.content}&rdquo;
                    </p>
                  </div>

                  {/* Bottom Barcode Strip */}
                  <div className="pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[8px] font-mono text-slate-400">
                    <span>BATCH OF {previewValues.batchYear || 2026} • INXYME VERIFIED</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <SafetyCertificateFilled /> AUTHENTIC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default SuccessStoryForm;
