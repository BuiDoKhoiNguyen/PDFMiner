# THIẾT KẾ HỆ THỐNG PDFMiner-microservice

## I. KIẾN TRÚC TỔNG THỂ

### 1. Mô hình kiến trúc Microservice

PDFMiner được thiết kế theo kiến trúc microservice nhằm đảm bảo tính mô-đun hóa, khả năng mở rộng và bảo trì cao. Hệ thống bao gồm các thành phần chính sau:

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

### 2. Vai trò của từng thành phần

#### 2.1 Frontend
- **Công nghệ**: React, TypeScript, Material UI, Ant Design
- **Chức năng chính**: Giao diện người dùng, tương tác với backend thông qua API Gateway
- **Thành phần quan trọng**:
  - Giao diện đăng nhập/đăng ký
  - Quản lý tài liệu (tải lên, xem, tìm kiếm)
  - Trợ lý tài liệu thông minh (chatbot)
  - Dashboard hiển thị thống kê và số liệu

#### 2.2 API Gateway
- **Công nghệ**: Spring Cloud Gateway
- **Chức năng chính**:
  - Điểm vào duy nhất cho tất cả các yêu cầu API từ frontend
  - Định tuyến các yêu cầu đến các microservice phù hợp
  - Xác thực và ủy quyền cho mọi yêu cầu
  - Load balancing và circuit breaking

#### 2.3 Eureka Service Registry
- **Công nghệ**: Spring Cloud Netflix Eureka
- **Chức năng chính**:
  - Đăng ký và quản lý tất cả các microservice
  - Service discovery để các dịch vụ có thể tìm thấy nhau
  - Health checking cho các dịch vụ

#### 2.4 Config Server
- **Công nghệ**: Spring Cloud Config
- **Chức năng chính**:
  - Tập trung quản lý cấu hình cho tất cả các microservice
  - Cập nhật cấu hình động mà không cần khởi động lại dịch vụ
  - Quản lý cấu hình theo môi trường (dev, test, production)

#### 2.5 User Service
- **Công nghệ**: Spring Boot
- **Chức năng chính**:
  - Quản lý người dùng (đăng ký, đăng nhập, quản lý thông tin cá nhân)
  - Xác thực và ủy quyền (JWT)
  - Quản lý vai trò và quyền hạn

#### 2.6 Document Service
- **Công nghệ**: Spring Boot, Elasticsearch
- **Chức năng chính**:
  - Lưu trữ và quản lý metadata của tài liệu
  - Cung cấp API tìm kiếm và truy xuất tài liệu
  - Xử lý yêu cầu từ trợ lý tài liệu thông minh (chatbot)
  - Đánh chỉ mục và tìm kiếm tài liệu với Elasticsearch

#### 2.7 Storage Service
- **Công nghệ**: Spring Boot, AWS S3 Compatible Storage
- **Chức năng chính**:
  - Lưu trữ và quản lý file PDF gốc
  - Xử lý tải lên và tải xuống tài liệu
  - Gửi sự kiện Kafka khi có tài liệu mới được tải lên

#### 2.8 Document Process Service
- **Công nghệ**: Python, PaddleOCR, Google Gemini AI
- **Chức năng chính**:
  - Nhận sự kiện từ Kafka về tài liệu mới
  - Thực hiện OCR (Optical Character Recognition) để trích xuất văn bản
  - Phân tích cấu trúc tài liệu (văn bản, bảng, hình ảnh)
  - Trích xuất metadata (số hiệu, loại văn bản, ngày ban hành...)
  - Sử dụng Google Gemini AI để chuẩn hóa dữ liệu
  - Gửi kết quả xử lý về Kafka để Document Service lưu trữ và đánh chỉ mục

#### 2.11 Image Processing Component
- **Công nghệ**: OpenCV, NumPy, PaddleOCR, VietOCR
- **Chức năng chính**:
  - Trích xuất và xử lý hình ảnh từ tài liệu PDF
  - Phát hiện và xử lý bảng (table detection and extraction)
  - Cải thiện chất lượng hình ảnh trước khi OCR (image enhancement)
  - Phát hiện và nhận dạng biểu đồ, sơ đồ (chart and diagram recognition)
  - Trích xuất thông tin từ hình ảnh phức tạp (stamps, logos, signatures)
  - Phân tích bố cục trang tài liệu (document layout analysis)
  
