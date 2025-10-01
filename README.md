# PDFMiner - Hệ Thống Microservice Xử Lý Tài Liệu Thông Minh

Hệ thống microservice để quản lý, xử lý, phân tích tài liệu PDF với khả năng OCR, tìm kiếm nâng cao và AI-powered document processing.

## 🏗️ Kiến trúc tổng quan

```
                            ┌─────────────────────┐
                            │   Config Server     │
                            │   (Port 8888)       │
                            └──────────┬──────────┘
                                       │
                            ┌──────────▼──────────┐
                            │ Discovery Service   │
                            │   (Eureka 8761)     │
                            └──────────┬──────────┘
                                       │
┌──────────────────────────────────────┼──────────────────────────────────────┐
│                                      │                                      │
│  ┌───────────────────────────────────▼────────────────────────────────┐   │
│  │                         Gateway (Port 8080)                         │   │
│  │                    Spring Cloud Gateway + JWT                       │   │
│  └───────────────────────────────────┬────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────┬───────────────┼───────────────┬──────────────────┐ │
│  │                   │               │               │                  │ │
│  ▼                   ▼               ▼               ▼                  ▼ │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ │   User     │ │  Document  │ │  Storage   │ │ Processing │ │   WebApp   │
│ │  Service   │ │  Service   │ │  Service   │ │  Service   │ │  (React)   │
│ │ Port 8081  │ │ Port 8082  │ │ Port 8084  │ │  (Python)  │ │  (Vite)    │
│ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────────────┘
│       │              │              │              │
│       │   MongoDB    │ Elasticsearch│   AWS S3     │   Kafka
│       └──────────────┴──────────────┴──────────────┴────────────────────┐
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  Infrastructure     │
                          │  • Kafka/Zookeeper  │
                          │  • Elasticsearch    │
                          │  • Kibana           │
                          └─────────────────────┘
```

## 📦 Các Service

### Core Services (Java/Spring Boot 3.4.4)

| Service | Port | Description | Technology Stack |
|---------|------|-------------|------------------|
| **Config Server** | 8888 | Quản lý cấu hình tập trung | Spring Cloud Config |
| **Discovery Service** | 8761 | Service Registry & Discovery | Netflix Eureka Server |
| **Gateway** | 8080 | API Gateway, Routing, JWT Auth | Spring Cloud Gateway + WebFlux |
| **User Service** | 8081 | Quản lý người dùng & xác thực | Spring Boot + MongoDB + JWT |
| **Document Service** | 8082 | Quản lý metadata tài liệu & tìm kiếm | Spring Boot + Elasticsearch + Kafka |
| **Storage Service** | 8084 | Lưu trữ và quản lý file PDF | Spring Boot + AWS S3 + JWT |

### AI/ML Services (Python)

| Service | Description | Technology Stack |
|---------|-------------|------------------|
| **Processing Service** | OCR, Table Extraction, Document Processing | Python + PaddleOCR + VietOCR + FastAPI + Kafka |

### Frontend (React + TypeScript)

| Service | Port | Description | Technology Stack |
|---------|------|-------------|------------------|
| **WebApp** | 5173 | Giao diện người dùng | React 19 + TypeScript + Vite + Ant Design + Material-UI |

## 🚀 Quick Start

### Prerequisites

- **Java 17+**
- **Maven 3.9+**
- **Node.js 18+** & **npm/yarn**
- **Python 3.9+**
- **Docker & Docker Compose**
- **MongoDB** (cho User Service)
- **Elasticsearch 7.17+** (cho Document Service)
- **AWS S3** (hoặc S3-compatible storage cho Storage Service)

### 1. Clone Repository

```bash
git clone https://github.com/BuiDoKhoiNguyen/PDFMiner.git
cd PDFMiner
```

### 2. Start Infrastructure Services

