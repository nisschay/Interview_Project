
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, Spin } from 'antd';
import { store, persistor } from './store/store';
import MainLayout from './components/Layout/MainLayout';
import IntervieweePage from './pages/IntervieweePage';
import InterviewerPage from './pages/InterviewerPage';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>} persistor={persistor}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
            },
          }}
        >
          <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<IntervieweePage />} />
                <Route path="/interviewee" element={<IntervieweePage />} />
                <Route path="/interviewer" element={<InterviewerPage />} />
              </Routes>
            </MainLayout>
          </Router>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App
