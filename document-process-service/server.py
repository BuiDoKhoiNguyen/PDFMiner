from fastapi import FastAPI, File, UploadFile
import boto3
import os
import cv2
from PIL import Image
from pdf2image import convert_from_path
from dotenv import load_dotenv
from gemini_nomalizer import normalize_document_data
from datetime import datetime

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

s3_client = None
if AWS_ACCESS_KEY and AWS_SECRET_KEY:
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
        region_name=S3_REGION
    )

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
    

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = f"/tmp/{file.filename}"
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    try:
        extracted_text = extract_text_from_pdf(file_path)
        extracted_text = truncate_text_for_gemini(extracted_text)
        
        s3_client.upload_file(file_path, S3_BUCKET_NAME, file.filename)
        file_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{file.filename}"
        
        document_data = normalize_document_data(extracted_text)
        
        os.remove(file_path)
        
        return {
            "documentNumber": document_data.get("documentNumber", file.filename),
            "documentName": file.filename,
            "title": document_data.get("title", file.filename),
            "content": document_data.get("content", extracted_text),
            "documentType": document_data.get("documentType", "Unknown"),
            "issuingAgency": document_data.get("issuingAgency", "Unknown"),
            "signer": document_data.get("signer", "Unknown"),
            "issueDate": document_data.get("issueDate", datetime.now().strftime("%Y-%m-%d")),
            "status": document_data.get("status", "Active"),
            "fileLink": file_url,
        }
    except Exception as e:
        return {
            "error": str(e),
            "file_name": file.filename
        }