- **Tiến trình xử lý hình ảnh**:
  1. **Tiền xử lý hình ảnh**:
     - Chuyển đổi ảnh sang grayscale
     - Áp dụng threshold và binary inversion
     - Giảm nhiễu (denoising) và tăng độ tương phản
     - Điều chỉnh góc nghiêng (deskewing)

  2. **Phát hiện và trích xuất bảng**:
     - Sử dụng thuật toán phát hiện cạnh và đường viền
     - Áp dụng phép biến đổi hình thái học (morphological transformations)
     - Sử dụng phương pháp phát hiện đường kẻ và giao điểm
     - Xác định cấu trúc bảng (số hàng, số cột)

  3. **Trích xuất dữ liệu từ bảng**:
     - Phân đoạn các ô trong bảng
     - Áp dụng OCR cho từng ô
     - Tái tạo cấu trúc bảng dưới dạng JSON hoặc CSV

  4. **Xử lý hình ảnh phức tạp**:
     - Phát hiện và trích xuất chữ ký
     - Nhận dạng con dấu và logo
     - Phân tích biểu đồ và đồ thị

  5. **Tích hợp kết quả**:
     - Gộp dữ liệu văn bản và hình ảnh đã xử lý
     - Tạo cấu trúc dữ liệu hoàn chỉnh cho tài liệu
     - Chuyển kết quả cho các thành phần khác xử lý tiếp

- **Tích hợp với các thành phần khác**:
  - Kết nối với Document Process Service để xử lý tài liệu toàn diện
  - Gửi dữ liệu đã xử lý đến Kafka để Document Service lưu trữ
  - Cung cấp API để Frontend có thể hiển thị kết quả xử lý hình ảnh

#### 2.9 Kafka
- **Chức năng chính**:
  - Xử lý sự kiện bất đồng bộ giữa các service
  - Đảm bảo tin cậy trong việc truyền tải thông tin
  - Cho phép xử lý tài liệu lớn mà không làm chậm hệ thống
  - Hỗ trợ khả năng mở rộng và tính sẵn sàng cao

#### 2.10 Elasticsearch
- **Chức năng chính**:
  - Lưu trữ và đánh chỉ mục nội dung và metadata của tài liệu
  - Cung cấp khả năng tìm kiếm nâng cao, tìm kiếm ngữ nghĩa
  - Hỗ trợ gợi ý tự động khi tìm kiếm
  - Phân tích và tổng hợp dữ liệu tài liệu

## II. LUỒNG XỬ LÝ DỮ LIỆU

### 1. Luồng xử lý tài liệu

```
┌───────────┐     ┌────────────┐     ┌───────────────┐     ┌───────────────┐
│           │     │            │     │               │     │               │
│  Upload   ├────►│  Storage   ├────►│  Kafka Event  ├────►│  Document     │
│  Document │     │  Service   │     │  file-uploaded│     │  Process      │
│           │     │            │     │               │     │  Service      │
└───────────┘     └────────────┘     └───────────────┘     └───────┬───────┘
                                                                   │
                                                                   │
                                                                   ▼
                                                           ┌───────────────┐
                                                           │               │
                                                           │  Image        │
                                                           │  Processing   │
                                                           │  Component    │
                                                           └───────┬───────┘
                                                                   │
                                                                   │ OCR, Tables & Image Analysis
                                                                   ▼
┌───────────┐     ┌────────────┐     ┌───────────────┐     ┌───────────────┐
│           │     │            │     │               │     │               │
│  Frontend ◄─────┤  Document  ◄─────┤  Kafka Event  ◄─────┤  Results with │
│  Display  │     │  Service   │     │file-processed │     │  Metadata     │
│           │     │            │     │               │     │               │
└───────────┘     └────────────┘     └───────────────┘     └───────────────┘
```

