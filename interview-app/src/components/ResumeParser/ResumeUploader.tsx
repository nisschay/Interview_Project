import React, { useState } from 'react';
import { Upload, Button, Space, Input, Spin, Alert, Card, message } from 'antd';
import { UploadOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';

type ParsedData = {
  name?: string;
  age?: string;
  gender?: string;
  phone?: string;
  email?: string;
  summary?: string;
  rawText?: string;
};

export default function ResumeUploader({ onResult }: { onResult: (data: ParsedData | null) => void }) {
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const uploadProps = {
    accept: '.pdf,.docx',
    multiple: false,
    showUploadList: false,
    customRequest: async (options: any) => {
      setError(null);
      setLoading(true);
      setFileName(options.file.name);
      
      try {
        console.log('🚀 Starting resume upload to backend...');
        
        // Check if backend is running
        try {
          const healthCheck = await fetch('http://localhost:3001/api/health');
          if (!healthCheck.ok) {
            throw new Error('Backend server not responding');
          }
          console.log('✅ Backend server is running');
        } catch (healthError) {
          console.error('❌ Backend server not available:', healthError);
          throw new Error('Backend server is not running. Please start the server with: cd server && node index.js');
        }

        const form = new FormData();
        form.append('file', options.file);
        
        console.log('📤 Sending file to backend:', options.file.name);
        
        const res = await fetch('http://localhost:3001/api/parse-resume', {
          method: 'POST',
          body: form
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Backend error:', errorText);
          throw new Error(`Server error (${res.status}): ${errorText}`);
        }
        
        const data = await res.json();
        console.log('✅ Received parsed data from backend:', data);
        
        if (!data.name && !data.email && !data.phone) {
          console.warn('⚠️ No meaningful data extracted, check the resume format');
          message.warning('Limited information could be extracted from the resume. Please verify the content.');
        } else {
          message.success('Resume parsed successfully with AI!');
        }
        
        setParsed(data);
        options.onSuccess?.(data);
        onResult(data);
        
      } catch (err: any) {
        console.error('❌ Upload error:', err);
        setError(err.message || 'Upload failed');
        
        // Show user-friendly error message
        if (err.message.includes('Backend server')) {
          message.error('Backend server not running. Please start the server first.');
        } else if (err.message.includes('CORS')) {
          message.error('Connection error. Check if backend server is running on port 3001.');
        } else {
          message.error('Failed to parse resume. Please try again.');
        }
        
        options.onError?.(err);
        onResult(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFieldChange = (field: keyof ParsedData, value: string) => {
    if (!parsed) return;
    const updated = { ...parsed, [field]: value };
    setParsed(updated);
  };

  const handleConfirm = () => {
    if (parsed) {
      console.log('✅ User confirmed parsed data:', parsed);
      onResult(parsed);
      message.success('Resume details confirmed!');
    }
  };

  const handleRemove = () => {
    setParsed(null);
    setError(null);
    setFileName('');
    onResult(null);
    message.info('Resume removed');
  };

  if (parsed) {
    return (
      <Card 
        title="📄 Resume Parsed with AI" 
        size="small" 
        style={{ 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: '8px'
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            File: {fileName} • AI extracted the following information:
          </div>
          
          <Input
            size="small"
            placeholder="Full Name"
            value={parsed.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            style={{ marginBottom: '6px' }}
          />
          
          <Space style={{ width: '100%' }}>
            <Input
              size="small"
              placeholder="Age"
              value={parsed.age || ''}
              onChange={(e) => handleFieldChange('age', e.target.value)}
              style={{ width: '80px' }}
            />
            <Input
              size="small"
              placeholder="Gender"
              value={parsed.gender || ''}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              style={{ flex: 1 }}
            />
          </Space>
          
          <Input
            size="small"
            placeholder="Phone Number"
            value={parsed.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            style={{ marginBottom: '6px' }}
          />
          
          <Input
            size="small"
            placeholder="Email Address"
            value={parsed.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            style={{ marginBottom: '8px' }}
          />

          <Space>
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckOutlined />} 
              onClick={handleConfirm}
            >
              Confirm Details
            </Button>
            <Button 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={handleRemove}
            >
              Remove
            </Button>
          </Space>
        </Space>
      </Card>
    );
  }

  return (
    <div>
      <Upload {...uploadProps}>
        <Button 
          icon={<UploadOutlined />} 
          size="large" 
          loading={loading}
          style={{ 
            width: '100%', 
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            border: '2px dashed #d9d9d9',
            borderRadius: '8px'
          }}
        >
          <div>
            {loading ? (
              <>
                <Spin size="small" style={{ marginBottom: '8px' }} />
                <div>Parsing with AI...</div>
                <div style={{ fontSize: '12px', color: '#999' }}>Using Gemini to extract information</div>
              </>
            ) : (
              <>
                <div>Click to Upload Resume</div>
                <div style={{ fontSize: '14px', color: '#999' }}>PDF or DOCX • AI will extract details</div>
              </>
            )}
          </div>
        </Button>
      </Upload>

      {error && (
        <Alert 
          type="error" 
          message="Upload Failed" 
          description={error} 
          style={{ marginTop: '12px' }}
          showIcon 
        />
      )}
    </div>
  );
}