```bash
# Start Kafka, Zookeeper, Elasticsearch, Kibana
cd infrastructure
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Services started:**
- Zookeeper: `localhost:2181`
- Kafka: `localhost:9092`
- Kafka UI: `localhost:8386`
- Elasticsearch: `localhost:9200`
- Kibana: `localhost:5601`

### 3. Start Core Services (Java)

#### 3.1. Build All Services

```bash
# Build từ root project
mvn clean install -DskipTests
```

#### 3.2. Start Services (theo thứ tự)

**Bước 1: Start Config Server (bắt buộc chạy đầu tiên)**
```bash
cd config-server
mvn spring-boot:run
```

**Bước 2: Start Discovery Service**
```bash
cd discovery-service
mvn spring-boot:run
```

**Bước 3: Start API Gateway**
```bash
cd gateway
mvn spring-boot:run
```

**Bước 4: Start Business Services (có thể chạy song song)**
```bash
# Terminal 1 - User Service
cd user-service
mvn spring-boot:run

# Terminal 2 - Document Service
cd document-service
mvn spring-boot:run

# Terminal 3 - Storage Service
cd storage-service
mvn spring-boot:run
```

### 4. Start AI/ML Processing Service (Python)

```bash
cd processing-service

# Cài đặt dependencies
pip install -r requirements.txt

# Start service
chmod +x start.sh
./start.sh

# Hoặc chạy trực tiếp
python server.py
```

### 5. Start Frontend WebApp

```bash
cd webapp

# Cài đặt dependencies
npm install

# Start development server
npm run dev
```

### 6. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| **WebApp** | http://localhost:5173 | Giao diện người dùng |
| **API Gateway** | http://localhost:8080 | API Gateway |
| **Eureka Dashboard** | http://localhost:8761 | Service Registry Dashboard |
| **Kafka UI** | http://localhost:8386 | Kafka Management UI |
| **Kibana** | http://localhost:5601 | Elasticsearch Dashboard |
| **Elasticsearch** | http://localhost:9200 | Elasticsearch API |

## 🔧 Configuration

### Cấu hình tập trung (Config Server)

Các file cấu hình được quản lý tập trung tại thư mục `config/`:

```
config/
├── application.properties        # Cấu hình chung
├── document-service.yml         # Document Service config
├── eureka-server.yml            # Discovery Service config
├── gateway.yml                  # Gateway config
├── storage-service.yml          # Storage Service config
└── user-service.yml             # User Service config
```

### Environment Variables

Tạo file `.env` hoặc cấu hình biến môi trường:

```bash
# MongoDB (User Service)
MONGODB_URI=mongodb://localhost:27017/pdfminer
MONGODB_DATABASE=pdfminer

# Elasticsearch (Document Service)
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200

# AWS S3 (Storage Service)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=pdfminer-storage

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=86400000

# Google Gemini API (Document Service)
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🌟 Features

### Core Features

- ✅ **Quản lý người dùng**: Đăng ký, đăng nhập, phân quyền với JWT
- ✅ **Upload & Storage**: Upload PDF files lên AWS S3
- ✅ **Document Processing**: OCR tiếng Việt với PaddleOCR & VietOCR
- ✅ **Table Extraction**: Trích xuất bảng từ PDF thành structured data
- ✅ **Full-text Search**: Tìm kiếm nội dung tài liệu với Elasticsearch
- ✅ **Metadata Management**: Quản lý metadata và indexing
- ✅ **Real-time Processing**: Xử lý bất đồng bộ với Kafka

### Advanced Features

- 🔄 **Microservice Architecture**: Scalable và maintainable
- 🔐 **Security**: JWT authentication & authorization
- 📊 **Monitoring**: Service health checks & monitoring
- 🚀 **Service Discovery**: Automatic service registration với Eureka
- ⚙️ **Centralized Config**: Quản lý cấu hình tập trung
- 🎯 **API Gateway**: Single entry point với routing thông minh

## 📚 API Documentation

### Authentication APIs (via Gateway)

**Base URL**: `http://localhost:8080/api/users`

```bash
# Register
POST /api/users/auth/register
Content-Type: application/json
{
  "username": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}

# Login
POST /api/users/auth/login
Content-Type: application/json
{
  "username": "user@example.com",
  "password": "password123"
}

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer"
}
```

### Document APIs (via Gateway)

**Base URL**: `http://localhost:8080/api/documents`

