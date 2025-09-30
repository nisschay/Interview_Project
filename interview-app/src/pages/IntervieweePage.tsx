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
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [parsedConfirmed, setParsedConfirmed] = useState(false);

  const handleStartInterview = async () => {
    if (!jobDescription.trim()) {
      return;
    }
    
    dispatch(setJobDescription(jobDescription));
    dispatch(startInterview());
    
    dispatch(addMessage({
      type: 'ai',
      content: `Welcome to your ${interviewType} interview! I've analyzed your resume and the job description. Let me generate your first question...`
    }));

    try {
      const response = await aiService.generateQuestion(
        parsedResume?.rawText || null,
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

  const handleSendAnswer = () => {
    if (currentAnswer.trim()) {
      dispatch(addMessage({
        type: 'user',
        content: currentAnswer
      }));
      setCurrentAnswer('');
      
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
    dispatch(setResumeContent(parsedResume.rawText || ''));
    setResumeFile(parsedResume);
    setParsedConfirmed(true);
  };

  const canStart = jobDescription.trim() && (!parsedResume || parsedConfirmed);

  // Active Interview Layout - Dashboard Style
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

        <Row gutter={24}>
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

          <Col span={12}>
            <Row gutter={[0, 24]}>
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

  // COMPLETELY REDESIGNED SETUP FORM - FLEX FLOW DESIGN
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      gap: '20px'
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <Title level={1} style={{ 
          margin: 0,
          background: 'linear-gradient(135deg, #1890ff, #722ed1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '2.5rem'
        }}>
          <MessageOutlined style={{ marginRight: '16px', color: '#1890ff' }} />
          AI Technical Interview
        </Title>
        <Text style={{ 
          fontSize: '18px', 
          color: '#666',
          display: 'block',
          marginTop: '8px'
        }}>
          Configure your interview settings and upload your resume to get started
        </Text>
      </div>

      {/* Main Content - Flex Layout */}
      <div style={{
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        
        {/* Interview Settings Card */}
        <Card 
          title="🎯 Interview Settings" 
          style={{ 
            flex: '1 1 300px',
            minWidth: '300px',
            maxWidth: '400px'
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size="large">
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
        </Card>

        {/* Resume Upload Card */}
        <Card 
          title="📄 Upload Resume" 
          style={{ 
            flex: '1 1 300px',
            minWidth: '300px',
            maxWidth: '400px'
          }}
        >
          <ResumeUploader
            onResult={(parsed) => {
              setParsedResume(parsed);
              setParsedConfirmed(false);
            }}
          />

          {/* Parsed Resume Details */}
          {parsedResume && (
            <div style={{ marginTop: '16px' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Text strong>Review & Edit Details:</Text>
                
                <Input
                  placeholder="Full Name"
                  value={parsedResume.name || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, name: e.target.value })}
                />
                
                <Row gutter={8}>
                  <Col span={12}>
                    <Input
                      placeholder="Age"
                      value={parsedResume.age || ''}
                      onChange={(e) => setParsedResume({ ...parsedResume, age: e.target.value })}
                    />
                  </Col>
                  <Col span={12}>
                    <Input
                      placeholder="Gender"
                      value={parsedResume.gender || ''}
                      onChange={(e) => setParsedResume({ ...parsedResume, gender: e.target.value })}
                    />
                  </Col>
                </Row>
                
                <Input
                  placeholder="Phone Number"
                  value={parsedResume.phone || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, phone: e.target.value })}
                />
                
                <Input
                  placeholder="Email Address"
                  value={parsedResume.email || ''}
                  onChange={(e) => setParsedResume({ ...parsedResume, email: e.target.value })}
                />

                <Space>
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />} 
                    onClick={handleConfirmParsed}
                    disabled={parsedConfirmed}
                  >
                    {parsedConfirmed ? 'Confirmed ✓' : 'Confirm Details'}
                  </Button>
                  <Button 
                    onClick={() => { 
                      setParsedResume(null); 
                      setParsedConfirmed(false); 
                    }}
                  >
                    Remove
                  </Button>
                </Space>

                {!parsedConfirmed && (
                  <Alert
                    message="Please confirm parsed details before starting"
                    type="info"
                    showIcon
                  />
                )}
              </Space>
            </div>
          )}
        </Card>

        {/* Job Description Card */}
        <Card 
          title="💼 Job Description" 
          style={{ 
            flex: '1 1 300px',
            minWidth: '300px',
            maxWidth: '400px'
          }}
        >
          <TextArea
            value={jobDescription}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the job description here...

Example:
- Software Engineer position
- 3+ years experience required
- Knowledge of React, Node.js
- Strong problem-solving skills"
            rows={12}
            style={{ 
              fontSize: '14px', 
              lineHeight: '1.6',
              resize: 'vertical'
            }}
          />
        </Card>
      </div>

      {/* Validation Alerts */}
      {!jobDescription.trim() && (
        <Alert
          message="Job description is required to start the interview"
          type="warning"
          showIcon
          style={{ margin: '0 auto', maxWidth: '600px' }}
        />
      )}

      {parsedResume && !parsedConfirmed && (
        <Alert
          message="Please confirm your parsed resume details before starting"
          type="info"
          showIcon
          style={{ margin: '0 auto', maxWidth: '600px' }}
        />
      )}

      {/* Start Interview Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleStartInterview}
          disabled={!canStart}
          style={{ 
            height: '60px',
            fontSize: '18px',
            fontWeight: '600',
            paddingLeft: '32px',
            paddingRight: '32px',
            borderRadius: '12px',
            background: canStart ? 'linear-gradient(135deg, #1890ff, #722ed1)' : undefined,
            border: 'none'
          }}
        >
          Start AI Interview
        </Button>
      </div>
    </div>
  );
};

export default IntervieweePage;