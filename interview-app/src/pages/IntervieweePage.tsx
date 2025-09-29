import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Upload, Select, Typography, Space, Alert, Row, Col, Table, Tag, Timeline } from 'antd';
import { MessageOutlined, UploadOutlined, PlayCircleOutlined, StopOutlined, SendOutlined, ClockCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { startInterview, endInterview, addMessage, setResumeContent, setJobDescription, setInterviewConfig } from '../store/slices/interviewSlice';
import ChatInterface from '../components/Chat/ChatInterface';
import aiService from '../services/aiService';
import ResumeUploader from '../components/ResumeParser/ResumeUploader';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const IntervieweePage: React.FC = () => {
  const dispatch = useDispatch();
  const { isActive, interviewType, difficulty, progress, messages } = useSelector(
    (state: RootState) => state.interview
  );

  const [jobDescription, setJobDesc] = useState('');
  const [resumeFile, setResumeFile] = useState<any>(null);
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [parsedConfirmed, setParsedConfirmed] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');

  const handleStartInterview = async () => {
    if (!jobDescription.trim()) {
      return;
    }
    
    dispatch(setJobDescription(jobDescription));
    dispatch(startInterview());
    
    // Add welcome message
    dispatch(addMessage({
      type: 'ai',
      content: `Welcome to your ${interviewType} interview! I've analyzed your resume and the job description. Let me generate your first question...`
    }));

    // Generate first question using AI service
    try {
      const response = await aiService.generateQuestion(
        null, // resume content would be parsed here
        jobDescription,
        interviewType,
        difficulty,
        []
      );
      
      setTimeout(() => {
        dispatch(addMessage({
          type: 'ai',
          content: response.content
        }));
      }, 1500);
    } catch (error) {
      console.error('Error generating question:', error);
      setTimeout(() => {
        dispatch(addMessage({
          type: 'ai',
          content: 'Let\'s start with a basic question: Can you tell me about your experience with software development?'
        }));
      }, 1500);
    }
  };

  const handleEndInterview = () => {
    dispatch(endInterview());
  };

  const handleConfigChange = (field: string, value: any) => {
    const config = {
      type: interviewType,
      difficulty,
      totalQuestions: progress.totalQuestions
    };
    
    if (field === 'type') config.type = value;
    if (field === 'difficulty') config.difficulty = value;
    if (field === 'totalQuestions') config.totalQuestions = value;
    
    dispatch(setInterviewConfig(config));
  };

  const handleFileUpload = (info: any) => {
    if (info.file.status === 'done') {
      // In a real app, you'd parse the file here
      setResumeFile(info.file);
      dispatch(setResumeContent('Resume content would be parsed here'));
    }
  };

  const handleSendAnswer = () => {
    if (currentAnswer.trim()) {
      dispatch(addMessage({
        type: 'user',
        content: currentAnswer
      }));
      setCurrentAnswer('');
      
      // Generate next question
      setTimeout(() => {
        dispatch(addMessage({
          type: 'ai',
          content: 'Thank you for your answer. Let me ask you another question...'
        }));
      }, 1000);
    }
  };

  const handleConfirmParsed = () => {
    if (!parsedResume) return;
    // save raw text to redux so AI can use it
    dispatch(setResumeContent(parsedResume.rawText || ''));
    setResumeFile(parsedResume);
    setParsedConfirmed(true);
  };

  // ensure start requires parsed confirmation if resume uploaded
  const canStart = jobDescription.trim() && (!parsedResume || parsedConfirmed);

  // Active Interview Layout - Dashboard Style like Interviewer
  if (isActive) {
    const messageTableData = messages.map((msg, index) => ({
      key: index,
      time: new Date().toLocaleTimeString(),
      type: msg.type === 'ai' ? 'AI' : 'You',
      content: msg.content.length > 100 ? `${msg.content.substring(0, 100)}...` : msg.content
    }));

    const messageTableColumns = [
      {
        title: 'Time',
        dataIndex: 'time',
        key: 'time',
        width: 100,
      },
      {
        title: 'From',
        dataIndex: 'type',
        key: 'type',
        width: 80,
        render: (type: string) => (
          <Tag color={type === 'AI' ? 'blue' : 'green'}>{type}</Tag>
        ),
      },
      {
        title: 'Message',
        dataIndex: 'content',
        key: 'content',
      },
    ];

    const timelineItems = messages.map((msg, index) => ({
      color: msg.type === 'ai' ? 'blue' : 'green',
      children: (
        <div>
          <Text strong>{msg.type === 'ai' ? 'AI Interviewer' : 'Your Answer'}</Text>
          <br />
          <Text type="secondary">{msg.content.substring(0, 80)}...</Text>
        </div>
      ),
    }));

    return (
      <div style={{ padding: '24px' }}>
        {/* Stats Cards Row - Same as Interviewer Dashboard */}
        <Row gutter={24} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                  ✓ Active
                </Title>
                <Text type="secondary">Interview Status</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>
                  {progress.questionsAsked} / {progress.totalQuestions}
                </Title>
                <Text type="secondary">Questions Progress</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>
                  {Math.round((progress.questionsAsked / progress.totalQuestions) * 100)}%
                </Title>
                <Text type="secondary">Completion</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0 }}>
                  {messages.length}
                </Title>
                <Text type="secondary">Total Messages</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Content Row */}
        <Row gutter={24}>
          {/* Left Column - Chat Interface */}
          <Col span={12}>
            <Card title="Live Interview Chat" style={{ height: '500px' }}>
              <div style={{ 
                height: '350px', 
                overflowY: 'auto', 
                marginBottom: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '6px',
                padding: '12px'
              }}>
                {messages.map((message, index) => (
                  <div key={index} style={{ 
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '80%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: message.type === 'ai' ? '#e6f7ff' : '#f6ffed',
                      border: message.type === 'ai' ? '1px solid #91d5ff' : '1px solid #b7eb8f'
                    }}>
                      <Text strong style={{ fontSize: '12px', color: '#666' }}>
                        {message.type === 'ai' ? '🤖 AI Interviewer' : '👤 You'}
                      </Text>
                      <div style={{ marginTop: '4px' }}>
                        <Text>{message.content}</Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Answer Input */}
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here... (Press Ctrl+Enter to send)"
                  rows={2}
                  onPressEnter={(e) => {
                    if (e.ctrlKey) {
                      handleSendAnswer();
                    }
                  }}
                />
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={handleSendAnswer}
                  style={{ height: '64px' }}
                >
                  Send
                </Button>
              </Space.Compact>
            </Card>
          </Col>

          {/* Right Column - Interview Info */}
          <Col span={12}>
            <Row gutter={[0, 24]}>
              {/* Configuration Card */}
              <Col span={24}>
                <Card title="Interview Configuration">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div>
                        <Text strong>Type:</Text>
                        <br />
                        <Tag color="blue" style={{ textTransform: 'capitalize' }}>
                          {interviewType}
                        </Tag>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text strong>Difficulty:</Text>
                        <br />
                        <Tag color="orange" style={{ textTransform: 'capitalize' }}>
                          {difficulty}
                        </Tag>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div>
                        <Text strong>Progress:</Text>
                        <br />
                        <Text style={{ fontSize: '16px', fontWeight: 'bold' }}>
                          {Math.round((progress.questionsAsked / progress.totalQuestions) * 100)}%
                        </Text>
                      </div>
                    </Col>
                  </Row>
                  
                  <Button 
                    type="primary" 
                    danger 
                    icon={<StopOutlined />}
                    onClick={handleEndInterview}
                    style={{ width: '100%', marginTop: '16px' }}
                    size="large"
                  >
                    End Interview
                  </Button>
                </Card>
              </Col>

              {/* Timeline Card */}
              <Col span={24}>
                <Card title="Interview Timeline" style={{ height: '280px' }}>
                  <div style={{ height: '200px', overflowY: 'auto' }}>
                    <Timeline items={timelineItems} />
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Bottom Row - Message History Table */}
        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card title="Message History">
              <Table
                dataSource={messageTableData}
                columns={messageTableColumns}
                pagination={{ pageSize: 5, size: 'small' }}
                size="small"
                scroll={{ y: 200 }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Setup Form - Same as before
  return (
    <div style={{
      padding: '40px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100%'
    }}>
      <Card style={{
        width: '100%',
        maxWidth: '900px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            <MessageOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            AI Technical Interview
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Configure your interview settings and upload your resume to get started
          </Text>
        </div>

        {/* Form Grid - Responsive */}
        <div style={{
          display: 'grid',
          gap: '32px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
        }}>
          
          {/* Interview Settings */}
          <div>
            <Title level={4} style={{ marginBottom: '16px' }}>Interview Settings</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Interview Type</Text>
                <Select
                  value={interviewType}
                  onChange={(value) => handleConfigChange('type', value)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="technical">Technical</Option>
                  <Option value="behavioral">Behavioral</Option>
                  <Option value="mixed">Mixed</Option>
                </Select>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Difficulty Level</Text>
                <Select
                  value={difficulty}
                  onChange={(value) => handleConfigChange('difficulty', value)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="junior">Junior</Option>
                  <Option value="mid">Mid-Level</Option>
                  <Option value="senior">Senior</Option>
                </Select>
              </div>
              
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>Total Questions</Text>
                <Select
                  value={progress.totalQuestions}
                  onChange={(value) => handleConfigChange('totalQuestions', value)}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value={5}>5 Questions</Option>
                  <Option value={10}>10 Questions</Option>
                  <Option value={15}>15 Questions</Option>
                  <Option value={20}>20 Questions</Option>
                </Select>
              </div>
            </Space>
          </div>

          {/* Resume Upload -> replaced with ResumeUploader */}
          <div>
            <Title level={4} style={{ marginBottom: '16px' }}>Upload Resume</Title>
            <ResumeUploader
              onResult={(parsed) => {
                setParsedResume(parsed);
                setParsedConfirmed(false);
              }}
            />

            {/* Show parsed fields for review/edit */}
            {parsedResume && (
              <div style={{ marginTop: 16, background: '#fafafa', padding: 12, borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Parsed details (edit if needed)</div>
                <Input
                  placeholder="Name"
                  value={parsedResume.name || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, name: e.target.value })}
                  style={{ marginBottom: 8 }}
                />
                <Input
                  placeholder="Age"
                  value={parsedResume.age || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, age: e.target.value })}
                  style={{ marginBottom: 8 }}
                />
                <Input
                  placeholder="Gender"
                  value={parsedResume.gender || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, gender: e.target.value })}
                  style={{ marginBottom: 8 }}
                />
                <Input
                  placeholder="Phone"
                  value={parsedResume.phone || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, phone: e.target.value })}
                  style={{ marginBottom: 8 }}
                />
                <Input
                  placeholder="Email"
                  value={parsedResume.email || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, email: e.target.value })}
                  style={{ marginBottom: 8 }}
                />

                <Space style={{ marginTop: 12 }}>
                  <Button type="primary" icon={<CheckOutlined />} onClick={handleConfirmParsed}>
                    Confirm & Save
                  </Button>
                  <Button onClick={() => { setParsedResume(null); setParsedConfirmed(false); setResumeFile(null); }}>
                    Remove
                  </Button>
                </Space>

                {!parsedConfirmed && (
                  <Alert
                    message="Please confirm parsed details before starting the interview"
                    type="info"
                    showIcon
                    style={{ marginTop: 12 }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Job Description - Full Width */}
        <div style={{ marginTop: '32px' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>Job Description</Title>
          <TextArea
            value={jobDescription}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the job description here..."
            rows={6}
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            size="large"
          />
        </div>

        {/* Warning */}
        {!jobDescription.trim() && (
          <Alert
            message="Please provide a job description to start the interview"
            type="warning"
            showIcon
            style={{ marginTop: '24px', borderRadius: '8px' }}
          />
        )}

        {/* Start Button - disabled until parsed details confirmed (if resume uploaded) */}
        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleStartInterview}
          disabled={!canStart}
          style={{ 
            width: '100%', 
            height: '50px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '8px',
            marginTop: '32px'
          }}
        >
          Start Interview
        </Button>
      </Card>
    </div>
  );
};

export default IntervieweePage;