#### Chi tiết luồng xử lý:

1. **Tải lên tài liệu**:
   - Frontend gửi file PDF đến API Gateway
   - API Gateway chuyển tiếp đến Storage Service
   - Storage Service lưu trữ tài liệu và gửi sự kiện đến topic `file-uploaded`

2. **Xử lý OCR và trích xuất dữ liệu**:
   - Document Process Service nhận sự kiện từ topic `file-uploaded`
   - Tải file PDF từ Storage Service
   - Thực hiện OCR để trích xuất văn bản
   - Chuyển trang PDF sang hình ảnh và gửi đến Image Processing Component

3. **Xử lý hình ảnh**:
   - Image Processing Component nhận hình ảnh từ Document Process Service
   - Xử lý và phát hiện bảng, biểu đồ, chữ ký, con dấu trong tài liệu
   - Trích xuất dữ liệu từ các thành phần hình ảnh
   - Chuyển kết quả xử lý về cho Document Process Service

4. **Hoàn thiện xử lý tài liệu**:
   - Phân tích cấu trúc tài liệu (text, bảng, hình ảnh)
   - Trích xuất metadata (tiêu đề, số văn bản, cơ quan ban hành...)
   - Sử dụng Google Gemini AI để chuẩn hóa dữ liệu
   - Gửi kết quả xử lý đến topic `file-processed`

5. **Lưu trữ và đánh chỉ mục**:
   - Document Service nhận sự kiện từ topic `file-processed`
   - Lưu trữ metadata và nội dung đã trích xuất
   - Đánh chỉ mục nội dung vào Elasticsearch
   - Cập nhật trạng thái tài liệu

6. **Hiển thị kết quả**:
   - Frontend truy vấn API Gateway để lấy thông tin tài liệu
   - API Gateway chuyển tiếp yêu cầu đến Document Service
   - Document Service trả về metadata và nội dung tài liệu
   - Frontend hiển thị kết quả cho người dùng

### 2. Luồng tìm kiếm tài liệu

```
┌───────────┐     ┌────────────┐     ┌───────────────┐
│           │     │            │     │               │
│  Search   ├────►│  Document  ├────►│ Elasticsearch │
│  Query    │     │  Service   │     │ Query         │
│           │     │            │     │               │
└───────────┘     └────────────┘     └───────┬───────┘
                                             │
                                             │
┌───────────┐     ┌────────────┐     ┌───────▼───────┐
│           │     │            │     │               │
│  Display  ◄─────┤  Format &  ◄─────┤ Search        │
│  Results  │     │  Rank      │     │ Results       │
│           │     │            │     │               │
└───────────┘     └────────────┘     └───────────────┘
```

#### Chi tiết luồng tìm kiếm:

1. **Nhập truy vấn tìm kiếm**:
   - Người dùng nhập từ khóa hoặc sử dụng tìm kiếm nâng cao
   - Frontend gửi truy vấn đến API Gateway
   - API Gateway chuyển tiếp đến Document Service

2. **Xử lý tìm kiếm**:
   - Document Service chuyển đổi truy vấn người dùng thành truy vấn Elasticsearch
   - Elasticsearch thực hiện tìm kiếm trên dữ liệu đã được đánh chỉ mục
   - Kết quả tìm kiếm được xếp hạng theo độ liên quan

3. **Hiển thị kết quả**:
   - Document Service định dạng kết quả trả về
   - Frontend hiển thị kết quả với các trích đoạn văn bản liên quan
   - Người dùng có thể lọc, sắp xếp và chọn tài liệu để xem chi tiết

### 3. Luồng xử lý trợ lý tài liệu thông minh (Chatbot)

```
┌───────────┐     ┌────────────┐     ┌───────────────┐
│           │     │            │     │               │
│  User     ├────►│  Document  ├────►│ Elasticsearch │
│  Question │     │  Service   │     │ Search        │
│           │     │            │     │               │
└───────────┘     └────────────┘     └───────┬───────┘
                                             │
                                             │ Relevant Documents
                                             ▼
┌───────────┐     ┌────────────┐     ┌───────────────┐
│           │     │            │     │               │
│  Display  ◄─────┤  Document  ◄─────┤ Google Gemini │
│  Answer   │     │  Service   │     │ AI Processing │
│           │     │            │     │               │
└───────────┘     └────────────┘     └───────────────┘
```

