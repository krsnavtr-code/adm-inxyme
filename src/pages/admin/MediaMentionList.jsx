import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Space, Tag, message, Popconfirm, Input, Select, Switch } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { getMediaMentions, deleteMediaMention } from '../../api/mediaMentionApi';

const { Search } = Input;
const { Option } = Select;

const MediaMentionList = () => {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    newsType: undefined,
    search: '',
  });

  const fetchMentions = async (params = {}) => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const queryParams = {
        page: params.pagination?.current || current,
        limit: params.pagination?.pageSize || pageSize,
        status: filters.status,
        newsType: filters.newsType,
        search: filters.search,
        ...params,
      };

      const response = await getMediaMentions(queryParams);
      
      setMentions(response.data?.mentions || []);
      setPagination({
        ...pagination,
        total: response.data?.total || 0,
        current: response.data?.currentPage || 1,
      });
    } catch (error) {
      console.error('Error fetching media mentions:', error);
      message.error('Failed to fetch media mentions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentions();
  }, [filters]);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchMentions({
      pagination,
      ...filters,
      ...(sorter.field && {
        sortBy: `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`,
      }),
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteMediaMention(id);
      message.success('Media mention deleted successfully');
      fetchMentions();
    } catch (error) {
      console.error('Error deleting media mention:', error);
      message.error(error.response?.data?.message || 'Failed to delete media mention');
    }
  };

  const handleStatusFilter = (value) => {
    setFilters({
      ...filters,
      status: value || undefined,
    });
  };

  const handleTypeFilter = (value) => {
    setFilters({
      ...filters,
      newsType: value || undefined,
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
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (text, record) => (
        <Link to={`/admin/media-mentions/edit/${record._id}`} className="text-blue-600 hover:underline">
          {text}
        </Link>
      ),
    },
    {
      title: 'Publisher',
      dataIndex: 'publisherName',
      key: 'publisherName',
    },
    {
      title: 'Type',
      dataIndex: 'newsType',
      key: 'newsType',
      filters: [
        { text: 'Print', value: 'print' },
        { text: 'Digital', value: 'digital' },
        { text: 'Video', value: 'video' },
        { text: 'Press Release', value: 'press_release' },
      ],
      render: (type) => {
        const typeMap = {
          print: { color: 'blue', label: 'Print' },
          digital: { color: 'green', label: 'Digital' },
          video: { color: 'purple', label: 'Video' },
          press_release: { color: 'orange', label: 'Press Release' },
        };
        const config = typeMap[type] || { color: 'default', label: type };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Draft', value: 'draft' },
        { text: 'Published', value: 'published' },
      ],
      render: (status) => {
        const color = status === 'published' ? 'green' : 'orange';
        return (
          <Tag color={color} className="capitalize">
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Featured',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      render: (isFeatured) => (
        isFeatured ? <StarFilled className="text-yellow-500" /> : <StarOutlined className="text-gray-400" />
      ),
    },
    {
      title: 'Published Date',
      dataIndex: 'publishedDate',
      key: 'publishedDate',
      sorter: true,
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/admin/media-mentions/edit/${record._id}`}>
            <Button type="link" icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Are you sure you want to delete this media mention?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-gray-900 dark:text-white font-bold">Media Mentions</h1>
        <Link to="/admin/media-mentions/new">
          <Button type="primary" icon={<PlusOutlined />}
          className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'>
            New Mention
          </Button>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <Search
              placeholder="Search mentions..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              className="w-full"
            />
          </div>
          <div className="flex gap-4 w-full md:w-1/2">
            <Select
              placeholder="Filter by status"
              allowClear
              onChange={handleStatusFilter}
              className="w-full"
            >
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
            </Select>
            <Select
              placeholder="Filter by type"
              allowClear
              onChange={handleTypeFilter}
              className="w-full"
            >
              <Option value="print">Print</Option>
              <Option value="digital">Digital</Option>
              <Option value="video">Video</Option>
              <Option value="press_release">Press Release</Option>
            </Select>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={mentions}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} mentions`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </div>
  );
};

export default MediaMentionList;
