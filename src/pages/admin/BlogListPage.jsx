import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Typography,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  PictureOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { getBlogPosts, deleteBlogPost } from "../../api/blogApi";

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

const BlogListPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    search: "",
  });

  const fetchPosts = async (params = {}) => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const queryParams = {
        page: params.pagination?.current || current,
        limit: params.pagination?.pageSize || pageSize,
        status: filters.status,
        search: filters.search,
        ...params,
      };

      const response = await getBlogPosts(queryParams);

      setPosts(response.data?.posts || response.posts || []);
      setPagination({
        ...pagination,
        total: response.data?.total || response.total || 0,
        current: response.data?.currentPage || response.currentPage || 1,
      });
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      message.error("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchPosts({
      pagination,
      ...filters,
      ...(sorter.field && {
        sortBy: `${sorter.order === "descend" ? "-" : ""}${sorter.field}`,
      }),
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteBlogPost(id);
      message.success("Blog post deleted successfully");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      message.error(
        error.response?.data?.message || "Failed to delete blog post",
      );
    }
  };

  const handleStatusFilter = (value) => {
    setFilters({
      ...filters,
      status: value || undefined,
    });
  };

  const handleSearch = (value) => {
    setFilters({
      ...filters,
      search: value,
    });
  };

  const columns = [
    {
      title: "Post",
      dataIndex: "title",
      key: "title",
      sorter: true,
      width: "35%",
      render: (text, record) => (
        <div className="flex items-start gap-3">
          {/* Featured Image Thumbnail */}
          <Avatar
            shape="square"
            size={56}
            src={record.featuredImage}
            icon={<PictureOutlined />}
            className="bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600 rounded-md"
          />
          <div className="flex flex-col overflow-hidden">
            <Link
              to={`/admin/blog/edit/${record._id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold truncate text-sm"
            >
              {text}
            </Link>
            {/* Show slug/URL below title for SEO reference */}
            <Text
              type="secondary"
              className="text-xs truncate text-gray-500 dark:text-gray-400 mt-0.5"
            >
              /{record.slug}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "12%",
      filters: [
        { text: "Draft", value: "draft" },
        { text: "Published", value: "published" },
        { text: "Archived", value: "archived" },
      ],
      render: (status) => {
        const statusConfig = {
          published: { color: "success", label: "Published" },
          draft: { color: "warning", label: "Draft" },
          archived: { color: "error", label: "Archived" },
        };
        const config = statusConfig[status] || {
          color: "default",
          label: status,
        };

        return (
          <Tag
            color={config.color}
            className="uppercase tracking-wider text-[10px] font-bold m-0"
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: "15%",
      render: (tags) => (
        <div className="flex flex-wrap gap-1">
          {tags && tags.length > 0 ? (
            tags.slice(0, 2).map((tag, index) => (
              <Tag
                key={index}
                className="text-[10px] m-0 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
              >
                {tag}
              </Tag>
            ))
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
          {tags && tags.length > 2 && (
            <Tooltip title={tags.slice(2).join(", ")}>
              <Tag className="text-[10px] m-0 bg-gray-50 border-gray-200">
                +{tags.length - 2}
              </Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Author",
      dataIndex: ["author", "fullname"],
      key: "author",
      width: "13%",
      render: (text) => (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {text || "Admin"}
        </span>
      ),
    },
    {
      title: "Published",
      dataIndex: "createdAt", // Use createdAt or publishedAt based on your schema
      key: "date",
      sorter: true,
      width: "12%",
      render: (date) => (
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {date
            ? new Date(date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "-"}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "13%",
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Live">
            <Link to={`/blog/${record.slug}`} target="_blank">
              <Button
                type="text"
                icon={<EyeOutlined />}
                className="text-gray-500 hover:text-blue-500"
              />
            </Link>
          </Tooltip>
          <Tooltip title="Edit Post">
            <Link to={`/admin/blog/edit/${record._id}`}>
              <Button
                type="text"
                icon={<EditOutlined />}
                className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
              />
            </Link>
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Post"
              description="Are you sure you want to delete this blog post?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              placement="topLeft"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                className="hover:bg-red-50 dark:hover:bg-red-900/30"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white font-extrabold m-0">
            Blog Posts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and organize your website's articles.
          </p>
        </div>
        <Link to="/admin/blog/new">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-md font-medium"
          >
            Create New Post
          </Button>
        </Link>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Filters & Search Bar */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-96">
              <Search
                placeholder="Search by title or slug..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                size="large"
                className="w-full shadow-sm rounded-lg"
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                placeholder="Filter Status"
                allowClear
                onChange={handleStatusFilter}
                size="large"
                className="w-full shadow-sm rounded-lg"
              >
                <Option value="published">Published</Option>
                <Option value="draft">Draft</Option>
                <Option value="archived">Archived</Option>
              </Select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="p-0">
          <Table
            columns={columns}
            dataSource={posts}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 1000 }} // Makes table horizontally scrollable on mobile
            className="custom-admin-table"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50", "100"],
              showTotal: (total, range) => (
                <span className="text-gray-500 font-medium">
                  Showing {range[0]}-{range[1]} of {total} posts
                </span>
              ),
              className: "px-4 pb-4",
            }}
            onChange={handleTableChange}
          />
        </div>
      </div>

      {/* Table Custom Styles for Dark Mode Support */}
      <style>{`
        .custom-admin-table .ant-table {
          background: transparent;
        }
        .custom-admin-table .ant-table-thead > tr > th {
          background-color: #f9fafb; /* gray-50 */
          color: #6b7280; /* gray-500 */
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }
        /* Dark mode overrides for table */
        .dark .custom-admin-table .ant-table-thead > tr > th {
          background-color: #1f2937; /* gray-800 */
          color: #9ca3af; /* gray-400 */
          border-bottom-color: #374151; /* gray-700 */
        }
        .dark .custom-admin-table .ant-table-tbody > tr > td {
          border-bottom-color: #374151; /* gray-700 */
        }
        .dark .custom-admin-table .ant-table-tbody > tr:hover > td {
          background-color: #374151; /* gray-700 */
        }
        .dark .custom-admin-table .ant-pagination-item-link,
        .dark .custom-admin-table .ant-pagination-item {
          background-color: transparent;
          border-color: #4b5563;
        }
        .dark .custom-admin-table .ant-pagination-item a {
          color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default BlogListPage;
