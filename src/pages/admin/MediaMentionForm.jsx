import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Button, message, Card, Spin, Space, Select, DatePicker, Switch, Upload } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { getMediaMentionById, createMediaMention, updateMediaMention } from '../../api/mediaMentionApi';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const MediaMentionForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publisherLogo, setPublisherLogo] = useState('');
  const [mediaUpload, setMediaUpload] = useState('');

  // Fetch mention data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode) {
        return;
      }
      
      try {
        setLoading(true);
        const response = await getMediaMentionById(id);
        const mention = response.data?.mention || response.mention;
        
        setPublisherLogo(mention.publisherLogo || '');
        setMediaUpload(mention.mediaUpload || '');
        
        form.setFieldsValue({
          title: mention.title,
          publisherName: mention.publisherName,
          publisherLogo: mention.publisherLogo,
          newsType: mention.newsType || 'digital',
          publishedDate: mention.publishedDate ? dayjs(mention.publishedDate) : dayjs(),
          shortDescription: mention.shortDescription,
          mediaUpload: mention.mediaUpload,
          externalLink: mention.externalLink,
          status: mention.status || 'draft',
          isFeatured: mention.isFeatured || false,
          slug: mention.slug,
        });
      } catch (error) {
        console.error('Error fetching mention:', error);
        message.error('Failed to load mention data');
        navigate('/admin/media-mentions');
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
      
      const mentionData = {
        ...values,
        publishedDate: values.publishedDate ? values.publishedDate.toISOString() : new Date().toISOString(),
        publisherLogo: publisherLogo || '',
        mediaUpload: mediaUpload || '',
      };

      if (isEditMode) {
        await updateMediaMention(id, mentionData);
        message.success('Media mention updated successfully');
      } else {
        await createMediaMention(mentionData);
        message.success('Media mention created successfully');
      }
      
      navigate('/admin/media-mentions');
    } catch (error) {
      console.error('Error saving mention:', error);
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} media mention`);
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
          onClick={() => navigate('/admin/media-mentions')}
          className="mr-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Back to Mentions
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isEditMode ? 'Edit Media Mention' : 'Create New Media Mention'}
        </h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'draft',
          newsType: 'digital',
          isFeatured: false,
          publishedDate: dayjs(),
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
                label="News Title"
                rules={[
                  { required: true, message: 'Please enter a title' },
                  { max: 200, message: 'Title cannot exceed 200 characters' },
                ]}
              >
                <Input 
                  placeholder="Enter the news article title" 
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>

              <Form.Item
                name="publisherName"
                label="Publisher Name"
                rules={[
                  { required: true, message: 'Please enter the publisher name' },
                ]}
              >
                <Input 
                  placeholder="e.g., Times of India, TechCrunch" 
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>

              <Form.Item
                name="newsType"
                label="News Type"
                rules={[{ required: true, message: 'Please select a news type' }]}
              >
                <Select className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <Option value="print">Print Media</Option>
                  <Option value="digital">Digital Article</Option>
                  <Option value="video">Video</Option>
                  <Option value="press_release">Press Release</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="publishedDate"
                label="Published Date"
                rules={[{ required: true, message: 'Please select the published date' }]}
              >
                <DatePicker 
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  format="YYYY-MM-DD"
                />
              </Form.Item>

              <Form.Item
                name="shortDescription"
                label="Short Description"
                rules={[
                  { required: true, message: 'Please enter a short description' },
                  { max: 500, message: 'Description cannot exceed 500 characters' },
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="A brief summary of the media mention (1-2 lines)"
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
              <Form.Item label="Publisher Logo URL">
                <Input
                  placeholder="Enter publisher logo URL"
                  value={publisherLogo}
                  onChange={(e) => setPublisherLogo(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {publisherLogo && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Preview:</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <img 
                        src={publisherLogo} 
                        alt="Publisher logo preview" 
                        className="max-w-full h-24 object-contain rounded mx-auto block"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </Form.Item>

              <Form.Item label="Media Upload URL (for Print/Scanned copies)">
                <Input
                  placeholder="Enter media upload URL (newspaper clipping, scanned copy)"
                  value={mediaUpload}
                  onChange={(e) => setMediaUpload(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {mediaUpload && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Preview:</p>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <img 
                        src={mediaUpload} 
                        alt="Media upload preview" 
                        className="max-w-full h-auto rounded mx-auto block"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </Form.Item>

              <Form.Item
                name="externalLink"
                label="External Link (for Digital/Video)"
              >
                <Input 
                  placeholder="https://example.com/article-link"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>
            </Card>
          </div>

          <div className="space-y-6">
            <Card 
              title="Publish Settings" 
              className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              headStyle={{
                borderBottom: '1px solid #e5e7eb',
                color: '#1f2937',
              }}
              bodyStyle={{
                color: '#1f2937',
              }}
            >
              <Form.Item name="status" label="Status">
                <Select className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <Option value="draft" className="dark:bg-gray-700 dark:text-white">Draft</Option>
                  <Option value="published" className="dark:bg-gray-700 dark:text-white">Published</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="isFeatured"
                label="Featured"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Featured mentions appear prominently on the Media Mentions page
              </p>

              <div className="flex justify-between mt-6">
                <Button 
                  onClick={() => navigate('/admin/media-mentions')}
                  className="dark:bg-gray-600 dark:border-gray-500 dark:text-white hover:dark:bg-gray-500"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  loading={saving}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {isEditMode ? 'Update' : 'Publish'}
                </Button>
              </div>
            </Card>

            <Card 
              title="Slug" 
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
                name="slug"
                label="URL Slug"
                help="Auto-generated from title. Leave empty to auto-generate."
              >
                <Input 
                  placeholder="media-mention-slug"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </Form.Item>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default MediaMentionForm;
