import React, { useState } from 'react';
import { Layout, Tabs, Button, Space, Typography, Badge, Modal } from 'antd';
import { UserOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { setActiveTab } from '../../store/slices/uiSlice';
// API keys are managed by the backend. Settings modal is informational in the client.

const { Header, Content } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // const { activeTab } = useSelector((state: RootState) => state.ui);
  const { isActive, progress } = useSelector((state: RootState) => state.interview);

  const handleTabChange = (key: string) => {
    dispatch(setActiveTab(key as 'interviewee' | 'interviewer'));
    navigate(`/${key}`);
  };

  const tabItems = [
    {
      key: 'interviewee',
      label: (
        <Space>
          <UserOutlined />
          Interviewee
          {isActive && <Badge status="processing" />}
        </Space>
      ),
    },
    {
      key: 'interviewer',
      label: (
        <Space>
          <TeamOutlined />
          Interviewer Dashboard
          {progress.questionsAsked > 0 && (
            <Badge count={progress.questionsAsked} size="small" />
          )}
        </Space>
      ),
    },
  ];

  const currentTab = location.pathname === '/' ? 'interviewee' : location.pathname.slice(1);

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(10px)',
        padding: '0 32px', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        height: '64px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Title level={3} style={{ 
            margin: 0, 
            marginRight: 48,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            fontSize: '24px'
          }}>
            🤖 AI Interview Platform
          </Title>
          <Tabs
            activeKey={currentTab}
            onChange={handleTabChange}
            items={tabItems}
            style={{ 
              marginBottom: 0,
              flex: 1
            }}
            size="large"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button 
              icon={<SettingOutlined />} 
              type="text"
              size="large"
              onClick={() => setSettingsOpen(true)}
              style={{ 
                borderRadius: '12px',
              }}
            >
              Settings
            </Button>
          </div>
        </div>
      </Header>
      <Content style={{ 
        display: 'flex',
        flexDirection: 'column',
        background: 'transparent',
        minHeight: 0,
        flex: 1
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          flex: 1,
          margin: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {children}
        </div>
      </Content>
      
      <Modal
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        title="Settings & Info"
        footer={null}
        width={700}
      >
        <div style={{ padding: 8 }}>
          <p style={{ marginBottom: 12 }}>
            The Gemini API key is provided by the backend in this deployment. Users do not need to enter keys here.
          </p>
          <p style={{ marginBottom: 12 }}>
            To change backend keys or models, update the server configuration or environment variables. For local development you can set the key in <code>src/services/aiService.ts</code> (only for dev).
          </p>
          <p style={{ color: '#888' }}>
            Note: The Settings modal is informational in this build and does not accept user keys.
          </p>
        </div>
      </Modal>
    </Layout>
  );
};

export default MainLayout;