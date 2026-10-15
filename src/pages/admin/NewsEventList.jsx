import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Input,
  Select,
  Tooltip,
  Avatar,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
  ReloadOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  NotificationOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  getNewsEvents,
  deleteNewsEvent,
  updateNewsEvent,
  seedNewsEvents,
} from "../../api/newsEventApi";

const { Search } = Input;
const { Option } = Select;

const CATEGORIES = [
  { value: "all", label: "All Updates" },
  { value: "upcoming", label: "Live Masterclasses" },
  { value: "placement", label: "Placement Drives" },
  { value: "news", label: "Press & Announcements" },
  { value: "past", label: "Archived Sessions" },
];

const TYPES = [
  { value: "masterclass", label: "Masterclass" },
  { value: "placement", label: "Placement Drive" },
  { value: "press", label: "Press Release" },
  { value: "announcement", label: "Announcement" },
  { value: "archive", label: "Archived Session" },
];

const NewsEventList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    category: undefined,
    type: undefined,
    search: "",
  });

  const fetchItems = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: params.pagination?.current || pagination.current,
        limit: params.pagination?.pageSize || pagination.pageSize,
        status: filters.status,
        category: filters.category,
        type: filters.type,
        search: filters.search,
        ...params,
      };

      const response = await getNewsEvents(queryParams);
      const records = response.data?.items || [];
      setItems(records);
      setPagination({
        ...pagination,
        total: response.total || records.length,
        current: response.currentPage || 1,
      });
    } catch (error) {
      console.error("Error fetching news/events:", error);
      message.error("Failed to load news & events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchItems({ pagination: newPagination });
  };

  const handleDelete = async (id) => {
    try {
      await deleteNewsEvent(id);
      message.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      message.error("Failed to delete item");
    }
  };

  const handleToggleFeatured = async (record) => {
    try {
      const updated = !record.featured;
      await updateNewsEvent(record._id, { featured: updated });
      message.success(
        updated
          ? `Marked "${record.title.slice(0, 30)}..." as featured spotlight`
          : `Unmarked featured status`
      );
      fetchItems();
    } catch (error) {
      console.error("Error updating featured status:", error);
      message.error("Failed to update status");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      await seedNewsEvents(true);
      message.success("Default news & events restored successfully!");
      fetchItems();
    } catch (error) {
      console.error("Error seeding events:", error);
      message.error("Failed to seed events");
    } finally {
      setSeeding(false);
    }
  };

  const columns = [
    {
      title: "Event / Article",
      key: "title",
      render: (_, record) => (
        <div className="flex items-start gap-3 max-w-md">
          {record.image ? (
            <img
              src={record.image}
              alt={record.title}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0 border border-indigo-200 dark:border-indigo-800">
              <CalendarOutlined />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 leading-snug">
              {record.title}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag color="purple" className="text-[10px] font-bold uppercase rounded-md">
                {record.tag || record.type}
              </Tag>
              {record.featured && (
                <Tag color="gold" className="text-[10px] font-bold rounded-md">
                  ★ Featured
                </Tag>
              )}
              {record.registrationOpen && (
                <Tag color="green" className="text-[10px] font-bold rounded-md">
                  ✓ Open
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Category & Mode",
      key: "category",
      render: (_, record) => {
        const catMap = {
          upcoming: { color: "blue", label: "Masterclass" },
          placement: { color: "green", label: "Placement Drive" },
          news: { color: "orange", label: "Press & News" },
          past: { color: "default", label: "Archive" },
        };
        const catInfo = catMap[record.category] || { color: "default", label: record.category };

        return (
          <div className="space-y-1">
            <Tag color={catInfo.color} className="font-bold text-xs uppercase rounded-md">
              {catInfo.label}
            </Tag>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <VideoCameraOutlined />
              <span>{record.mode || "Online"}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Schedule / Date",
      key: "date",
      render: (_, record) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <CalendarOutlined className="text-indigo-600" />
            <span>{record.date}</span>
          </div>
          {record.time && (
            <div className="text-[11px] text-slate-500 font-medium">
              ⏰ {record.time}
            </div>
          )}
          {record.location && (
            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
              📍 {record.location}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Organizer",
      key: "organizer",
      render: (_, record) => (
        <div className="space-y-0.5 text-xs max-w-[180px]">
          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {record.organizerName || record.organizedBy?.name || "Inxyme"}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {record.organizerDivision || record.organizedBy?.division || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "published" ? "success" : "default"}>
          {status === "published" ? "Published" : "Draft"}
        </Tag>
      ),
    },
    {
      title: "Featured",
      key: "featured",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          icon={
            record.featured ? (
              <StarFilled className="text-amber-500 text-lg" />
            ) : (
              <StarOutlined className="text-gray-400 text-lg hover:text-amber-500" />
            )
          }
          onClick={() => handleToggleFeatured(record)}
          title={record.featured ? "Unmark featured" : "Mark as featured spotlight"}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            ghost
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/admin/news-events/edit/${record._id}`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Event / Article"
            description="Are you sure you want to permanently delete this news/event record?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <NotificationOutlined className="text-indigo-600" />
            <span>News, Events &amp; Masterclasses</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage institutional webinars, placement drives, press releases, and announcements published on the website.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            icon={<ReloadOutlined spin={seeding} />}
            onClick={handleSeedDefaults}
            loading={seeding}
            className="text-xs"
            title="Reset default events if empty"
          >
            Restore Default Events
          </Button>
          <Link to="/admin/news-events/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
            >
              Add New News / Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-6">
        <div className="flex flex-wrap items-center gap-3">
          <Search
            placeholder="Search by title, description, tag..."
            allowClear
            onSearch={(val) => setFilters({ ...filters, search: val })}
            style={{ width: 280 }}
            className="text-xs"
          />

          <Select
            placeholder="All Categories"
            allowClear
            style={{ width: 180 }}
            onChange={(val) => setFilters({ ...filters, category: val })}
          >
            {CATEGORIES.map((cat) => (
              <Option key={cat.value} value={cat.value}>
                {cat.label}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="All Types"
            allowClear
            style={{ width: 150 }}
            onChange={(val) => setFilters({ ...filters, type: val })}
          >
            {TYPES.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="All Status"
            allowClear
            style={{ width: 130 }}
            onChange={(val) => setFilters({ ...filters, status: val })}
          >
            <Option value="published">Published</Option>
            <Option value="draft">Draft</Option>
          </Select>
        </div>

        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Total Items: <span className="font-bold text-indigo-600">{items.length}</span>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={items}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
        className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      />
    </div>
  );
};

export default NewsEventList;