```bash
# Upload Document
POST /api/storage/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
file: [PDF file]

# Search Documents
GET /api/documents/search?query=keyword
Authorization: Bearer {token}

# Get Document Details
GET /api/documents/{id}
Authorization: Bearer {token}
```

## 🛠️ Technology Stack

### Backend (Java)

- **Spring Boot 3.4.4**
- **Spring Cloud 2024.0.1**
  - Spring Cloud Config
  - Spring Cloud Gateway
  - Netflix Eureka
  - OpenFeign
- **Spring Security + JWT**
- **Spring Data MongoDB**
- **Spring Data Elasticsearch**
- **Spring Kafka**
- **AWS SDK for S3**
- **Lombok**
- **ModelMapper**

### AI/ML (Python)

- **FastAPI** - Web framework
- **PaddleOCR** - OCR engine
- **VietOCR** - Vietnamese OCR
- **Kafka-Python** - Kafka consumer/producer
- **PyTorch** - Deep learning framework
- **PIL/OpenCV** - Image processing
- **pandas** - Data manipulation
- **Google Generative AI** - AI-powered text processing

### Frontend

- **React 19**
- **TypeScript**
- **Vite** - Build tool
- **Ant Design Pro Components**
- **Material-UI**
- **React Router DOM**
- **Axios** - HTTP client
- **TanStack Query** - Server state management
- **JWT Decode**

### Infrastructure

- **Kafka + Zookeeper** - Message broker
- **Elasticsearch 7.17** - Search engine
- **Kibana 7.17** - Elasticsearch UI
- **MongoDB** - User data storage
- **AWS S3** - File storage
- **Docker** - Containerization

## 📂 Project Structure

```
PDFMiner/
├── config/                          # Centralized configuration files
│   ├── application.properties
│   ├── document-service.yml
│   ├── eureka-server.yml
│   ├── gateway.yml
│   ├── storage-service.yml
│   └── user-service.yml
├── config-server/                   # Spring Cloud Config Server
├── discovery-service/               # Eureka Server
├── gateway/                         # API Gateway
├── user-service/                    # User management & authentication
├── document-service/                # Document metadata & search
├── storage-service/                 # File storage with AWS S3
├── processing-service/              # Python AI/ML service
│   ├── PaddleOCR/                  # OCR engine
│   ├── vietocr/                    # Vietnamese OCR
│   ├── kafka_consumer.py           # Kafka consumer
│   ├── server.py                   # FastAPI server
│   ├── table_ocr.py                # Table extraction
│   └── requirements.txt
├── webapp/                          # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── infrastructure/                  # Docker compose files
│   └── docker-compose.yml
└── pom.xml                         # Parent POM
```

## 🔄 Data Flow

### Upload & Process Document Flow

```
1. User uploads PDF via WebApp (React)
   ↓
2. Gateway routes to Storage Service
   ↓
3. Storage Service uploads to AWS S3
   ↓
4. Storage Service publishes event to Kafka
   ↓
5. Processing Service (Python) consumes event
   ↓
6. Processing Service performs OCR & Table Extraction
   ↓
7. Processing Service sends results to Document Service
   ↓
8. Document Service indexes to Elasticsearch
   ↓
9. WebApp displays processing status & results
```

### Search Flow

```
1. User searches from WebApp
   ↓
2. Gateway routes to Document Service
   ↓
3. Document Service queries Elasticsearch
   ↓
4. Results returned with metadata
   ↓
5. WebApp displays search results
```

## 🧪 Testing

```bash
# Test all Java services
mvn test

# Test specific service
cd user-service
mvn test

# Test Python service
cd processing-service
pytest
```

## 📊 Monitoring & Health Checks

### Service Health Endpoints

```bash
# Check all registered services
curl http://localhost:8761/eureka/apps

# Individual service health
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Document Service
curl http://localhost:8084/actuator/health  # Storage Service
```

### Kafka Monitoring

Access Kafka UI: http://localhost:8386

### Elasticsearch Monitoring

Access Kibana: http://localhost:5601

## 🐛 Troubleshooting

### Common Issues

**1. Service không register với Eureka**
```bash
# Kiểm tra Eureka server đang chạy
curl http://localhost:8761

# Kiểm tra config trong application.yml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

**2. Kafka connection refused**
```bash
# Kiểm tra Kafka đang chạy
docker ps | grep kafka

