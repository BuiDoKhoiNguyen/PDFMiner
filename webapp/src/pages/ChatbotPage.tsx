import { Card } from 'antd';
import ChatbotComponent from '../components/ChatbotComponent';
import { PageContainer } from '@ant-design/pro-components';

const ChatbotPage = () => {
  return (
    <PageContainer
      header={{
        title: 'Trợ lý tài liệu thông minh',
        ghost: true,
      }}
    >
      <Card>
        <ChatbotComponent />
      </Card>
    </PageContainer>
  );
};

export default ChatbotPage;