#### Chi tiết luồng trợ lý thông minh:

1. **Người dùng đặt câu hỏi**:
   - Người dùng nhập câu hỏi về nội dung tài liệu
   - Frontend gửi câu hỏi đến API Gateway
   - API Gateway chuyển tiếp đến Document Service (ChatbotController)

2. **Tìm kiếm tài liệu liên quan**:
   - Document Service thực hiện tìm kiếm trên Elasticsearch để xác định các tài liệu liên quan đến câu hỏi
   - Elasticsearch trả về danh sách tài liệu có độ liên quan cao nhất

3. **Xử lý câu hỏi với AI**:
   - Document Service tổng hợp nội dung từ các tài liệu liên quan
   - Gửi câu hỏi và nội dung tổng hợp đến Google Gemini AI
   - Google Gemini AI phân tích và tạo câu trả lời dựa trên nội dung tài liệu

4. **Trả về kết quả**:
   - Document Service nhận câu trả lời từ Google Gemini AI
   - Đính kèm thông tin về các tài liệu nguồn
   - Frontend hiển thị câu trả lời cùng với các trích dẫn và liên kết đến tài liệu gốc

## III. MÔ HÌNH DỮ LIỆU

### 1. Document (Tài liệu)

```json
{
  "documentId": "String (ID)",
  "documentNumber": "String (Số văn bản - VD: 100/2024/NĐ-CP)",
  "documentName": "String (Tên file)",
  "title": "String (Tiêu đề văn bản)",
  "content": "String (Nội dung văn bản đã trích xuất)",
  "documentType": "String (Loại văn bản - VD: Nghị định, Thông tư)",
  "issuingAgency": "String (Cơ quan ban hành)",
  "signer": "String (Người ký)",
  "issueDate": "LocalDate (Ngày ban hành)",
  "status": "String (Trạng thái xử lý)",
  "fileLink": "String (Đường dẫn đến file gốc)",
  "tableData": "String (Dữ liệu bảng biểu - định dạng JSON)",
  "imageData": "Array (Các hình ảnh được trích xuất từ tài liệu)",
  "signatures": "Array (Vị trí và thông tin chữ ký trong tài liệu)",
  "stamps": "Array (Vị trí và thông tin con dấu trong tài liệu)",
  "charts": "Array (Dữ liệu biểu đồ được trích xuất - định dạng JSON)",
  "layoutAnalysis": "Object (Phân tích bố cục trang tài liệu)",
  "searchText": "String (Văn bản tìm kiếm được tối ưu hóa)",
  "suggest": "Completion (Dữ liệu gợi ý tìm kiếm)"
}
```

### 2. User (Người dùng)

```json
{
  "id": "String (ID)",
  "username": "String (Tên đăng nhập)",
  "password": "String (Mật khẩu đã hash)",
  "fullName": "String (Họ tên đầy đủ)",
  "email": "String (Email)",
  "role": "String (ADMIN, STANDARD_USER)",
  "enabled": "Boolean (Trạng thái tài khoản)",
  "authorities": "Array (Danh sách quyền)",
  "createdAt": "DateTime (Thời điểm tạo)"
}
```

## III.A. THIẾT KẾ CƠ SỞ DỮ LIỆU CHI TIẾT

### 1. Tổng quan hệ thống cơ sở dữ liệu

PDFMiner-microservice sử dụng kiến trúc cơ sở dữ liệu đa dạng (polyglot persistence) với ba loại cơ sở dữ liệu chính:

1. **MySQL/PostgreSQL**: Cơ sở dữ liệu quan hệ để lưu trữ dữ liệu người dùng, quyền và các metadata có cấu trúc
2. **Elasticsearch**: Cơ sở dữ liệu tìm kiếm để đánh chỉ mục và tìm kiếm nội dung văn bản
3. **MinIO (S3 Compatible Storage)**: Lưu trữ đối tượng cho các tệp PDF và hình ảnh gốc

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  MySQL/PostgreSQL │     │   Elasticsearch   │     │       MinIO       │
│  Relational Data  │     │   Search Data     │     │   Object Storage  │
│                   │     │                   │     │                   │
└─────────┬─────────┘     └─────────┬─────────┘     └─────────┬─────────┘
          │                         │                         │
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          Microservices                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. Cơ sở dữ liệu quan hệ (MySQL/PostgreSQL)

#### 2.1 Schema quan hệ

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│      users        │     │      roles        │     │  user_roles       │
├───────────────────┤     ├───────────────────┤     ├───────────────────┤
│ id (PK)           │     │ id (PK)           │     │ user_id (FK)      │
│ username          │     │ name              │     │ role_id (FK)      │
│ password          │     │ description       │     │                   │
│ full_name         │     └───────────────────┘     └───────────────────┘
│ email             │
│ enabled           │     ┌───────────────────┐     ┌───────────────────┐
│ created_at        │     │    permissions    │     │ role_permissions  │
└───────────────────┘     ├───────────────────┤     ├───────────────────┤
                          │ id (PK)           │     │ role_id (FK)      │
                          │ name              │     │ permission_id (FK)│
                          │ description       │     │                   │
                          └───────────────────┘     └───────────────────┘

┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│   documents       │     │  document_meta    │     │ document_tags     │
├───────────────────┤     ├───────────────────┤     ├───────────────────┤
│ id (PK)           │     │ id (PK)           │     │ document_id (FK)  │
│ document_number   │     │ document_id (FK)  │     │ tag_id (FK)       │
│ document_name     │ ◄───┤ meta_key          │     │                   │
│ title             │     │ meta_value        │     └───────────────────┘
│ document_type     │     └───────────────────┘
│ issuing_agency    │                               ┌───────────────────┐
│ signer            │     ┌───────────────────┐     │      tags         │
│ issue_date        │     │ document_access   │     ├───────────────────┤
│ status            │     ├───────────────────┤     │ id (PK)           │
│ file_link         │ ◄───┤ document_id (FK)  │     │ name              │
│ created_at        │     │ user_id (FK)      │     │ created_at        │
│ updated_at        │     │ access_type       │     └───────────────────┘
│ created_by (FK)   │     │ accessed_at       │
└───────────────────┘     └───────────────────┘

┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│  chatbot_queries  │     │ chatbot_responses │     │ document_versions │
├───────────────────┤     ├───────────────────┤     ├───────────────────┤
│ id (PK)           │ ┌──►│ id (PK)           │     │ id (PK)           │
│ user_id (FK)      │ │   │ query_id (FK)     │     │ document_id (FK)  │
│ query_text        │ │   │ response_text     │     │ version_number    │
│ created_at        ├─┘   │ created_at        │     │ file_link         │
└───────────────────┘     │ referenced_docs   │     │ created_at        │
                          └───────────────────┘     │ created_by (FK)   │
                                                    └───────────────────┘
