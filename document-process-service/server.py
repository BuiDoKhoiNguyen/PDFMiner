from fastapi import FastAPI, File, UploadFile
import boto3
import pypdf
import os
import pytesseract
from pdf2image import convert_from_path
from dotenv import load_dotenv
from gemini_nomalizer import normalize_document_data
from datetime import datetime
# uvicorn server:app --reload
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
    
def truncate_text_for_gemini(text, max_chars=15000):
    if len(text) <= max_chars:
        return text
    
    first_part = text[:int(max_chars * 0.6)]
    last_part = text[-int(max_chars * 0.4):]
    
    return first_part + "\n\n[...Nội dung ở giữa được cắt bỏ...]\n\n" + last_part

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with open(pdf_path, "rb") as f:
            reader = pypdf.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception as e:
        print(f"Lỗi khi đọc PDF với pypdf: {str(e)}")
    
    if len(text.strip()) < 100:
        try:
            images = convert_from_path(pdf_path)
            
            text = ""
            for i, image in enumerate(images):
                page_text = pytesseract.image_to_string(image, lang='vie+eng')
                text += f"--- Trang {i+1} ---\n{page_text}\n\n"
        except Exception as e:
            print(f"Lỗi khi thực hiện OCR: {str(e)}")
            return "Không thể trích xuất văn bản từ file PDF này."
    
    return text.strip()

@app.post("/upload/")
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