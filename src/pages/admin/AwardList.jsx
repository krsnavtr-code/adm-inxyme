import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Space, Tag, message, Popconfirm, Input, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { getAwards, deleteAward } from '../../api/awardApi';

const { Search } = Input;
const { Option } = Select;

const AwardList = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined,
    awardCategory: undefined,
    search: '',
  });

  const fetchAwards = async (params = {}) => {
    try {
      setLoading(true);
      const { current, pageSize } = pagination;
      const queryParams = {
        page: params.pagination?.current || current,
        limit: params.pagination?.pageSize || pageSize,
        status: filters.status,
        awardCategory: filters.awardCategory,
        search: filters.search,
        ...params,
      };

      const response = await getAwards(queryParams);
      
      setAwards(response.data?.awards || []);
      setPagination({
        ...pagination,
        total: response.data?.total || 0,
        current: response.data?.currentPage || 1,
      });
    } catch (error) {
      console.error('Error fetching awards:', error);
      message.error('Failed to fetch awards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwards();
  }, [filters]);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchAwards({
      pagination,
      ...filters,
      ...(sorter.field && {
        sortBy: `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`,
      }),
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteAward(id);
      message.success('Award deleted successfully');
      fetchAwards();
    } catch (error) {
      console.error('Error deleting award:', error);
      message.error(error.response?.data?.message || 'Failed to delete award');
    }
  };

  const handleStatusFilter = (value) => {
    setFilters({
      ...filters,
      status: value || undefined,
    });
  };

  const handleCategoryFilter = (value) => {
    setFilters({
      ...filters,
      awardCategory: value || undefined,
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
        <Link to={`/admin/awards/edit/${record._id}`} className="text-blue-600 hover:underline">
          {text}
        </Link>
      ),
    },
    {
      title: 'Organization',
      dataIndex: 'organizationName',
      key: 'organizationName',
    },
    {
      title: 'Category',
      dataIndex: 'awardCategory',
      key: 'awardCategory',
      filters: [
        { text: 'Excellence', value: 'excellence' },
        { text: 'Innovation', value: 'innovation' },
        { text: 'Leadership', value: 'leadership' },
        { text: 'Recognition', value: 'recognition' },
        { text: 'Achievement', value: 'achievement' },
        { text: 'Partnership', value: 'partnership' },
        { text: 'Other', value: 'other' },
      ],
      render: (category) => {
        const categoryMap = {
          excellence: { color: 'gold', label: 'Excellence' },
          innovation: { color: 'purple', label: 'Innovation' },
          leadership: { color: 'blue', label: 'Leadership' },
          recognition: { color: 'green', label: 'Recognition' },
          achievement: { color: 'orange', label: 'Achievement' },
          partnership: { color: 'cyan', label: 'Partnership' },
          other: { color: 'default', label: 'Other' },
        };
        const config = categoryMap[category] || { color: 'default', label: category };
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
      title: 'Award Date',
      dataIndex: 'awardDate',
      key: 'awardDate',
      sorter: true,
      render: (date) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
    {
      title: 'Display Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      sorter: true,
      render: (order) => order || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Link to={`/admin/awards/edit/${record._id}`}>
            <Button type="link" icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Are you sure you want to delete this award?"
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
        <h1 className="text-2xl text-gray-900 dark:text-white font-bold">Awards</h1>
        <Link to="/admin/awards/new">
          <Button type="primary" icon={<PlusOutlined />}
          className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'>
            New Award
          </Button>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <Search
              placeholder="Search awards..."
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
              placeholder="Filter by category"
              allowClear
              onChange={handleCategoryFilter}
              className="w-full"
            >
              <Option value="excellence">Excellence</Option>
              <Option value="innovation">Innovation</Option>
              <Option value="leadership">Leadership</Option>
              <Option value="recognition">Recognition</Option>
              <Option value="achievement">Achievement</Option>
              <Option value="partnership">Partnership</Option>
              <Option value="other">Other</Option>
            </Select>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={awards}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Total ${total} awards`,
          }}
          onChange={handleTableChange}
        />
      </div>
    </div>
  );
};

export default AwardList;