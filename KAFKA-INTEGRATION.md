# PDFMiner Kafka Integration Guide

## Tổng quan

Tài liệu này mô tả cách triển khai Apache Kafka trong dự án PDFMiner-microservice để cải thiện khả năng mở rộng, độ tin cậy và hiệu suất của hệ thống. Kafka đã được tích hợp vào tất cả các microservice (document-service, user-service, storage-service và document-process-service) để tạo ra một hệ thống sự kiện phân tán đáng tin cậy.

## Kiến trúc Kafka trong PDFMiner

```
                                  ┌───────────────────┐
                                  │                   │
                                  │  Spring Cloud     │
                                  │  Config Server    │
                                  │                   │
                                  └───────────────────┘
                                          │
                                          ▼
┌───────────────┐           ┌───────────────────┐            ┌───────────────┐
│               │           │                   │            │               │
│  Frontend     │◄────────►│  API Gateway      │◄───────────┤  Eureka       │
│  React        │           │  Spring Cloud     │            │  Service      │
│               │           │                   │            │               │
└───────────────┘           └───────────────────┘            └───────────────┘
                                    │                               ▲
                                    │                               │
                 ┌─────────────────┬┴────────────────┬──────────────┘
                 │                 │                 │
                 ▼                 ▼                 ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │                │ │                │ │                │
        │ User Service   │ │ Document       │ │ Storage        │
        │ Spring Boot    │ │ Service        │ │ Service        │
        │                │ │ Spring Boot    │ │ Spring Boot    │
        └────────────────┘ └────────────────┘ └────────────────┘
                                   │                  │
                                   │                  │
                            ┌──────┴──────┐           │
                            │             │           │
                            │   Kafka     │◄──────────┘
                            │             │
                            └──────┬──────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │                │
                          │ Document       │
                          │ Process        │
                          │ Service        │
                          │                │
                          └────────────────┘
                                   │
                                   ▼
                          ┌────────────────┐
                          │                │
                          │ Elasticsearch  │
                          │                │
                          └────────────────┘
```

## Kafka Topics

Dự án PDFMiner sử dụng các topics sau:

### Document Processing Topics
1. `file-uploaded`: Sự kiện khi file được tải lên thành công
2. `file-text-extracted`: Sự kiện sau khi OCR xử lý xong văn bản và chuẩn hóa dữ liệu

> **Lưu ý**: Hệ thống đã được tối ưu hóa từ nhiều topics (`pdf-uploaded`, `pdf-text-extracted`, `pdf-text-normalized`, `pdf-indexed`, `table-extracted`) xuống còn 2 topics để đơn giản hóa luồng dữ liệu và cải thiện khả năng bảo trì.

### User Management Topics
1. `user-created`: Sự kiện khi một người dùng mới được tạo
2. `user-updated`: Sự kiện khi thông tin người dùng được cập nhật
3. `user-login`: Sự kiện khi người dùng đăng nhập
4. `role-changed`: Sự kiện khi quyền người dùng thay đổi

## Bắt đầu với Kafka

### 1. Khởi chạy Kafka với Docker Compose

```bash
cd /Users/buidokhoinguyen/Desktop/PDFMiner-microservice
docker-compose -f docker-compose.yml up -d
```

