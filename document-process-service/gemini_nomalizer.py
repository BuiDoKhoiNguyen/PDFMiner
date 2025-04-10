import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def normalize_document_data(text):

    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = """
    Hãy phân tích nội dung văn bản công văn sau và trích xuất các thông tin CHÍNH XÁC theo định dạng JSON với các trường sau:
    
    1. documentNumber: Số hiệu văn bản (ví dụ: "123/QĐ-TTg", "45/2022/NĐ-CP")
    2. title: Tiêu đề hoặc trích yếu của văn bản
    3. content: Nội dung chính của văn bản (5000-10000 ký tự)
    4. documentType: Loại văn bản (Quyết định, Thông tư, Nghị định, Công văn,...)
    5. issuingAgency: Cơ quan ban hành (ví dụ: Bộ Tài Chính, UBND Hà Nội)
    6. signer: Người ký văn bản (họ tên và chức vụ nếu có)
    7. issueDate: Ngày ban hành (định dạng: YYYY-MM-DD)
    8. status: Tình trạng văn bản (mặc định là "Còn hiệu lực" nếu không có thông tin)
    
    Lưu ý:
    - Văn bản đã bị cắt ngắn vì độ dài. Hãy tập trung phân tích các thông tin metadata từ phần đầu và cuối văn bản.
    - Nếu không tìm thấy thông tin cho bất kỳ trường nào, hãy để giá trị là null
    - Đối với trường issueDate, phải đảm bảo định dạng là YYYY-MM-DD
    - Trả về CHÍNH XÁC cấu trúc JSON theo mẫu, không thêm các trường khác
    - KHÔNG bao gồm các ký tự markdown, chỉ trả về JSON thuần túy
    
    Văn bản:
    """
    
    prompt += text
    
    try:
        response = model.generate_content(prompt)

        response_text = response.text
        
        try:
            if "```json" in response_text:
                json_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_text = response_text.split("```")[1].strip()
            else:
                json_text = response_text.strip()

            normalized_data = json.loads(json_text)

            required_fields = ["documentNumber", "title", "content", "documentType", 
                              "issuingAgency", "signer", "issueDate", "status"]
            
            for field in required_fields:
                if field not in normalized_data:
                    normalized_data[field] = None
            
            if normalized_data["issueDate"]:
                try:
                    date_obj = None
                    for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"]:
                        try:
                            date_obj = datetime.strptime(normalized_data["issueDate"], fmt)
                            break
                        except ValueError:
                            continue
                    
                    if date_obj:
                        normalized_data["issueDate"] = date_obj.strftime("%Y-%m-%d")
                except:

                    pass
            
            normalized_data["titleSuggest"] = {
                "input": normalized_data["title"] if normalized_data["title"] else ""
            }
                
            return normalized_data
            
        except json.JSONDecodeError:
            return {
                "error": "Không thể phân tích JSON",
                "raw_response": response_text,
                "documentNumber": None,
                "title": None,
                "content": None,
                "documentType": None,
                "issuingAgency": None,
                "signer": None,
                "issueDate": None,
                "status": "Không xác định",
                "titleSuggest": {"input": ""}
            }
            
    except Exception as e:
        return {
            "error": str(e),
            "documentNumber": None,
            "title": None,
            "content": None,
            "documentType": None,
            "issuingAgency": None,
            "signer": None,
            "issueDate": None,
            "status": "Không xác định",
            "titleSuggest": {"input": ""}
        }