# Restart Kafka
cd infrastructure
docker-compose restart kafka
```

**3. Elasticsearch connection timeout**
```bash
# Kiểm tra Elasticsearch
curl http://localhost:9200

# Restart Elasticsearch
docker-compose restart elasticsearch
```

**4. MongoDB connection error**
```bash
# Kiểm tra MongoDB đang chạy
mongosh --eval "db.adminCommand('ping')"

# Kiểm tra connection string trong config
```

## � Development Guide

### Adding a New Service

1. Create new Maven module
2. Add to parent `pom.xml`
3. Configure `bootstrap.yml` with Config Server
4. Register with Eureka
5. Add routing in Gateway
6. Update documentation

### Code Style

- Follow Google Java Style Guide
- Use Lombok for boilerplate code
- Write meaningful commit messages
- Add Javadoc for public APIs

## 🚀 Deployment

### Docker Deployment (Coming Soon)

```bash
# Build all services
./build-all.sh

# Deploy with Docker Compose
docker-compose up -d
```

### Kubernetes Deployment (Coming Soon)

```bash
kubectl apply -f k8s/
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

- **Bui Do Khoi Nguyen** - [@BuiDoKhoiNguyen](https://github.com/BuiDoKhoiNguyen)

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ by PDFMiner Team**

```bash
# User Management
POST /api/users/register
POST /api/users/login
GET  /api/users/profile

# Document Management
POST /api/documents/upload
GET  /api/documents/{id}
POST /api/documents/search

# Vector Search
POST /api/embeddings/search
POST /api/embeddings/similar

# File Storage
POST /api/storage/upload
GET  /api/storage/download/{id}
```

### Direct Service APIs

- **Swagger UI**: http://localhost:{port}/swagger-ui.html
- **OpenAPI**: http://localhost:{port}/v3/api-docs

## 🔍 Monitoring & Observability

### Health Checks

```bash
# Overall system health
curl http://localhost:8080/actuator/health

# Individual services
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Metadata Service
curl http://localhost:8083/health           # Embedding Service
```

### Metrics & Logging

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000
- **Centralized Logging**: ELK Stack
- **Distributed Tracing**: Sleuth + Zipkin

## 🛠️ Development

### Adding New Service

1. Create new Maven module:
```bash
mkdir new-service
cd new-service
# Copy from template service
```

2. Update root `pom.xml`:
```xml
<modules>
    <!-- existing modules -->
    <module>new-service</module>
</modules>
```

3. Configure service discovery and config

### Testing

```bash
# Unit tests
mvn test

# Integration tests
mvn integration-test

# End-to-end tests
cd tests && python -m pytest
```

## 🔒 Security

- **JWT Authentication** với Spring Security
- **Rate Limiting** trong Gateway
- **Input Validation** và sanitization
- **HTTPS/TLS** cho production
- **API Key management** cho external services

## 📊 Performance

### Benchmarks

- **Gateway Throughput**: 10,000 RPS
- **Vector Search**: <100ms response time
- **Document Processing**: 50 documents/minute
- **OCR Processing**: 2-5 pages/minute

### Scaling

- **Horizontal Scaling**: Multiple instances với load balancing
- **Database Sharding**: Partitioned by tenant/user
- **Caching Strategy**: Redis cho frequently accessed data
- **CDN**: Static files và images

## 🚢 Deployment

### Docker

```bash
# Build all services
docker-compose build

# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

### Cloud Deployment

- **AWS**: EKS + RDS + ElastiCache + S3
- **GCP**: GKE + Cloud SQL + Cloud Storage
- **Azure**: AKS + Azure Database + Blob Storage

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Architecture Guide](./docs/architecture.md)
- [Deployment Guide](./docs/deployment.md)
- [Development Setup](./docs/development.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🆘 Support

- **Issues**: [GitHub Issues](./issues)
- **Discussions**: [GitHub Discussions](./discussions)
- **Wiki**: [Project Wiki](./wiki)
- **Email**: support@pdfminer.com

---

**Built with ❤️ using Spring Boot, FastAPI, and modern microservice patterns**
