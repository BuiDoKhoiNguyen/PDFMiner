import { useState, useRef, useEffect } from 'react';
import { chatbotApi } from '../utils/chatbotApi';
import type { ChatbotResponse, DocumentLink, DocumentSummary } from '../utils/chatbotApi';
import { Button, Form, Input, Card, List, message, Spin, Typography, Space, Divider } from 'antd';
import { SendOutlined, SearchOutlined, FileOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  documentLinks?: DocumentLink[];
  documentSummaries?: {
    [key: string]: DocumentSummary;
  };
}

const ChatbotComponent = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Xin chào! Tôi có thể giúp gì cho bạn về các tài liệu văn bản?' 
    }
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!query.trim()) return;

    // Add user message to the chat
    setMessages([...messages, { role: 'user', content: query }]);
    
    // Clear input
    const userQuery = query;
    setQuery('');
    setLoading(true);

    try {
      // Send query to API
      const response = await chatbotApi.processQuery(userQuery);
      const chatbotResponse: ChatbotResponse = response.data;

      // If there are document references, fetch their details
      let documentLinks: DocumentLink[] = [];
      if (chatbotResponse.documentIds && chatbotResponse.documentIds.length > 0) {
        const linksResponse = await chatbotApi.getDocumentLinks(chatbotResponse.documentIds);
        documentLinks = linksResponse.data;
      }

      // Add assistant response to the chat
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: chatbotResponse.answer,
          documentLinks,
          documentSummaries: chatbotResponse.documentSummaries
        }
      ]);
    } catch (error) {
      console.error('Error processing query:', error);
      message.error('Có lỗi xảy ra khi xử lý yêu cầu của bạn.');
      
      // Add error message
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          role: 'assistant', 
          content: 'Xin lỗi, đã xảy ra lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Card 
        title={
          <div style={{ textAlign: 'center' }}>
            <Title level={4}>Trợ lý tài liệu thông minh</Title>
            <Text type="secondary">Hỏi đáp về tài liệu, văn bản pháp quy</Text>
          </div>
        }
        bordered={true}
        style={{ width: '100%', marginBottom: '20px' }}
      >
        <div 
          style={{ 
            height: '400px', 
            overflowY: 'auto', 
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}
        >
          {messages.map((message, index) => (
            <div 
              key={index} 
              style={{ 
                textAlign: message.role === 'user' ? 'right' : 'left',
                marginBottom: '16px' 
              }}
            >
              <Card
                style={{ 
                  display: 'inline-block',
                  maxWidth: '80%',
                  textAlign: 'left',
                  backgroundColor: message.role === 'user' ? '#e6f7ff' : '#fff',
                  borderRadius: '8px'
                }}
              >
                <Paragraph style={{ whiteSpace: 'pre-line', margin: 0 }}>
                  {/* Highlight Document references in the text */}
                  {message.content.split(/(\[Document \d+(?::|]|\s).*?(?=\[|\n|$))/g).map((part, index) => {
                    if (part.match(/^\[Document \d+(?::|]|\s)/)) {
                      return (
                        <span key={index} style={{ backgroundColor: '#f0f8ff', padding: '0 3px', borderRadius: '3px' }}>
                          {part}
                        </span>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </Paragraph>
                
                {message.documentLinks && message.documentLinks.length > 0 && (
                  <>
                    <Divider orientation="left">Tài liệu tham khảo</Divider>
                    <List
                      size="small"
                      dataSource={message.documentLinks}
                      renderItem={(doc, index) => {
                        // Find matching document summary if available
                        const docIndex = (index + 1).toString();
                        const docSummary = message.documentSummaries && message.documentSummaries[docIndex];
                        
                        return (
                          <List.Item>
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                            >
                              <FileOutlined style={{ marginRight: '8px', fontSize: '20px', color: '#1890ff' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold' }}>
                                  Document {index + 1}: {doc.title || 'Tài liệu không tiêu đề'}
                                </div>
                                <div>
                                  <Text type="secondary">
                                    {doc.documentType} {doc.documentNumber}
                                    {docSummary?.issuingAgency && ` - ${docSummary.issuingAgency}`}
                                  </Text>
                                </div>
                              </div>
                            </a>
                          </List.Item>
                        );
                      }}
                    />
                  </>
                )}
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <Form layout="inline" style={{ display: 'flex' }} onFinish={handleSendMessage}>
          <Form.Item style={{ flex: 1, marginRight: '8px' }}>
            <TextArea 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nhập câu hỏi của bạn về tài liệu..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              icon={loading ? <Spin size="small" /> : <SendOutlined />}
              onClick={handleSendMessage}
              disabled={loading || !query.trim()}
            >
              Gửi
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Gợi ý câu hỏi" size="small">
        <Space direction="vertical">
          <Button 
            type="link" 
            icon={<SearchOutlined />}
            onClick={() => setQuery('Văn bản về giáo dục năm 2024 gồm những nội dung gì?')}
          >
            Văn bản về giáo dục năm 2024 gồm những nội dung gì?
          </Button>
          <Button 
            type="link" 
            icon={<SearchOutlined />}
            onClick={() => setQuery('Nghị quyết mới nhất về phát triển kinh tế có những điểm chính nào?')}
          >
            Nghị quyết mới nhất về phát triển kinh tế có những điểm chính nào?
          </Button>
          <Button 
            type="link" 
            icon={<SearchOutlined />}
            onClick={() => setQuery('Quyết định của Thủ tướng về công nghệ thông tin?')}
          >
            Quyết định của Thủ tướng về công nghệ thông tin?
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default ChatbotComponent;
