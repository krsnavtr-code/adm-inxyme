import React, { useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const RichTextEditor = ({ value, onChange, height = 500 }) => {
  const editorRef = useRef(null);
  
  // TinyMCE API key - you should get your own from TinyMCE
  const apiKey = 'your-api-key-here'; // Replace with your TinyMCE API key

  // Initialize TinyMCE
  useEffect(() => {
    // You can add any initialization code here if needed
    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div className="rich-text-editor">
      <Editor
        apiKey={apiKey}
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value}
        onEditorChange={onChange}
        init={{
          height: height,
          menubar: true,
          plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table paste code help wordcount'
          ],
          toolbar:
            'undo redo | formatselect | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        }}
      />
    </div>
  );
};

export default RichTextEditor;
