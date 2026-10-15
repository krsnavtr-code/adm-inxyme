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
  Card,
  Avatar,
  Rate,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  UserOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  getSuccessStories,
  deleteSuccessStory,
  updateSuccessStory,
  seedSuccessStories,
} from "../../api/successStoryApi";

const { Search } = Input;
const { Option } = Select;

const CATEGORIES = [
  "Career Switch",
  "Upskilling",
  "College Graduates",
  "SAP Enterprise",
  "AI & Data",
];

const SuccessStoryList = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
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
    search: "",
  });

  const fetchStories = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: params.pagination?.current || pagination.current,
        limit: params.pagination?.pageSize || pagination.pageSize,
        status: filters.status,
        category: filters.category,
        search: filters.search,
        ...params,
      };

      const response = await getSuccessStories(queryParams);
      const items = response.data?.stories || [];
      setStories(items);
      setPagination({
        ...pagination,
        total: response.total || items.length,
        current: response.currentPage || 1,
      });
    } catch (error) {
      console.error("Error fetching success stories:", error);
      message.error("Failed to load success stories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [filters]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
    fetchStories({ pagination: newPagination });
  };

  const handleDelete = async (id) => {
    try {
      await deleteSuccessStory(id);
      message.success("Success story deleted successfully");
      fetchStories();
    } catch (error) {
      console.error("Error deleting story:", error);
      message.error("Failed to delete success story");
    }
  };

  const handleToggleFeatured = async (record) => {
    try {
      const updatedFeatured = !record.featured;
      await updateSuccessStory(record._id, { featured: updatedFeatured });
      message.success(
        updatedFeatured
          ? `${record.name} is now set as Featured Spotlight!`
          : `Removed ${record.name} from Featured Spotlight.`
      );
      fetchStories();
    } catch (error) {
      console.error("Error updating featured status:", error);
      message.error("Failed to update featured status");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      await seedSuccessStories(true);
      message.success("Default success stories seeded successfully!");
      fetchStories();
    } catch (error) {
      console.error("Error seeding:", error);
      message.error("Failed to seed stories");
    } finally {
      setSeeding(false);
    }
  };

  const columns = [
    {
      title: "Student / Alumni",
      key: "student",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.image ? (
            <img
              src={record.image}
              alt={record.name}
              className="w-12 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Avatar
              size={48}
              icon={<UserOutlined />}
              className="bg-indigo-600 text-white shrink-0 rounded-xl"
            />
          )}
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <span>{record.name}</span>
              {record.featured && (
                <Tooltip title="Featured Spotlight Alumni">
                  <StarFilled className="text-amber-500 text-xs" />
                </Tooltip>
              )}
            </div>
            <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              {record.cardIdNumber || `INX-${record.batchYear || 2026}-ALU`}
            </div>
            <div className="text-[11px] text-slate-500">
              Batch: {record.batchYear || 2026}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Placement / Role",
      key: "role",
      render: (_, record) => (
        <div className="space-y-1">
          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            {record.role}
          </div>
          {record.company && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              🏢 {record.company}
            </div>
          )}
          {record.hike && (
            <Tag color="green" className="text-[11px] font-bold rounded-md">
              ⚡ {record.hike}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Course & Category",
      key: "course",
      render: (_, record) => (
        <div className="space-y-1">
          <div className="font-medium text-xs text-slate-700 dark:text-slate-300">
            {record.course}
          </div>
          <Tag color="blue" className="text-[10px] uppercase font-bold rounded-md">
            {record.category}
          </Tag>
        </div>
      ),
    },
    {
      title: "Rating & Testimonial",
      key: "rating",
      render: (_, record) => (
        <div className="space-y-1 max-w-xs">
          <Rate disabled defaultValue={record.rating || 5} className="text-xs" />
          <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
            "{record.content}"
          </p>
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
            onClick={() => navigate(`/admin/success-stories/edit/${record._id}`)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Story"
            description="Are you sure you want to permanently delete this alumni success story card?"
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <TrophyOutlined className="text-indigo-600" />
            <span>Success Stories &amp; Alumni ID Cards</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage, upload, and publish verified alumni placement cards for the website success stories page.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            icon={<ReloadOutlined spin={seeding} />}
            onClick={handleSeedDefaults}
            loading={seeding}
            className="text-xs"
            title="Reset/Seed default cards if empty"
          >
            Restore Default Cards
          </Button>
          <Link to="/admin/success-stories/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-indigo-600 hover:bg-indigo-700 text-xs font-bold"
            >
              Add New Success Story
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-6">
        <div className="flex flex-wrap items-center gap-3">
          <Search
            placeholder="Search by student, role, course, company..."
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
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="All Status"
            allowClear
            style={{ width: 140 }}
            onChange={(val) => setFilters({ ...filters, status: val })}
          >
            <Option value="published">Published</Option>
            <Option value="draft">Draft</Option>
          </Select>
        </div>

        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Total Cards: <span className="font-bold text-indigo-600">{stories.length}</span>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={stories}
        rowKey="_id"
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        scroll={{ x: 900 }}
        className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      />
    </div>
  );
};

export default SuccessStoryList;
