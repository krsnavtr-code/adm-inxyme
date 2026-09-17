import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, message, Card, Spin, Space, Select, DatePicker, Switch, InputNumber } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons';
import { getAwardById, createAward, updateAward } from '../../api/awardApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const AwardForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationLogo, setOrganizationLogo] = useState('');
  const [awardImage, setAwardImage] = useState('');

  // Fetch award data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode) {
        return;
      }
      
      try {
        setLoading(true);
        const response = await getAwardById(id);
        const award = response.data?.award || response.award;
        
        setOrganizationLogo(award.organizationLogo || '');
        setAwardImage(award.awardImage || '');
        
        form.setFieldsValue({
          title: award.title,
          organizationName: award.organizationName,
          organizationLogo: award.organizationLogo,
          awardCategory: award.awardCategory || 'recognition',
          awardDate: award.awardDate ? dayjs(award.awardDate) : dayjs(),
          description: award.description,
          awardImage: award.awardImage,
          externalLink: award.externalLink,
          recipientName: award.recipientName,
          recipientRole: award.recipientRole,
          status: award.status || 'draft',
          isFeatured: award.isFeatured || false,
          displayOrder: award.displayOrder || 0,
          slug: award.slug,
        });
      } catch (error) {
        console.error('Error fetching award:', error);
        message.error('Failed to load award data');
        navigate('/admin/awards');
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
      
      const awardData = {
        ...values,
        awardDate: values.awardDate ? values.awardDate.toISOString() : new Date().toISOString(),
        organizationLogo: organizationLogo || '',
        awardImage: awardImage || '',
      };

      if (isEditMode) {
        await updateAward(id, awardData);
        message.success('Award updated successfully');
      } else {
        await createAward(awardData);
        message.success('Award created successfully');
      }
      
      navigate('/admin/awards');
    } catch (error) {
      console.error('Error saving award:', error);
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} award`);
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center mb-6">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/awards')}
          className="mr-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Back to Awards
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isEditMode ? 'Edit Award' : 'Create New Award'}
        </h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'draft',
          awardCategory: 'recognition',
          isFeatured: false,
          displayOrder: 0,
          awardDate: dayjs(),
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card 
              title="Basic Information" 
              className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              headStyle={{
                borderBottom: '1px solid #e5e7eb',
                color: '#1f2937',
              }}
              bodyStyle={{
                color: '#1f2937',
              }}
            >
              <Form.Item
                name="title"
                label="Award Title"
                rules={[
                  { required: true, message: 'Please enter a title' },
                  { max: 200, message: 'Title cannot exceed 200 characters' },
                ]}
              >
                <Input 
                  placeholder="Enter the award title" 
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>

              <Form.Item
                name="organizationName"
                label="Organization Name"
                rules={[
                  { required: true, message: 'Please enter the organization name' },
                ]}
              >
                <Input 
                  placeholder="e.g., Education Excellence Awards, Innovation Summit" 
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>

              <Form.Item
                name="awardCategory"
                label="Award Category"
                rules={[{ required: true, message: 'Please select an award category' }]}
              >
                <Select className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <Option value="excellence">Excellence Award</Option>
                  <Option value="innovation">Innovation Award</Option>
                  <Option value="leadership">Leadership Award</Option>
                  <Option value="recognition">Recognition</Option>
                  <Option value="achievement">Achievement</Option>
                  <Option value="partnership">Partnership</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="awardDate"
                label="Award Date"
                rules={[{ required: true, message: 'Please select the award date' }]}
              >
                <DatePicker 
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  format="YYYY-MM-DD"
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: 'Please enter a description' },
                  { max: 1000, message: 'Description cannot exceed 1000 characters' },
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="A detailed description of the award and achievement"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>
            </Card>

            <Card 
              title="Recipient Information" 
              className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              headStyle={{
                borderBottom: '1px solid #e5e7eb',
                color: '#1f2937',
              }}
              bodyStyle={{
                color: '#1f2937',
              }}
            >
              <Form.Item
                name="recipientName"
                label="Recipient Name"
              >
                <Input 
                  placeholder="Name of the person/team who received the award"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>

              <Form.Item
                name="recipientRole"
                label="Recipient Role"
              >
                <Input 
                  placeholder="Role or designation of the recipient"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>
            </Card>

            <Card 
              title="Media & Links" 
              className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              headStyle={{
                borderBottom: '1px solid #e5e7eb',
                color: '#1f2937',
              }}
              bodyStyle={{
                color: '#1f2937',
              }}
            >
              <Form.Item label="Organization Logo URL">
                <Input
                  placeholder="Enter organization logo URL"
                  value={organizationLogo}
                  onChange={(e) => setOrganizationLogo(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {organizationLogo && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Preview:</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <img 
                        src={organizationLogo} 
                        alt="Organization Logo" 
                        className="max-h-20 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-red-500 text-sm">Image failed to load</div>
                    </div>
                  </div>
                )}
              </Form.Item>

              <Form.Item label="Award Image URL">
                <Input
                  placeholder="Enter award image/certificate URL"
                  value={awardImage}
                  onChange={(e) => setAwardImage(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {awardImage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Preview:</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <img 
                        src={awardImage} 
                        alt="Award Image" 
                        className="max-h-40 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="hidden text-red-500 text-sm">Image failed to load</div>
                    </div>
                  </div>
                )}
              </Form.Item>

              <Form.Item
                name="externalLink"
                label="External Link"
              >
                <Input 
                  placeholder="https://example.com/award-details"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>
            </Card>
          </div>

          <div className="space-y-6">
            <Card 
              title="Publishing Options" 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              headStyle={{
                borderBottom: '1px solid #e5e7eb',
                color: '#1f2937',
              }}
              bodyStyle={{
                color: '#1f2937',
              }}
            >
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <Option value="draft">Draft</Option>
                  <Option value="published">Published</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="isFeatured"
                label="Featured Award"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Featured" 
                  unCheckedChildren="Not Featured"
                />
              </Form.Item>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Featured awards are highlighted on the awards page
              </p>

              <Form.Item
                name="displayOrder"
                label="Display Order"
                rules={[{ required: true, message: 'Please enter display order' }]}
              >
                <InputNumber 
                  min={0} 
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0"
                />
              </Form.Item>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lower numbers appear first
              </p>
            </Card>

            <Card 
              title="SEO Settings" 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              headStyle={{
                borderBottom: '1px solid #e5e7eb',
                color: '#1f2937',
              }}
              bodyStyle={{
                color: '#1f2937',
              }}
            >
              <Form.Item
                name="slug"
                label="URL Slug"
              >
                <Input 
                  placeholder="award-title-slug"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Leave empty to auto-generate from title
              </p>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {isEditMode ? 'Update Award' : 'Create Award'}
              </Button>
              
              <Button
                onClick={() => navigate('/admin/awards')}
                size="large"
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default AwardForm;