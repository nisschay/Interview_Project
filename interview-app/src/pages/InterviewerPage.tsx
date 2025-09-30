import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Timeline, Table, Progress, Space, Tag, Button, Modal, Descriptions } from 'antd';
import { UserOutlined, QuestionCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { Message } from '../types';

const { Text, Title } = Typography;

const InterviewerPage: React.FC = () => {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const { 
    isActive, 
    messages, 
    progress, 
    interviewType, 
    difficulty,
    sessions,
    currentSessionId,
    candidateInfo
  } = useSelector((state: RootState) => state.interview);

  // Calculate statistics
  const progressPercentage = progress.totalQuestions > 0 
    ? Math.round((progress.questionsAsked / progress.totalQuestions) * 100) 
    : 0;

  const questionsAndAnswers = [];
  for (let i = 0; i < messages.length; i += 2) {
    const question = messages[i];
    const answer = messages[i + 1];
    if (question && question.type === 'ai' && !question.content.includes('Score:')) {
      questionsAndAnswers.push({
        question: question.content,
        answer: answer ? answer.content : 'No answer provided',
        score: answer ? answer.score : undefined,
        timestamp: question.timestamp,
        questionNumber: question.questionNumber || Math.floor(i / 2) + 1
      });
    }
  }

  // Table columns for message history
  const messageColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 100,
      render: (timestamp: Date) => new Date(timestamp).toLocaleTimeString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'ai' ? 'blue' : 'green'}>
          {type === 'ai' ? '🤖 AI' : '👤 User'}
        </Tag>
      ),
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => (
        <Text style={{ fontSize: '13px' }}>
          {content.length > 100 ? `${content.substring(0, 100)}...` : content}
        </Text>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score?: number) => (
        score ? (
          <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
            {score}/100
          </Tag>
        ) : null
      ),
    },
  ];

  // Sessions table for dashboard
  const sessionColumns = [
    {
      title: 'Candidate',
      dataIndex: 'candidateName',
      key: 'candidateName',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Start Time',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: Date) => new Date(time).toLocaleString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          paused: 'orange',
          completed: 'blue',
          cancelled: 'red'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Final Score',
      dataIndex: 'finalScore',
      key: 'finalScore',
      render: (score?: number) => (
        score ? (
          <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
            {score}/100
          </Tag>
        ) : <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedSession(record.id);
            setDetailModalVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Statistics */}
      <Row gutter={24} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Interview Status"
              value={isActive ? 'Active' : sessions.length > 0 ? 'Monitoring' : 'No Sessions'}
              prefix={
                isActive ? 
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                <ClockCircleOutlined />
              }
              valueStyle={{ 
                color: isActive ? '#52c41a' : sessions.length > 0 ? '#1890ff' : '#8c8c8c'
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={sessions.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Current Progress"
              value={progressPercentage}
              suffix="%"
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={progress.averageScore || 0}
              suffix="/100"
              prefix={<TrophyOutlined />}
              valueStyle={{ 
                color: progress.averageScore >= 80 ? '#52c41a' : 
                      progress.averageScore >= 60 ? '#faad14' : '#ff4d4f'
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Dashboard Content */}
      <Row gutter={24}>
        {/* Current Session Details */}
        <Col span={16}>
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                {isActive ? 'Live Interview Session' : 'Interview History'}
              </Space>
            }
            style={{ minHeight: 500 }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <UserOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <Title level={4} type="secondary">No interview activity yet</Title>
                <Text type="secondary">
                  Interview messages and progress will appear here when a session starts.
                </Text>
              </div>
            ) : (
              <>
                {/* Quick Stats for Current Session */}
                {isActive && (
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Questions Asked"
                          value={progress.questionsAsked}
                          suffix={`/ ${progress.totalQuestions}`}
                          valueStyle={{ fontSize: 16 }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic
                          title="Average Score"
                          value={progress.averageScore}
                          suffix="/100"
                          valueStyle={{ fontSize: 16 }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Progress</Text>
                        <Progress 
                          percent={progressPercentage} 
                          status={isActive ? 'active' : 'normal'}
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Message History Table */}
                <Table
                  dataSource={messages.map((msg: Message) => ({ ...msg, key: msg.id }))}
                  columns={messageColumns}
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                  scroll={{ y: 350 }}
                  size="small"
                />
              </>
            )}
          </Card>
        </Col>

        {/* Side Panel */}
        <Col span={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Current Session Info */}
            <Card title="Current Session" size="small">
              {currentSession ? (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Candidate">
                    {candidateInfo.name || 'Unknown'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {candidateInfo.email || 'Not provided'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">
                    <Tag color="blue" style={{ textTransform: 'capitalize' }}>
                      {interviewType}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Difficulty">
                    <Tag color="orange" style={{ textTransform: 'capitalize' }}>
                      {difficulty}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Questions">
                    {progress.totalQuestions} Total
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={isActive ? 'green' : 'default'}>
                      {isActive ? 'Active' : 'Completed'}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">No active session</Text>
              )}
            </Card>

            {/* Recent Activity Timeline */}
            <Card title="Recent Activity" size="small" style={{ maxHeight: 350, overflow: 'auto' }}>
              {messages.length === 0 ? (
                <Text type="secondary">No activity yet</Text>
              ) : (
                <Timeline
                  items={messages.slice(-6).map((msg: Message) => ({
                    color: msg.type === 'ai' ? 'blue' : 'green',
                    children: (
                      <div key={msg.id}>
                        <Text strong style={{ fontSize: 12 }}>
                          {msg.type === 'ai' ? '🤖 AI Interviewer' : '👤 Candidate'}
                          {msg.questionNumber && ` (Q${msg.questionNumber})`}
                        </Text>
                        <br />
                        <Text style={{ fontSize: 11, color: '#666' }}>
                          {msg.content.length > 80 ? `${msg.content.substring(0, 80)}...` : msg.content}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Text>
                        {msg.score && (
                          <>
                            <br />
                            <Tag 
                              color={msg.score >= 80 ? 'green' : msg.score >= 60 ? 'orange' : 'red'}
                            >
                              Score: {msg.score}/100
                            </Tag>
                          </>
                        )}
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>

            {/* Performance Summary */}
            {questionsAndAnswers.length > 0 && (
              <Card title="Performance Summary" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Questions Answered: </Text>
                    <Text>{questionsAndAnswers.length}</Text>
                  </div>
                  
                  <div>
                    <Text strong>Average Score: </Text>
                    <Tag color={progress.averageScore >= 80 ? 'green' : progress.averageScore >= 60 ? 'orange' : 'red'}>
                      {progress.averageScore}/100
                    </Tag>
                  </div>
                  
                  <div>
                    <Text strong>Progress: </Text>
                    <Progress 
                      size="small"
                      percent={progressPercentage}
                      status={progress.isCompleted ? 'success' : 'active'}
                    />
                  </div>
                </Space>
              </Card>
            )}
          </Space>
        </Col>
      </Row>

      {/* All Sessions Table */}
      {sessions.length > 0 && (
        <Row style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="All Interview Sessions">
              <Table
                dataSource={sessions.map(session => ({ ...session, key: session.id }))}
                columns={sessionColumns}
                pagination={{ pageSize: 5 }}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Session Detail Modal */}
      <Modal
        title={`Session Details: ${selectedSessionData?.candidateName || 'Unknown'}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedSessionData && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Candidate Name">
                {selectedSessionData.candidateName}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedSessionData.status === 'completed' ? 'green' : 'orange'}>
                  {selectedSessionData.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {new Date(selectedSessionData.startTime).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {selectedSessionData.endTime ? 
                  new Date(selectedSessionData.endTime).toLocaleString() : 
                  'In Progress'
                }
              </Descriptions.Item>
              <Descriptions.Item label="Final Score" span={2}>
                {selectedSessionData.finalScore ? 
                  <Tag color={selectedSessionData.finalScore >= 80 ? 'green' : 
                              selectedSessionData.finalScore >= 60 ? 'orange' : 'red'}>
                    {selectedSessionData.finalScore}/100
                  </Tag> : 
                  'Not completed'
                }
              </Descriptions.Item>
            </Descriptions>
            
            {selectedSessionData.summary && (
              <Card title="AI Summary" size="small">
                <Text>{selectedSessionData.summary}</Text>
              </Card>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default InterviewerPage;