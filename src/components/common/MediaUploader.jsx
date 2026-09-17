import { useState } from 'react';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

const MediaUploader = ({
  onImageUploadSuccess,
  onVideoUploadSuccess,
  className = '',
  imageLabel = 'Upload Image',
  videoLabel = 'Upload Video',
  maxImageSizeMB = 10,
  maxVideoSizeMB = 100
}) => {
  const [activeTab, setActiveTab] = useState('image');

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <Tabs 
        defaultValue="image" 
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image">
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image
            </span>
          </TabsTrigger>
          <TabsTrigger value="video">
            <span className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4" />
              Video
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="image" className="mt-4">
          <ImageUploader
            onUploadSuccess={onImageUploadSuccess}
            label={imageLabel}
            maxSizeMB={maxImageSizeMB}
          />
        </TabsContent>
        
        <TabsContent value="video" className="mt-4">
          <VideoUploader
            onUploadSuccess={onVideoUploadSuccess}
            label={videoLabel}
            maxSizeMB={maxVideoSizeMB}
          />
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {activeTab === 'image' ? (
          <p>Supported formats: JPG, PNG, WebP, GIF (Max {maxImageSizeMB}MB)</p>
        ) : (
          <p>Supported formats: MP4, WebM, MOV (Max {maxVideoSizeMB}MB)</p>
        )}
      </div>
    </div>
  );
};

export default MediaUploader;
