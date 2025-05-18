import os
import argparse
import tempfile
from pdf2image import convert_from_path
from pathlib import Path
import time

# Import các thư viện OCR
import cv2
from PIL import Image
import torch
from vietocr.vietocr.tool.predictor import Predictor
from vietocr.vietocr.tool.config import Cfg
from PaddleOCR import PaddleOCR

def init_models(use_gpu=False):
    """Khởi tạo mô hình VietOCR và PaddleOCR"""
    # Cấu hình VietOCR
    config = Cfg.load_config_from_name('vgg_transformer')
    config['cnn']['pretrained'] = True
    config['predictor']['beamsearch'] = True
    
    # Chọn device
    if use_gpu and torch.cuda.is_available():
        config['device'] = 'cuda'
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        config['device'] = 'mps'  # MacOS với Apple Silicon
    else:
        config['device'] = 'cpu'
    
    recognitor = Predictor(config)
    print(f"Đã khởi tạo VietOCR với thiết bị: {config['device']}")
    
    # Cấu hình PaddleOCR
    detector = PaddleOCR(use_angle_cls=False, lang="vi", use_gpu=use_gpu)
    print(f"Đã khởi tạo PaddleOCR với use_gpu={use_gpu}")
    
    return recognitor, detector

def process_image_with_vietocr(recognitor, detector, img_path, padding=4):
    """Xử lý ảnh với PaddleOCR (phát hiện) và VietOCR (nhận dạng)"""
    try:
        # Load ảnh
        img = cv2.imread(img_path)
        if img is None:
            print(f"Không thể đọc ảnh: {img_path}")
            return ""
        
        # Phát hiện vùng văn bản với PaddleOCR
        result = detector.ocr(img_path, cls=False, det=True, rec=False)
        if not result or len(result) == 0 or not result[0]:
            print(f"Không phát hiện được văn bản trong ảnh: {img_path}")
            return ""
        
        result = result[0]
        
        # Chuẩn bị các box
        boxes = []
        for line in result:
            boxes.append([[int(line[0][0]), int(line[0][1])], [int(line[2][0]), int(line[2][1])]])
        boxes = boxes[::-1]  # Đảo ngược thứ tự để đọc từ trên xuống
        
        # Thêm padding cho các box
        for box in boxes:
            box[0][0] = max(0, box[0][0] - padding)
            box[0][1] = max(0, box[0][1] - padding)
            box[1][0] = min(img.shape[1], box[1][0] + padding)
            box[1][1] = min(img.shape[0], box[1][1] + padding)
        
        # Nhận dạng văn bản trong từng box với VietOCR
        texts = []
        for box in boxes:
            try:
                cropped_image = img[box[0][1]:box[1][1], box[0][0]:box[1][0]]
                if cropped_image.size == 0:
                    continue
                    
                cropped_image = Image.fromarray(cropped_image)
                text = recognitor.predict(cropped_image)
                texts.append(text)
            except Exception as e:
                print(f"Lỗi khi xử lý box: {str(e)}")
                continue
        
        return "\n".join(texts)
    except Exception as e:
        print(f"Lỗi khi xử lý ảnh {img_path}: {str(e)}")
        return ""

def pdf_to_text(pdf_path, recognitor, detector, output_dir=None, dpi=300, save_images=False):
    """
    Chuyển đổi PDF thành ảnh và trích xuất văn bản
    
    Args:
        pdf_path: Đường dẫn đến file PDF
        recognitor: Model VietOCR
        detector: Model PaddleOCR
        output_dir: Thư mục đầu ra (nếu không có, sẽ sử dụng thư mục của PDF)
        dpi: Độ phân giải khi chuyển đổi PDF sang ảnh
        save_images: Có lưu lại các ảnh sau khi chuyển đổi không
    
    Returns:
        Văn bản đã trích xuất
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        print(f"File PDF không tồn tại: {pdf_path}")
        return ""
    
    # Xác định thư mục đầu ra
    if output_dir is None:
        output_dir = pdf_path.parent / "output"
    
    os.makedirs(output_dir, exist_ok=True)
    output_text_file = output_dir / f"{pdf_path.stem}.txt"
    
    print(f"Đang xử lý file PDF: {pdf_path}")
    start_time = time.time()
    
    try:
        # Chuyển PDF sang ảnh
        print("Đang chuyển đổi PDF thành ảnh...")
        images = convert_from_path(
            pdf_path,
            dpi=dpi,
            use_cropbox=True,
            strict=False
        )
        print(f"Đã chuyển đổi thành công {len(images)} trang")
        
        full_text = ""
        with tempfile.TemporaryDirectory() as temp_dir:
            for i, image in enumerate(images):
                print(f"Đang xử lý trang {i+1}/{len(images)}...")
                
                # Lưu ảnh
                if save_images:
                    img_path = os.path.join(output_dir, f"{pdf_path.stem}_page_{i+1}.png")
                else:
                    img_path = os.path.join(temp_dir, f"page_{i}.png")
                
                image.save(img_path, "PNG", quality=100, optimize=False)
                
                # Trích xuất văn bản
                page_text = process_image_with_vietocr(recognitor, detector, img_path, padding=8)
                if page_text:
                    full_text += f"--- Trang {i+1} ---\n{page_text}\n\n"
                
                # Không xóa file ảnh nếu cần lưu lại
                if not save_images and os.path.exists(img_path):
                    os.remove(img_path)
        
        # Lưu văn bản vào file
        if full_text:
            with open(output_text_file, "w", encoding="utf-8") as f:
                f.write(full_text)
            print(f"Đã lưu văn bản vào file: {output_text_file}")
        else:
            print(f"Không trích xuất được văn bản từ file PDF")
        
        end_time = time.time()
        print(f"Thời gian xử lý: {end_time - start_time:.2f} giây")
        
        return full_text
    
    except Exception as e:
        print(f"Lỗi khi xử lý file PDF: {str(e)}")
        return ""

def main():
    parser = argparse.ArgumentParser(description="Chuyển đổi PDF thành ảnh và trích xuất văn bản")
    parser.add_argument("--pdf", required=True, help="Đường dẫn đến file PDF")
    parser.add_argument("--output", default=None, help="Thư mục đầu ra (mặc định là ./output)")
    parser.add_argument("--dpi", type=int, default=300, help="Độ phân giải khi chuyển đổi PDF (mặc định: 300)")
    parser.add_argument("--save-images", action="store_true", help="Lưu lại các ảnh sau khi chuyển đổi")
    parser.add_argument("--use-gpu", action="store_true", help="Sử dụng GPU nếu có")
    
    args = parser.parse_args()
    
    # Khởi tạo model
    recognitor, detector = init_models(args.use_gpu)
    
    # Xử lý file PDF
    output_dir = args.output
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(os.path.abspath(args.pdf)), "output")
    
    # Tạo thư mục output nếu chưa tồn tại
    os.makedirs(output_dir, exist_ok=True)
    
    # Chuyển đổi PDF sang text
    pdf_to_text(args.pdf, recognitor, detector, output_dir, args.dpi, args.save_images)

if __name__ == "__main__":
    main()