```

#### 2.2 Thiết kế bảng chi tiết

##### users
| Tên trường   | Kiểu dữ liệu | Mô tả                   | Ràng buộc               |
|--------------|--------------|-------------------------|-------------------------|
| id           | VARCHAR(36)  | UUID người dùng         | PRIMARY KEY             |
| username     | VARCHAR(50)  | Tên đăng nhập           | UNIQUE, NOT NULL        |
| password     | VARCHAR(255) | Mật khẩu đã hash        | NOT NULL                |
| full_name    | VARCHAR(100) | Họ tên đầy đủ           | NOT NULL                |
| email        | VARCHAR(100) | Địa chỉ email           | UNIQUE, NOT NULL        |
| enabled      | BOOLEAN      | Trạng thái tài khoản    | DEFAULT true            |
| created_at   | TIMESTAMP    | Thời điểm tạo           | DEFAULT CURRENT_TIMESTAMP|

##### roles
| Tên trường  | Kiểu dữ liệu | Mô tả                   | Ràng buộc               |
|-------------|--------------|-------------------------|-------------------------|
| id          | INT          | ID vai trò              | PRIMARY KEY, AUTO_INCREMENT|
| name        | VARCHAR(50)  | Tên vai trò             | UNIQUE, NOT NULL        |
| description | VARCHAR(255) | Mô tả vai trò           |                         |

##### user_roles
| Tên trường | Kiểu dữ liệu | Mô tả                   | Ràng buộc               |
|------------|--------------|-------------------------|-------------------------|
| user_id    | VARCHAR(36)  | ID người dùng           | FOREIGN KEY (users.id)  |
| role_id    | INT          | ID vai trò              | FOREIGN KEY (roles.id)  |

##### permissions
| Tên trường  | Kiểu dữ liệu | Mô tả                   | Ràng buộc               |
|-------------|--------------|-------------------------|-------------------------|
| id          | INT          | ID quyền                | PRIMARY KEY, AUTO_INCREMENT|
| name        | VARCHAR(50)  | Tên quyền               | UNIQUE, NOT NULL        |
| description | VARCHAR(255) | Mô tả quyền             |                         |

##### role_permissions
| Tên trường    | Kiểu dữ liệu | Mô tả                   | Ràng buộc               |
|---------------|--------------|-------------------------|-------------------------|
| role_id       | INT          | ID vai trò              | FOREIGN KEY (roles.id)  |
| permission_id | INT          | ID quyền                | FOREIGN KEY (permissions.id)|

##### documents
| Tên trường      | Kiểu dữ liệu | Mô tả                     | Ràng buộc                 |
|-----------------|--------------|---------------------------|---------------------------|
| id              | VARCHAR(36)  | UUID tài liệu             | PRIMARY KEY               |
| document_number | VARCHAR(100) | Số văn bản                | UNIQUE (có thể NULL)      |
| document_name   | VARCHAR(255) | Tên file                  | NOT NULL                  |
| title           | VARCHAR(255) | Tiêu đề văn bản           | NOT NULL                  |
| document_type   | VARCHAR(50)  | Loại văn bản              |                           |
| issuing_agency  | VARCHAR(100) | Cơ quan ban hành          |                           |
| signer          | VARCHAR(100) | Người ký                  |                           |
| issue_date      | DATE         | Ngày ban hành             |                           |
| status          | VARCHAR(20)  | Trạng thái xử lý          | NOT NULL                  |
| file_link       | VARCHAR(255) | Đường dẫn đến file gốc    | NOT NULL                  |
| created_at      | TIMESTAMP    | Thời điểm tạo             | DEFAULT CURRENT_TIMESTAMP |
| updated_at      | TIMESTAMP    | Thời điểm cập nhật        | DEFAULT CURRENT_TIMESTAMP |
| created_by      | VARCHAR(36)  | Người tạo tài liệu        | FOREIGN KEY (users.id)    |

##### document_meta
| Tên trường  | Kiểu dữ liệu | Mô tả                     | Ràng buộc                 |
|-------------|--------------|---------------------------|---------------------------|
| id          | VARCHAR(36)  | UUID metadata             | PRIMARY KEY               |
| document_id | VARCHAR(36)  | ID tài liệu               | FOREIGN KEY (documents.id)|
| meta_key    | VARCHAR(50)  | Tên thuộc tính            | NOT NULL                  |
| meta_value  | TEXT         | Giá trị thuộc tính        |                           |

##### tags
| Tên trường | Kiểu dữ liệu | Mô tả                     | Ràng buộc                 |
|------------|--------------|---------------------------|---------------------------|
| id         | INT          | ID tag                    | PRIMARY KEY, AUTO_INCREMENT|
| name       | VARCHAR(50)  | Tên tag                   | UNIQUE, NOT NULL          |
| created_at | TIMESTAMP    | Thời điểm tạo             | DEFAULT CURRENT_TIMESTAMP |

##### document_tags
| Tên trường  | Kiểu dữ liệu | Mô tả                     | Ràng buộc                 |
|-------------|--------------|---------------------------|---------------------------|
| document_id | VARCHAR(36)  | ID tài liệu               | FOREIGN KEY (documents.id)|
| tag_id      | INT          | ID tag                    | FOREIGN KEY (tags.id)     |

##### document_access
| Tên trường   | Kiểu dữ liệu | Mô tả                     | Ràng buộc                 |
|--------------|--------------|---------------------------|---------------------------|
| document_id  | VARCHAR(36)  | ID tài liệu               | FOREIGN KEY (documents.id)|
| user_id      | VARCHAR(36)  | ID người dùng             | FOREIGN KEY (users.id)    |
| access_type  | VARCHAR(20)  | Loại truy cập (VIEW, EDIT)| NOT NULL                  |
| accessed_at  | TIMESTAMP    | Thời điểm truy cập        | DEFAULT CURRENT_TIMESTAMP |

### 3. Elasticsearch

#### 3.1 Thiết kế chỉ mục (Index)

Elasticsearch được sử dụng để đánh chỉ mục và tìm kiếm nội dung tài liệu. Chúng ta sẽ thiết kế một số index chính:

##### documents_index
```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "vietnamese": {
          "tokenizer": "icu_tokenizer",
          "filter": [
            "icu_folding",
            "lowercase",
            "vietnamese_stop"
          ]
        }
      },
      "filter": {
        "vietnamese_stop": {
          "type": "stop",
          "stopwords": "_vietnamese_"
        }
      }
    },
    "index": {
      "number_of_shards": 3,
      "number_of_replicas": 1
    }
  },
  "mappings": {
    "properties": {
      "documentId": { "type": "keyword" },
      "documentNumber": { "type": "keyword" },
      "documentName": { "type": "text", "analyzer": "vietnamese" },
      "title": { "type": "text", "analyzer": "vietnamese", "boost": 2.0 },
      "content": { "type": "text", "analyzer": "vietnamese" },
      "documentType": { "type": "keyword" },
      "issuingAgency": { "type": "keyword" },
      "signer": { "type": "keyword" },
      "issueDate": { "type": "date" },
      "tableData": { "type": "nested" },
      "imageData": { "type": "nested" },
      "signatures": { "type": "nested" },
      "stamps": { "type": "nested" },
      "charts": { "type": "nested" },
      "searchText": { "type": "text", "analyzer": "vietnamese" },
      "suggest": {
        "type": "completion",
        "analyzer": "vietnamese"
      },
      "fileLink": { "type": "keyword" },
      "status": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" },
      "createdBy": { "type": "keyword" }
    }
  }
}
```

#### 3.2 Chiến lược đánh chỉ mục

1. **Đánh chỉ mục theo loại tài liệu**:
   - Tạo các index riêng cho từng loại tài liệu: văn bản quy phạm pháp luật, công văn, thông báo
   - Cấu hình phân tích (analyzers) phù hợp cho từng loại tài liệu

2. **Đánh chỉ mục incrementally**:
   - Khi tài liệu mới được xử lý, đánh chỉ mục ngay lập tức
   - Cập nhật chỉ mục khi nội dung tài liệu thay đổi
   - Sử dụng bulk API để tối ưu hiệu suất khi đánh chỉ mục hàng loạt

3. **Cấu hình phân tích văn bản**:
   - Sử dụng ICU tokenization cho tiếng Việt
   - Áp dụng stop words tiếng Việt để loại bỏ từ không mang nhiều ý nghĩa
   - Folding để chuẩn hóa dấu và ký tự đặc biệt

### 4. MinIO (Object Storage)

#### 4.1 Cấu trúc bucket

Hệ thống sử dụng MinIO để lưu trữ tài liệu PDF gốc và các tệp khác:

```
minio/
├── documents/                # Lưu trữ tệp PDF gốc
│   ├── {year}/               # Phân chia theo năm
│   │   ├── {month}/          # Phân chia theo tháng
│   │   │   ├── {uuid}.pdf    # Tài liệu PDF
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── processed/                # Lưu trữ kết quả xử lý tài liệu
│   ├── {document_id}/        # Tổ chức theo ID tài liệu
│   │   ├── images/           # Hình ảnh đã xử lý
│   │   ├── tables/           # Dữ liệu bảng đã trích xuất
│   │   ├── charts/           # Biểu đồ đã phân tích
│   │   └── metadata.json     # Metadata trích xuất được
│   └── ...
├── thumbnails/               # Thumbnail các tài liệu
│   ├── {document_id}.jpg     # Thumbnail trang đầu tiên
│   └── ...
└── versions/                 # Phiên bản của tài liệu
    ├── {document_id}/        # Tổ chức theo ID tài liệu
    │   ├── v1.pdf            # Phiên bản 1
    │   ├── v2.pdf            # Phiên bản 2
    │   └── ...
    └── ...
