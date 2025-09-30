import { useState } from 'react';
import { Upload, Button, Space, Input, Spin, Alert, Card, message, Row, Col, Typography, Tag, Select } from 'antd';
import { UploadOutlined, CheckOutlined, DeleteOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import type { ParsedResumeData } from '../../types';

const { Text, Title } = Typography;
const { Option } = Select;

interface ResumeUploaderProps {
  onResult: (data: ParsedResumeData | null) => void;
  onConfirm?: (data: ParsedResumeData) => void;
}

export default function ResumeUploader({ onResult, onConfirm }: ResumeUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);

  const uploadProps = {
    accept: '.pdf,.docx',
    multiple: false,
    showUploadList: false,
    customRequest: async (options: any) => {
      setError(null);
      setLoading(true);
      setFileName(options.file.name);
      setConfirmed(false);
      
      try {
        console.log('📄 Starting resume upload...', options.file.name);
        
        // Check backend availability
        try {
          const healthCheck = await fetch('http://localhost:3001/api/health');
          if (!healthCheck.ok) {
            throw new Error('Backend server not responding');
          }
        } catch (healthError) {
          console.error('❌ Backend server unavailable:', healthError);
          message.error('⚠️ Cannot connect to backend server on port 3001');
          throw new Error('Cannot connect to backend server. Please ensure server is running on port 3001');
        }

        const formData = new FormData();
        formData.append('file', options.file);
        
        console.log('📤 Sending resume to backend:', {
          url: 'http://localhost:3001/api/parse-resume',
          fileName: options.file.name,
          fileSize: options.file.size,
          fileType: options.file.type
        });
        
        const response = await fetch('http://localhost:3001/api/parse-resume', {
          method: 'POST',
          body: formData,
          mode: 'cors'
        });
        
        console.log('📥 Backend response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Resume parsed successfully:', data);
        
        // Validate parsed data
        if (!data.name && !data.email && !data.phone && !data.rawText) {
          message.warning('Could not extract meaningful information from the resume. Please check the file format.');
        } else {
          message.success('Resume parsed successfully with AI!');
        }
        
        setParsed(data);
        options.onSuccess?.(data);
        onResult(data);
        
      } catch (err: any) {
        console.error('❌ Upload error:', err);
        
        // More specific error handling
        let errorMessage = err.message || 'Failed to parse resume';
        
        if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
          errorMessage = 'Cannot connect to backend server.\n\nPlease check:\n1. Backend server is running on port 3001\n2. Run: cd server && node index.js';
          setError(errorMessage);
          message.error({
            content: 'Backend server not reachable. Check console for details.',
            duration: 5
          });
        } else if (err.message.includes('backend server')) {
          setError(errorMessage);
          message.error('Backend server connection failed. Please restart the server.');
        } else if (err.message.includes('CORS')) {
          setError('Connection blocked by CORS policy. Please check server configuration.');
          message.error('CORS error. Server may need restart.');
        } else {
          setError(errorMessage);
          message.error('Failed to parse resume. Please try again.');
        }
        
        options.onError?.(err);
        onResult(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFieldChange = (field: keyof ParsedResumeData, value: string) => {
    if (!parsed) return;
    const updated = { ...parsed, [field]: value };
    setParsed(updated);
    onResult(updated);
  };

  const handleConfirm = () => {
    if (parsed) {
      setConfirmed(true);
      onConfirm?.(parsed);
      message.success('Resume details confirmed!');
    }
  };

  const handleRemove = () => {
    setParsed(null);
    setError(null);
    setFileName('');
    setConfirmed(false);
    onResult(null);
    message.info('Resume removed');
  };

  // Render parsed resume editing interface
  if (parsed) {
    return (
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: '#52c41a' }} />
            <Text strong>Resume Parsed with AI</Text>
            {confirmed && <Tag color="green">Confirmed</Tag>}
          </Space>
        }
        size="small" 
        style={{ 
          backgroundColor: confirmed ? '#f6ffed' : '#fafafa',
          border: `1px solid ${confirmed ? '#b7eb8f' : '#d9d9d9'}`,
          borderRadius: '12px'
        }}
        extra={
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {fileName}
          </Text>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          
          {/* Personal Information Section */}
          <div>
            <Title level={5} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
              <UserOutlined /> Personal Information
            </Title>
            
            <Row gutter={12}>
              <Col span={24}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>Full Name</Text>
                <Input
                  size="middle"
                  placeholder="Enter full name"
                  value={parsed.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  style={{ marginTop: '4px', marginBottom: '8px' }}
                />
              </Col>
            </Row>
            
            <Row gutter={12}>
              <Col span={12}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>Age</Text>
                <Input
                  size="middle"
                  placeholder="Age"
                  value={parsed.age || ''}
                  onChange={(e) => handleFieldChange('age', e.target.value)}
                  style={{ marginTop: '4px' }}
                />
              </Col>
              <Col span={12}>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>Gender</Text>
                <Select
                  size="middle"
                  placeholder="Select gender"
                  value={parsed.gender || ''}
                  onChange={(value) => handleFieldChange('gender', value)}
                  style={{ marginTop: '4px', width: '100%' }}
                >
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                  <Option value="Prefer not to say">Prefer not to say</Option>
                </Select>
              </Col>
            </Row>
          </div>
          
          {/* Contact Information */}
          <div>
            <Text strong style={{ fontSize: '12px', color: '#666' }}>Phone Number</Text>
            <Input
              size="middle"
              placeholder="Phone number with country code"
              value={parsed.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              style={{ marginTop: '4px', marginBottom: '8px' }}
            />
            
            <Text strong style={{ fontSize: '12px', color: '#666' }}>Email Address</Text>
            <Input
              size="middle"
              placeholder="Email address"
              value={parsed.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              style={{ marginTop: '4px', marginBottom: '12px' }}
            />
          </div>
          
          {/* Professional Summary */}
          {parsed.summary && (
            <div>
              <Text strong style={{ fontSize: '12px', color: '#666' }}>Professional Summary</Text>
              <Input.TextArea
                size="middle"
                placeholder="Professional summary"
                value={parsed.summary || ''}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                rows={2}
                style={{ marginTop: '4px', marginBottom: '8px' }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <Row gutter={8}>
            <Col>
              <Button 
                type="primary" 
                size="middle" 
                icon={<CheckOutlined />} 
                onClick={handleConfirm}
                disabled={confirmed || !parsed.name || !parsed.email || !parsed.phone}
              >
                {confirmed ? 'Confirmed ✓' : 'Confirm Details'}
              </Button>
            </Col>
            <Col>
              <Button 
                size="middle" 
                icon={<DeleteOutlined />} 
                onClick={handleRemove}
              >
                Remove Resume
              </Button>
            </Col>
          </Row>

          {/* Missing Information Alert */}
          {!confirmed && (!parsed.name || !parsed.email || !parsed.phone) && (
            <Alert
              message="Missing Required Information"
              description="Please fill in the Name, Email, and Phone fields before confirming."
              type="warning"
              showIcon
              style={{ marginTop: '8px' }}
            />
          )}
        </Space>
      </Card>
    );
  }

  // Render upload interface
  return (
    <div>
      <Upload {...uploadProps}>
        <Button 
          icon={<UploadOutlined />} 
          size="large" 
          loading={loading}
          block
          style={{ 
            height: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            border: '2px dashed #d9d9d9',
            borderRadius: '12px',
            background: 'linear-gradient(145deg, #fafafa 0%, #f0f0f0 100%)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#1890ff';
            e.currentTarget.style.background = 'linear-gradient(145deg, #f0f9ff 0%, #e6f7ff 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d9d9d9';
            e.currentTarget.style.background = 'linear-gradient(145deg, #fafafa 0%, #f0f0f0 100%)';
          }}
        >
          <div style={{ textAlign: 'center' }}>
            {loading ? (
              <>
                <Spin size="default" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '16px', fontWeight: '500' }}>Parsing Resume with AI...</div>
                <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>
                  Using Gemini AI to extract information
                </div>
              </>
            ) : (
              <>
                <FileTextOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
                <div style={{ fontSize: '16px', fontWeight: '500' }}>Upload Resume</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  PDF or DOCX • AI will extract your details
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Click or drag file to upload
                </div>
              </>
            )}
          </div>
        </Button>
      </Upload>

      {error && (
        <Alert 
          type="error" 
          message="Resume Upload Failed" 
          description={
            <div>
              <p>{error}</p>
              {error.includes('Backend server') && (
                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                  <strong>To start the backend server:</strong>
                  <br />
                  1. Open a terminal
                  <br />
                  2. Run: <code>cd server && node index.js</code>
                  <br />
                  3. Try uploading again
                </div>
              )}
            </div>
          }
          style={{ marginTop: '16px' }}
          showIcon 
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Instructions */}
      <Card 
        size="small" 
        style={{ 
          marginTop: '16px', 
          backgroundColor: '#f0f9ff',
          border: '1px solid #b3d8ff'
        }}
      >
        <Space direction="vertical" size="small">
          <Text strong style={{ color: '#1890ff' }}>How it works:</Text>
          <Text style={{ fontSize: '13px' }}>
            1. Upload your PDF or DOCX resume
          </Text>
          <Text style={{ fontSize: '13px' }}>
            2. Our AI will extract your personal information
          </Text>
          <Text style={{ fontSize: '13px' }}>
            3. Review and edit the details if needed
          </Text>
          <Text style={{ fontSize: '13px' }}>
            4. Confirm to proceed with the interview
          </Text>
        </Space>
      </Card>
    </div>
  );
}