Điều này sẽ khởi động:
- Zookeeper
- Kafka Broker
- Kafka UI (truy cập qua http://localhost:8080)
- Elasticsearch
- Kibana (truy cập qua http://localhost:5601)

### 2. Cài đặt các thư viện Kafka Python

```bash
cd document-process-service
pip install confluent-kafka
```

### 3. Chạy Kafka Consumer

```bash
cd document-process-service
python kafka_consumer.py
```

## Cấu hình Kafka cho Spring Boot Services

Để cấu hình Kafka trong Spring Boot, bạn cần thêm các dependencies và cấu hình sau:

1. Thêm dependencies vào `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

2. Cấu hình Kafka trong `application.yml` hoặc Spring Cloud Config:

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: pdfminer-document-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "*"
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

3. Tạo các class Producer trong các Spring services:

```java
@Service
public class KafkaProducerService {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    
    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }
    
    public void sendDocumentEvent(String topic, String key, Object data) {
        kafkaTemplate.send(topic, key, data);
    }
}
```

4. Tạo các class Consumer:

```java
@Service
public class KafkaConsumerService {
    private final DocumentService documentService;
    
    public KafkaConsumerService(DocumentService documentService) {
        this.documentService = documentService;
    }
    
    @KafkaListener(topics = "file-text-extracted", groupId = "pdfminer-document-service")
    public void consumeExtractedDocumentData(
            @Payload DocumentData documentData,
            @Header(KafkaHeaders.RECEIVED_KEY) String key) {
            
        // Process the document data
        documentService.processExtractedDocument(documentData);
    }
}
```

## Luồng xử lý chính trong hệ thống

### Luồng xử lý tài liệu với Kafka (Đã cải tiến)

1. **Tải lên tài liệu**:
   - Frontend gửi PDF đến API Gateway với parameter `useKafka=true`
   - API Gateway chuyển tiếp đến Storage Service
   - Storage Service lưu trữ tài liệu và gửi sự kiện đến `file-uploaded`

2. **Xử lý OCR và chuẩn hóa**:
   - Document Process Service lắng nghe `file-uploaded`
   - Thực hiện OCR trên PDF
   - Sử dụng Gemini AI để chuẩn hóa dữ liệu
   - Gửi sự kiện đến `file-text-extracted` với kết quả đã xử lý

3. **Lưu trữ và đánh index**:
   - Document Service lắng nghe `file-text-extracted`
   - Lưu trữ dữ liệu đã chuẩn hóa và đánh index vào Elasticsearch

4. **Cập nhật trạng thái**:
   - Frontend có thể theo dõi trạng thái xử lý tài liệu
   - Hiển thị thông tin khi tài liệu được xử lý xong

## Unified API Endpoints

Để đơn giản hóa API, chúng tôi đã hợp nhất các endpoint upload file/document thành các endpoint thống nhất có thể hoạt động ở cả chế độ đồng bộ và bất đồng bộ (Kafka).

### Trong Storage Service

```
POST /api/files/upload?useKafka=true|false
```

Endpoint này cung cấp một cách thống nhất để tải lên files:
- Khi `useKafka=true`: File được xử lý bất đồng bộ qua Kafka
- Khi `useKafka=false` (mặc định): File được xử lý đồng bộ

Endpoint legacy `/api/files/upload-with-kafka` vẫn được hỗ trợ nhưng đã được đánh dấu là deprecated.

### Trong Document Service

```
POST /api/documents/upload?useKafka=true|false
```

Endpoint này cung cấp một cách thống nhất để tải lên tài liệu:
- Khi `useKafka=true`: Tài liệu được xử lý bất đồng bộ qua Kafka
- Khi `useKafka=false` (mặc định): Tài liệu được xử lý đồng bộ

Endpoint legacy `/api/documents/upload-with-kafka` vẫn được hỗ trợ nhưng đã được đánh dấu là deprecated.

### Lợi ích của endpoint thống nhất

1. Frontend có thể sử dụng một endpoint duy nhất cho cả hai phương thức xử lý
2. Giảm trùng lặp code trong backend
3. Dễ dàng hơn khi mở rộng API
4. Khả năng tương thích ngược cho các ứng dụng client hiện tại

### Luồng quản lý người dùng với Kafka

1. **Đăng ký người dùng**:
   - Frontend gửi thông tin đăng ký người dùng đến User Service
   - User Service lưu trữ người dùng và phát sự kiện `user-created`

2. **Đăng nhập người dùng**:
   - User Service xác thực người dùng và phát sự kiện `user-login`
   - Các service khác có thể theo dõi hoạt động người dùng

3. **Thay đổi quyền**:
   - Admin thay đổi quyền người dùng
   - User Service phát sự kiện `role-changed`
   - Các service khác cập nhật quyền truy cập tương ứng

### Tương tác với API

1. **Tải lên tệp đồng bộ**:
   - `POST /api/files/upload`: Tải lên tệp trực tiếp, xử lý đồng bộ

2. **Tải lên tệp bất đồng bộ**:
   - `POST /api/files/upload-with-kafka`: Tải lên tệp và xử lý qua Kafka

3. **Kiểm tra trạng thái xử lý**:
   - `GET /api/documents/{documentId}/status`: Kiểm tra trạng thái xử lý tài liệu

## Giám sát và Quản lý Kafka

- **Kafka UI**: Truy cập http://localhost:8080 để xem topics, messages và consumers
- **Kibana**: Truy cập http://localhost:5601 để xem dữ liệu trong Elasticsearch

## Xử lý lỗi và Retry

Để xử lý lỗi và retry trong Kafka:

1. **Python Consumer**:
   - Implement logic xử lý lỗi trong hàm processing
   - Sử dụng try/except và logging

2. **Spring Boot Consumer**:
   - Sử dụng retry policies của Spring Kafka:

```java
@Bean
public ConsumerFactory<String, Object> consumerFactory() {
    // Consumer factory configuration
}

@Bean
public KafkaListenerContainerFactory<?> kafkaListenerContainerFactory() {
    ConcurrentKafkaListenerContainerFactory<String, Object> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory());
    factory.setRetryTemplate(retryTemplate());
    return factory;
}

@Bean
public RetryTemplate retryTemplate() {
    RetryTemplate retryTemplate = new RetryTemplate();
    
    FixedBackOffPolicy fixedBackOffPolicy = new FixedBackOffPolicy();
    fixedBackOffPolicy.setBackOffPeriod(1000L);
    
    SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
    retryPolicy.setMaxAttempts(3);
    
    retryTemplate.setRetryPolicy(retryPolicy);
    retryTemplate.setBackOffPolicy(fixedBackOffPolicy);
    
    return retryTemplate;
}
```

## Best Practices

1. **Sử dụng ID duy nhất**: Luôn sử dụng document_id cho mọi sự kiện liên quan đến tài liệu
2. **Bảo mật**: Cân nhắc sử dụng SSL/TLS trong môi trường production
3. **Monitoring**: Sử dụng Prometheus và Grafana để theo dõi Kafka
4. **Backup và DR**: Cấu hình replica factor > 1 trong môi trường production
5. **Log Compaction**: Sử dụng log compaction cho các topic cần lưu trạng thái
