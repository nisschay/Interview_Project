import React from 'react';
import { Card, Row, Col, Statistic, Typography, Timeline, Table, Progress, Space, Tag } from 'antd';
import { UserOutlined, QuestionCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

const { Text } = Typography;

const InterviewerPage: React.FC = () => {
  const { isActive, messages, progress, interviewType, difficulty } = useSelector(
    (state: RootState) => state.interview
  );

  const messageColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (timestamp: Date) => new Date(timestamp).toLocaleTimeString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'ai' ? 'blue' : 'green'}>
          {type === 'ai' ? 'AI' : 'User'}
        </Tag>
      ),
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
  ];

  const progressPercentage = progress.totalQuestions > 0 
    ? (progress.questionsAsked / progress.totalQuestions) * 100 
    : 0;

  return (
    <div>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Interview Status"
              value={isActive ? 'Active' : 'Not Started'}
              prefix={isActive ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ClockCircleOutlined />}
              valueStyle={{ color: isActive ? '#52c41a' : '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Questions Asked"
              value={progress.questionsAsked}
              suffix={`/ ${progress.totalQuestions}`}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Progress"
              value={progressPercentage}
              precision={1}
              suffix="%"
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Messages"
              value={messages.length}
              prefix={<QuestionCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="Interview Messages" style={{ minHeight: 500 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">No interview messages yet</Text>
              </div>
            ) : (
              <Table
                dataSource={messages.map((msg: any) => ({ ...msg, key: msg.id }))}
                columns={messageColumns}
                pagination={{ pageSize: 10 }}
                scroll={{ y: 400 }}
              />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="Interview Configuration">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Type: </Text>
                  <Tag color="blue">{interviewType}</Tag>
                </div>
                <div>
                  <Text strong>Difficulty: </Text>
                  <Tag color="orange">{difficulty}</Tag>
                </div>
                <div style={{ marginTop: 16 }}>
                  <Text strong>Progress:</Text>
                  <Progress 
                    percent={progressPercentage} 
                    status={isActive ? 'active' : 'normal'}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
              </Space>
            </Card>

            <Card title="Interview Timeline">
              {messages.length === 0 ? (
                <Text type="secondary">No activity yet</Text>
              ) : (
                <Timeline
                  items={messages.slice(-5).map((msg: any) => ({
                    color: msg.type === 'ai' ? 'blue' : 'green',
                    children: (
                      <div key={msg.id}>
                        <Text strong>{msg.type === 'ai' ? 'AI' : 'Candidate'}</Text>
                        <br />
                        <Text ellipsis style={{ fontSize: 12 }}>
                          {msg.content.substring(0, 100)}
                          {msg.content.length > 100 ? '...' : ''}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default InterviewerPage;