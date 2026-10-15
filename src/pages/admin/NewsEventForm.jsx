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
  Upload,
} from "antd";
import {
  SaveOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  CalendarOutlined,
  NotificationOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import {
  getNewsEventById,
  createNewsEvent,
  updateNewsEvent,
} from "../../api/newsEventApi";
import { uploadImage } from "../../api/imageApi";

const { TextArea } = Input;
const { Option } = Select;

const CATEGORIES = [
  { value: "upcoming", label: "Live Masterclass (Upcoming)" },
  { value: "placement", label: "Placement Drive" },
  { value: "news", label: "Press & Announcement" },
  { value: "past", label: "Archived Session" },
];

const TYPES = [
  { value: "masterclass", label: "Masterclass" },
  { value: "placement", label: "Placement Drive" },
  { value: "press", label: "Press Release" },
  { value: "announcement", label: "Announcement" },
  { value: "archive", label: "Archived Session" },
];

const MODES = [
  "Live Interactive Webinar",
  "Virtual Drive",
  "Official Notice",
  "On-Demand Recording",
];

const NewsEventForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const [previewValues, setPreviewValues] = useState({
    title: "Event / Article Title",
    type: "masterclass",
    category: "upcoming",
    description: "Short summary of the webinar, announcement, or recruitment drive.",
    date: new Date().toISOString().split("T")[0],
    time: "06:30 PM - 08:00 PM IST",
    location: "Live Interactive Session via Inxyme Live Portal",
    mode: "Live Interactive Webinar",
    organizerName: "Inxyme Enterprise Advisory Panel",
    organizerDivision: "SAP Center of Excellence",
    tag: "Masterclass",
    featured: false,
    registrationOpen: true,
  });

  useEffect(() => {
    if (!isEditMode) return;

    const fetchItem = async () => {
      try {
        setLoading(true);
        const res = await getNewsEventById(id);
        const item = res.data?.item || res.item;

        if (item) {
          setImageUrl(item.image || "");
          form.setFieldsValue({
            title: item.title,
            type: item.type || "masterclass",
            category: item.category || "upcoming",
            description: item.description,
            fullContent: item.fullContent,
            date: item.date,
            time: item.time,
            location: item.location,
            mode: item.mode || "Live Interactive Webinar",
            organizerName: item.organizerName || item.organizedBy?.name,
            organizerDivision: item.organizerDivision || item.organizedBy?.division,
            publisher: item.publisher,
            image: item.image,
            tag: item.tag || "Masterclass",
            featured: Boolean(item.featured),
            registrationOpen: item.registrationOpen !== undefined ? Boolean(item.registrationOpen) : true,
            externalLink: item.externalLink,
            status: item.status || "published",
            displayOrder: item.displayOrder || 0,
          });

          setPreviewValues({
            title: item.title,
            type: item.type || "masterclass",
            category: item.category || "upcoming",
            description: item.description,
            date: item.date,
            time: item.time,
            location: item.location,
            mode: item.mode || "Live Interactive Webinar",
            organizerName: item.organizerName || item.organizedBy?.name || "Inxyme",
            organizerDivision: item.organizerDivision || item.organizedBy?.division || "",
            tag: item.tag || "Masterclass",
            featured: Boolean(item.featured),
            registrationOpen: item.registrationOpen !== undefined ? Boolean(item.registrationOpen) : true,
            image: item.image,
          });
        }
      } catch (err) {
        console.error("Error loading event:", err);
        message.error("Failed to load details");
        navigate("/admin/news-events");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, isEditMode, form, navigate]);

  const handleValuesChange = (_, all) => {
    setPreviewValues((prev) => ({
      ...prev,
      ...all,
      image: imageUrl || all.image,
    }));
  };

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      const res = await uploadImage(file);
      const url = res.url || res.path || (res.data && res.data.url);
      if (url) {
        setImageUrl(url);
        form.setFieldsValue({ image: url });
        setPreviewValues((p) => ({ ...p, image: url }));
        message.success("Image uploaded successfully!");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      message.error("Failed to upload image. You can also paste an image URL.");
    } finally {
      setUploadingImage(false);
    }
    return false;
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        image: imageUrl || values.image || "",
        featured: Boolean(values.featured),
        registrationOpen: Boolean(values.registrationOpen),
        displayOrder: Number(values.displayOrder || 0),
      };

      if (isEditMode) {
        await updateNewsEvent(id, payload);
        message.success("News/Event updated successfully!");
      } else {
        await createNewsEvent(payload);
        message.success("News/Event created successfully!");
      }

      navigate("/admin/news-events");
    } catch (err) {
      console.error("Error saving event:", err);
      message.error(err.response?.data?.message || "Failed to save event");
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

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/news-events")}
            className="text-gray-700 dark:text-gray-200"
          >
            Back to News &amp; Events
          </Button>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <NotificationOutlined className="text-indigo-600" />
            <span>{isEditMode ? "Edit News / Event" : "Create New News / Event"}</span>
          </h1>
        </div>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => form.submit()}
          className="bg-indigo-600 hover:bg-indigo-700 font-bold"
        >
          {isEditMode ? "Update Record" : "Publish Record"}
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        initialValues={{
          type: "masterclass",
          category: "upcoming",
          mode: "Live Interactive Webinar",
          date: new Date().toISOString().split("T")[0],
          organizerName: "Inxyme Enterprise Advisory Panel",
          organizerDivision: "SAP Center of Excellence",
          tag: "SAP ERP",
          registrationOpen: true,
          featured: false,
          status: "published",
          displayOrder: 0,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              title="1. Event / Notice Primary Details"
              className="border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl"
            >
              <Form.Item
                name="title"
                label="Headline / Title"
                rules={[{ required: true, message: "Please enter the title" }]}
              >
                <Input
                  placeholder="e.g. Enterprise SAP S/4HANA & Cloud ERP: Architecture, Implementation & Career Roadmap"
                  size="large"
                />
              </Form.Item>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                  name="category"
                  label="Category Tab"
                  rules={[{ required: true, message: "Please select category" }]}
                >
                  <Select size="large">
                    {CATEGORIES.map((c) => (
                      <Option key={c.value} value={c.value}>
                        {c.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="type"
                  label="Event Type"
                  rules={[{ required: true, message: "Please select type" }]}
                >
                  <Select size="large">
                    {TYPES.map((t) => (
                      <Option key={t.value} value={t.value}>
                        {t.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="tag"
                  label="Badge Tag"
                  rules={[{ required: true, message: "Please enter a tag" }]}
                >
                  <Input placeholder="e.g. SAP ERP, Placement Drive, Generative AI" size="large" />
                </Form.Item>
              </div>

              <Form.Item
                name="description"
                label="Short Summary"
                rules={[{ required: true, message: "Please provide a brief description" }]}
              >
                <TextArea
                  rows={3}
                  placeholder="A concise 2-3 sentence overview shown on the card preview..."
                  maxLength={600}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="fullContent"
                label="Full Agenda & Detailed Content (Markdown / Bullet Points Supported)"
              >
                <TextArea
                  rows={6}
                  placeholder="Detailed schedule, session takeaways, key speakers, or registration criteria..."
                />
              </Form.Item>
            </Card>

            <Card
              title="2. Schedule, Venue & Delivery Mode"
              className="border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="date"
                  label="Event Date / Publication Date"
                  rules={[{ required: true, message: "Please enter a date" }]}
                >
                  <Input placeholder="YYYY-MM-DD (e.g. 2026-10-18)" size="large" />
                </Form.Item>

                <Form.Item name="time" label="Time Slot (Optional for news)">
                  <Input placeholder="e.g. 06:30 PM - 08:00 PM IST" size="large" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="mode" label="Delivery Mode">
                  <Select size="large">
                    {MODES.map((m) => (
                      <Option key={m} value={m}>
                        {m}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="location" label="Venue / Portal Location">
                  <Input placeholder="e.g. Live Interactive Session via Inxyme Live Portal" size="large" />
                </Form.Item>
              </div>
            </Card>

            <Card
              title="3. Organizer, Media & External Link"
              className="border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="organizerName" label="Host / Organizing Body">
                  <Input placeholder="e.g. Inxyme Enterprise Advisory Panel" size="large" />
                </Form.Item>

                <Form.Item name="organizerDivision" label="Division / Department">
                  <Input placeholder="e.g. SAP Center of Excellence" size="large" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item name="publisher" label="Press Publisher (If Press Release)">
                  <Input placeholder="e.g. Federation of Indian Education & Industry Councils" size="large" />
                </Form.Item>

                <Form.Item name="externalLink" label="External / Learn More Link">
                  <Input placeholder="e.g. /awards-recognition or https://..." size="large" />
                </Form.Item>
              </div>

              {/* Banner Upload */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Upload
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploadingImage}
                      size="large"
                      className="bg-slate-100 hover:bg-slate-200 font-semibold"
                    >
                      {uploadingImage ? "Uploading Image..." : "Upload Banner Image File"}
                    </Button>
                  </Upload>
                  <span className="text-xs text-slate-400">
                    Recommended for awards or press releases
                  </span>
                </div>

                <Form.Item name="image" label="Or Direct Banner Image URL">
                  <Input
                    placeholder="https://www.inxyme.com/api/upload/file/award-correction-2991.png"
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
                      Highlights card in top banner &amp; premier placement
                    </div>
                  </div>
                  <Form.Item name="featured" valuePropName="checked" className="mb-0">
                    <Switch />
                  </Form.Item>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      RSVP / Registration Open
                    </div>
                    <div className="text-xs text-slate-500">
                      Shows "Register for Free" button
                    </div>
                  </div>
                  <Form.Item name="registrationOpen" valuePropName="checked" className="mb-0">
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

              {/* Replica of the website event card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Top metadata pill */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/80">
                      <span>{previewValues.tag || "Webinar"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <CalendarOutlined className="text-blue-600" />
                      <span>{previewValues.date}</span>
                    </span>
                  </div>

                  {/* Thumbnail if present */}
                  {(imageUrl || previewValues.image) && (
                    <img
                      src={imageUrl || previewValues.image}
                      alt="Banner Preview"
                      className="w-full h-32 rounded-2xl object-cover border border-slate-100 dark:border-slate-800"
                    />
                  )}

                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {previewValues.title || "Event Headline"}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {previewValues.description || "Description preview..."}
                  </p>

                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    {previewValues.time && (
                      <div className="flex items-center gap-1.5">
                        <ClockCircleOutlined className="text-slate-400" />
                        <span>{previewValues.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 truncate">
                      <EnvironmentOutlined className="text-slate-400 shrink-0" />
                      <span className="truncate">{previewValues.location || "Online"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                    {previewValues.organizerName || "Inxyme"}
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    className="bg-blue-600 font-bold text-[11px]"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default NewsEventForm;
