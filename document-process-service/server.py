from fastapi import FastAPI, File, UploadFile
import boto3
import os
import cv2
from PIL import Image
from pdf2image import convert_from_path
from dotenv import load_dotenv
from gemini_nomalizer import normalize_document_data
from datetime import datetime
import json
from kafka import KafkaProducer
import requests

from vietocr.vietocr.tool.predictor import Predictor
from vietocr.vietocr.tool.config import Cfg
from PaddleOCR import PaddleOCR

# python -m uvicorn server:app --reload
load_dotenv()

app = FastAPI()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "s3pdfminer")
S3_REGION = os.getenv("S3_REGION", "ap-southeast-1")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
DOCUMENT_SERVICE_URL = os.getenv("DOCUMENT_SERVICE_URL", "http://document-service:8080")

s3_client = None
if AWS_ACCESS_KEY and AWS_SECRET_KEY:
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name=S3_REGION
    )

# Khởi tạo Kafka producer
kafka_producer = None
try:
    kafka_producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        key_serializer=str.encode
    )
    print("Kafka producer initialized successfully")
except Exception as e:
    print(f"Failed to initialize Kafka producer: {str(e)}")
    # Fallback để vẫn hoạt động khi không có Kafka
    kafka_producer = None

def init_models():
    config = Cfg.load_config_from_name('vgg_transformer')
    config['cnn']['pretrained'] = True
    config['predictor']['beamsearch'] = True
    config['device'] = 'mps' 
    recognitor = Predictor(config)

    detector = PaddleOCR(use_angle_cls=False, lang="vi", use_gpu=False)
    
    return recognitor, detector

recognitor, detector = init_models()

def truncate_text_for_gemini(text, max_chars=15000):
    if len(text) <= max_chars:
        return text
    
    first_part = text[:int(max_chars * 0.6)]
    last_part = text[-int(max_chars * 0.4):]
    
    return first_part + "\n\n[...Nội dung ở giữa được cắt bỏ...]\n\n" + last_part

def predict(img_path, padding=4):
    # Load image
    img = cv2.imread(img_path)

    # Text detection
    result = detector.ocr(img_path, cls=False, det=True, rec=False)
    result = result[:][:][0]

    # Filter Boxes
    boxes = []
    for line in result:
        boxes.append([[int(line[0][0]), int(line[0][1])], [int(line[2][0]), int(line[2][1])]])
    boxes = boxes[::-1]

    # Add padding to boxes
    padding = 4
    for box in boxes:
        box[0][0] = box[0][0] - padding
        box[0][1] = box[0][1] - padding
        box[1][0] = box[1][0] + padding
        box[1][1] = box[1][1] + padding

    # Text recognizion
    texts = []
    for box in boxes:
        cropped_image = img[box[0][1]:box[1][1], box[0][0]:box[1][0]]
        try:
            cropped_image = Image.fromarray(cropped_image)
        except:
            continue

        rec_result = recognitor.predict(cropped_image)

        text = rec_result
        print(text)
        texts.append(text)
    return texts

def extract_text_from_pdf(pdf_path):
    try:
        images = convert_from_path(pdf_path, dpi=400)
        
        full_text = ""
        for i, image in enumerate(images):
            temp_img_path = f"/tmp/page_{i}.png"
            image.save(temp_img_path, "PNG")
            
            page_text =predict(temp_img_path)
            
            full_text += f"--- Trang {i+1} ---\n{page_text}\n\n"
            os.remove(temp_img_path)

        if not full_text.strip():
            return "Không thể trích xuất văn bản từ file PDF này."

        return full_text.strip()

    except Exception as e:
        print(f"Lỗi khi xử lý PDF: {str(e)}")
        return "Không thể xử lý file PDF này."
    

# Endpoint /upload đã được loại bỏ vì chức năng đã được thay thế bằng xử lý qua Kafka
# Nếu cần chạy thử nghiệm trực tiếp mà không qua Kafka, bạn có thể sử dụng /process-document với tham số URL

@app.post("/process-document")
async def process_document_from_kafka(document_data: dict):
    """
    Endpoint để xử lý tài liệu từ Kafka consumer
    """
    try:
        print(f"Nhận yêu cầu xử lý tài liệu với ID: {document_data.get('documentId')}")
        document_id = document_data.get("documentId")
        file_url = document_data.get("fileUrl")
        print(f"Nhận file URL: {file_url}")
        if not document_id or not file_url:
            return {"error": "Missing documentId or fileUrl"}
        
        # Tải file từ URL
        file_name = file_url.split("/")[-1]
        file_path = f"/tmp/{file_name}"
        
        # Tải file từ S3 hoặc từ URL
        try:
            response = requests.get(file_url)
            with open(file_path, "wb") as f:
                f.write(response.content)
        except:
            # Thử lấy từ S3 nếu lấy trực tiếp từ URL thất bại
            try:
                s3_client.download_file(S3_BUCKET_NAME, file_name, file_path)
            except Exception as s3_error:
                print(f"Lỗi khi tải file từ S3: {str(s3_error)}")
                return {"error": f"Không thể tải file: {str(s3_error)}"}
        
        # Xử lý file
        extracted_text = extract_text_from_pdf(file_path)
        extracted_text = truncate_text_for_gemini(extracted_text)
        document_data = normalize_document_data(extracted_text)
        
        # Chuẩn bị dữ liệu kết quả
        result_data = {
            "documentId": document_id,
            "documentNumber": document_data.get("documentNumber", file_name),
            "documentName": file_name,
            "title": document_data.get("title", file_name),
            "content": document_data.get("content", extracted_text),
            "documentType": document_data.get("documentType", "Unknown"),
            "issuingAgency": document_data.get("issuingAgency", "Unknown"),
            "signer": document_data.get("signer", "Unknown"),
            "issueDate": document_data.get("issueDate", datetime.now().strftime("%Y-%m-%d")),
            "status": "COMPLETED",
            "fileUrl": file_url,
        }
        
        # Gửi kết quả về qua Kafka
        if kafka_producer:
            kafka_producer.send('file-text-extracted', key=document_id, value=result_data)
            print(f"Đã gửi kết quả xử lý qua Kafka với document ID: {document_id}")
        else:
            # Fallback to HTTP if Kafka is not available
            try:
                requests.post(f"{DOCUMENT_SERVICE_URL}/api/documents/process", json=result_data)
                print(f"Đã gửi kết quả xử lý qua HTTP với document ID: {document_id}")
            except Exception as http_e:
                print(f"Lỗi khi gửi kết quả qua HTTP: {str(http_e)}")
        
        # Xóa file tạm
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {"success": True, "documentId": document_id, "message": "Document processed successfully"}
    
    except Exception as e:
        print(f"Lỗi khi xử lý tài liệu: {str(e)}")
        return {"error": str(e)}