```

#### 4.2 Chính sách quản lý vòng đời

1. **Lifecycle policies**:
   - Tự động chuyển tài liệu ít truy cập sang lưu trữ giá rẻ hơn sau 90 ngày
   - Tạo thumbnail tự động khi tài liệu được tải lên
   - Giữ các phiên bản tài liệu tối đa 10 phiên bản

2. **Encryption và security**:
   - Mã hóa dữ liệu tại rest với AES-256
   - Mã hóa trong quá trình truyền tải (in-transit) với TLS
   - Kiểm soát truy cập với IAM policies

### 5. Đồng bộ hóa dữ liệu

#### 5.1 Chiến lược đồng bộ hóa

Để đảm bảo dữ liệu nhất quán giữa các hệ thống cơ sở dữ liệu khác nhau, PDFMiner-microservice sử dụng mô hình event-driven:

1. **Outbox Pattern**:
   - Mỗi microservice duy trì một bảng outbox để lưu trữ sự kiện
   - Các sự kiện được công bố đến Kafka khi có thay đổi dữ liệu
   - Các service khác lắng nghe và cập nhật dữ liệu của mình

2. **Change Data Capture (CDC)**:
   - Debezium được sử dụng để bắt các thay đổi từ MySQL/PostgreSQL
   - Các thay đổi được stream qua Kafka để các service khác xử lý

3. **Optimistic concurrency control**:
   - Sử dụng version numbers cho mỗi bản ghi
   - Phát hiện và xử lý xung đột khi cập nhật đồng thời

### 6. Mô hình truy cập dữ liệu

#### 6.1 Phân tách truy vấn/lệnh (CQRS)

PDFMiner-microservice áp dụng mẫu Command Query Responsibility Segregation (CQRS) để tách biệt hoạt động đọc và ghi:

1. **Command Side**:
   - Xử lý các thao tác thay đổi dữ liệu: tạo, cập nhật, xóa
   - Sử dụng MySQL/PostgreSQL làm nguồn dữ liệu chính
   - Đảm bảo tính nhất quán của dữ liệu

2. **Query Side**:
   - Tối ưu hóa cho các truy vấn đọc
   - Sử dụng Elasticsearch cho tìm kiếm toàn văn
   - Cung cấp các API đọc tối ưu cho frontend

#### 6.2 Mô hình Repository và DAO

Mỗi microservice triển khai các pattern truy cập dữ liệu sau:

1. **Repository Pattern**:
   - Trừu tượng hóa việc truy cập dữ liệu
   - Cung cấp giao diện cấp cao để làm việc với entities
   - Xử lý logic truy vấn phức tạp

2. **Data Transfer Objects (DTOs)**:
   - Chuyển đổi giữa entities và các đối tượng trả về cho client
   - Tối ưu hóa dữ liệu được truyền qua mạng
   - Bảo vệ cấu trúc nội bộ của domain model

Ví dụ Repository trong Document Service:

```java
@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {
    List<Document> findByDocumentType(String documentType);
    List<Document> findByIssuingAgency(String issuingAgency);
    List<Document> findByIssueDate(LocalDate issueDate);
    List<Document> findBySignerContainingIgnoreCase(String signer);
    
    @Query("SELECT d FROM Document d WHERE d.status = :status AND d.createdAt > :date")
    Page<Document> findRecentDocumentsByStatus(String status, LocalDateTime date, Pageable pageable);
}
```
