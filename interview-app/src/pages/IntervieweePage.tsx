import React, { useState } from 'react';
import { Card, Row, Col, Input, Button, Upload, Select, Divider, Typography, Space, Alert } from 'antd';
import { MessageOutlined, UploadOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { startInterview, endInterview, addMessage, setResumeContent, setJobDescription, setInterviewConfig } from '../store/slices/interviewSlice';
import ChatInterface from '../components/Chat/ChatInterface';
import aiService from '../services/aiService';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const IntervieweePage: React.FC = () => {
  const dispatch = useDispatch();
  const { isActive, interviewType, difficulty, progress } = useSelector(
    (state: RootState) => state.interview
  );

  const [jobDescription, setJobDesc] = useState('');
  const [resumeFile, setResumeFile] = useState<any>(null);

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

  if (isActive) {
    return (
      <div style={{ height: 'calc(100vh - 112px)' }}>
        <Row gutter={24} style={{ height: '100%' }}>
          <Col xs={24} lg={16} style={{ height: '100%' }}>
            <ChatInterface />
          </Col>
          <Col xs={24} lg={8} style={{ marginTop: 16 }}>
            <Card title="Interview Progress" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Questions: </Text>
                  <Text>{progress.questionsAsked} / {progress.totalQuestions}</Text>
                </div>
                <div>
                  <Text strong>Type: </Text>
                  <Text>{interviewType}</Text>
                </div>
                <div>
                  <Text strong>Difficulty: </Text>
                  <Text>{difficulty}</Text>
                </div>
                <Button 
                  type="primary" 
                  danger 
                  icon={<StopOutlined />} 
                  onClick={handleEndInterview}
                  style={{ marginTop: 16 }}
                >
                  End Interview
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <Card style={{
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.9)'
      }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>
              <MessageOutlined /> AI Technical Interview
            </Title>
            <Text type="secondary">
              Upload your resume and job description to start your AI-powered interview
            </Text>
          </div>

          <Divider />

          <Row gutter={24}>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4}>Interview Configuration</Title>
                
                <div>
                  <Text strong>Interview Type:</Text>
                  <Select
                    value={interviewType}
                    onChange={(value) => handleConfigChange('type', value)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="technical">Technical</Option>
                    <Option value="behavioral">Behavioral</Option>
                    <Option value="mixed">Mixed</Option>
                  </Select>
                </div>

                <div>
                  <Text strong>Difficulty Level:</Text>
                  <Select
                    value={difficulty}
                    onChange={(value) => handleConfigChange('difficulty', value)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value="junior">Junior</Option>
                    <Option value="mid">Mid-Level</Option>
                    <Option value="senior">Senior</Option>
                  </Select>
                </div>

                <div>
                  <Text strong>Total Questions:</Text>
                  <Select
                    value={progress.totalQuestions}
                    onChange={(value) => handleConfigChange('totalQuestions', value)}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Option value={5}>5 Questions</Option>
                    <Option value={10}>10 Questions</Option>
                    <Option value={15}>15 Questions</Option>
                    <Option value={20}>20 Questions</Option>
                  </Select>
                </div>
              </Space>
            </Col>

            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4}>Upload Documents</Title>
                
                <div>
                  <Text strong>Resume (PDF/DOCX):</Text>
                  <Upload
                    accept=".pdf,.docx"
                    onChange={handleFileUpload}
                    style={{ marginTop: 8, width: '100%' }}
                  >
                    <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
                      Upload Resume
                    </Button>
                  </Upload>
                  {resumeFile && (
                    <Text type="success" style={{ fontSize: 12 }}>
                      ✓ {resumeFile.name} uploaded
                    </Text>
                  )}
                </div>
              </Space>
            </Col>
          </Row>

          <div>
            <Text strong>Job Description:</Text>
            <TextArea
              value={jobDescription}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              style={{ marginTop: 8 }}
            />
          </div>

          {!jobDescription.trim() && (
            <Alert
              message="Please provide a job description to start the interview"
              type="warning"
              showIcon
            />
          )}

          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleStartInterview}
            disabled={!jobDescription.trim()}
            style={{ width: '100%' }}
          >
            Start Interview
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default IntervieweePage;