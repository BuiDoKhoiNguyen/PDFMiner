# PDFMiner Microservice Architecture

Hệ thống microservice để xử lý, phân tích và tìm kiếm documents với vector embeddings và AI-powered search.

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gateway       │    │ Discovery       │    │ Config Server   │
│   (Port 8080)   │    │ Service         │    │ (Port 8888)     │
│                 │    │ (Port 8761)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User Service    │    │ Metadata        │    │ Storage         │
│ (Port 8081)     │    │ Service         │    │ Service         │
│                 │    │ (Port 8082)     │    │ (Port 8084)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Notification    │    │ Embedding       │    │ Audit Service   │
│ Service         │    │ Service         │    │                 │
│ (Port 8085)     │    │ (Port 8083)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                 │
        ┌─────────────────┐
        │ External        │
        │ Dependencies    │
        │                 │
        │ • Kafka         │
        │ • Zilliz Cloud  │
        │ • PostgreSQL    │
        │ • Redis         │
        └─────────────────┘
```

## 📦 Services

### Core Services (Java/Spring Boot)

| Service | Port | Description | Technology |
|---------|------|-------------|------------|
| **Gateway** | 8080 | API Gateway & Load Balancer | Spring Cloud Gateway |
| **Discovery** | 8761 | Service Registry | Eureka Server |
| **Config Server** | 8888 | Centralized Configuration | Spring Cloud Config |
| **User Service** | 8081 | User Management & Authentication | Spring Boot + JWT |
| **Metadata Service** | 8082 | Document Metadata & Search | Spring Boot + JPA |
| **Storage Service** | 8084 | File Storage & Management | Spring Boot + MinIO |
| **Notification Service** | 8085 | Email & Push Notifications | Spring Boot |
| **Audit Service** | - | Activity Logging & Monitoring | Spring Boot |

### AI/ML Services (Python)

| Service | Port | Description | Technology |
|---------|------|-------------|------------|
| **Embedding Service** | 8083 | Vector Embeddings & Similarity Search | Python + FastAPI + Zilliz Cloud |
| **OCR Service** | - | Document Text Extraction | Python + PaddleOCR + VietOCR |

## 🚀 Quick Start

### Prerequisites

- **Java 17+**
- **Maven 3.8+**
- **Python 3.9+**
- **Docker & Docker Compose**
- **PostgreSQL**
- **Redis**
- **Kafka**

### 1. Clone Repository

```bash
git clone <repository-url>
cd PDFMiner-microservice
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, Kafka
docker-compose -f infrastructure/docker-compose.yml up -d
```

### 3. Start Core Services

```bash
# Build all Java services
mvn clean compile

# Start Config Server (first)
cd config-server && mvn spring-boot:run &

# Start Discovery Service
cd discovery-service && mvn spring-boot:run &

# Start other services
cd gateway && mvn spring-boot:run &
cd user-service && mvn spring-boot:run &
cd metadata-service && mvn spring-boot:run &
cd storage-service && mvn spring-boot:run &
cd notification-service && mvn spring-boot:run &
```

### 4. Start AI/ML Services

```bash
# Embedding Service
cd embedding-service
chmod +x start.sh
./start.sh

# OCR Service
cd ocr-service
python server.py
```

### 5. Access Services

- **API Gateway**: http://localhost:8080
- **Discovery Dashboard**: http://localhost:8761
- **Embedding Service**: http://localhost:8083
- **Health Checks**: http://localhost:8080/actuator/health

## 🔧 Configuration

### Environment Variables

Create `.env` files in each service directory:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdfminer
DB_USERNAME=postgres
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Zilliz Cloud (for Embedding Service)
ZILLIZ_CLOUD_URI=your_zilliz_uri
ZILLIZ_CLOUD_TOKEN=your_zilliz_token
```

### Service Discovery

Services tự động register với Eureka Server:

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

## 📋 API Documentation

### Gateway Endpoints

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
