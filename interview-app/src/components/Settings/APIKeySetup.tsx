import React from 'react';
import { Modal, Typography } from 'antd';

const { Paragraph } = Typography;

interface APIKeySetupProps {
  open: boolean;
  onClose: () => void;
}

const APIKeySetup: React.FC<APIKeySetupProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Settings & Info">
      <Paragraph>
        API keys are managed by the backend in this deployment. The client does not accept or store user-provided API keys.
      </Paragraph>
      <Paragraph type="secondary">
        For local development only: you can set a dev key in <code>src/services/aiService.ts</code> if you need to test the real Gemini calls.
      </Paragraph>
    </Modal>
  );
};

export default APIKeySetup;
