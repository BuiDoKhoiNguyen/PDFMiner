import cv2
import numpy as np
import os
import sys
from PaddleOCR import PaddleOCR
from vietocr.vietocr.tool.predictor import Predictor
from vietocr.vietocr.tool.config import Cfg

class TableCellExtractor:
    def __init__(self, cells_folder="./process_images/table_cells"):
        self.cells_folder = cells_folder
        # Khởi tạo PaddleOCR cho text detection
        self.paddle_ocr = PaddleOCR(use_angle_cls=False, lang='en', det=True, rec=False)
        config = Cfg.load_config_from_name('vgg_transformer')
        # config = Cfg.load_config_from_file('vietocr/config.yml')
        # config['weights'] = '/Users/bmd1905/Desktop/pretrain_ocr/vi00_vi01_transformer.pth'

        config['cnn']['pretrained'] = True
        config['predictor']['beamsearch'] = True
        config['device'] = 'mps' # mps
        self.viet_ocr = Predictor(config)
        
        # Tạo thư mục lưu kết quả nếu chưa tồn tại
        os.makedirs("./extracted_text", exist_ok=True)
        
    def execute(self):
        """Xử lý tất cả các cell trong thư mục và trích xuất văn bản"""
        self.results = {}
        # Lấy tất cả file ảnh cell trong thư mục
        cell_files = [f for f in os.listdir(self.cells_folder) if f.startswith("cell_") and f.endswith(".jpg")]
        
        # Sắp xếp theo số thứ tự
        cell_files.sort(key=lambda x: int(x.split("_")[1].split(".")[0]))
        
        for cell_file in cell_files:
            cell_path = os.path.join(self.cells_folder, cell_file)
            cell_index = int(cell_file.split("_")[1].split(".")[0])
            
            # Xử lý từng cell
            self.process_cell(cell_path, cell_index)
            
        # Tạo CSV từ kết quả
        self.generate_csv()
        
        return self.results
    
    def process_cell(self, cell_path, cell_index):
        """Xử lý một cell riêng lẻ sử dụng PaddleOCR và VietOCR"""
        # Đọc ảnh cell
        image = cv2.imread(cell_path)
        
        # Bước 1: Sử dụng PaddleOCR để phát hiện text areas
        result = self.paddle_ocr.ocr(cell_path, cls=False)
        
        # Kết quả từ PaddleOCR là danh sách các box và confidence
        if not result or not result[0]:
            # Không tìm thấy text nào
            self.results[cell_index] = ""
            return
        
        text_areas = []
        for line in result[0]:
            # PaddleOCR trả về tọa độ của 4 điểm của box
            box = line[0]
            # Tính toán bounding box từ 4 điểm
            x_min = min(point[0] for point in box)
            y_min = min(point[1] for point in box)
            x_max = max(point[0] for point in box)
            y_max = max(point[1] for point in box)
            
            # Thêm padding để không cắt mất phần của ký tự
            padding = 5
            x_min = max(0, x_min - padding)
            y_min = max(0, y_min - padding)
            x_max = min(image.shape[1], x_max + padding)
            y_max = min(image.shape[0], y_max + padding)
            
            text_area = image[int(y_min):int(y_max), int(x_min):int(x_max)]
            if text_area.size == 0:
                continue
                
            # Lưu ảnh text area để debug
            text_area_path = f"./extracted_text/cell_{cell_index}_text_{len(text_areas)}.jpg"
            cv2.imwrite(text_area_path, text_area)
            
            text_areas.append({
                'image': text_area,
                'path': text_area_path,
                'box': (int(x_min), int(y_min), int(x_max), int(y_max))
            })
        
        # Bước 2: Sử dụng VietOCR để nhận dạng văn bản trong từng text area
        recognized_texts = []
        for area in text_areas:
            # Sử dụng PIL Image cho VietOCR
            from PIL import Image
            pil_image = Image.open(area['path'])
            
            # Nhận dạng văn bản
            text = self.viet_ocr.predict(pil_image)
            recognized_texts.append(text)
        
        # Kết hợp các đoạn văn bản thành một đoạn hoàn chỉnh
        complete_text = " ".join(recognized_texts)
        self.results[cell_index] = complete_text.strip()
        
        # Tạo ảnh kết quả với bounding box để kiểm tra
        result_image = image.copy()
        for area in text_areas:
            x_min, y_min, x_max, y_max = area['box']
            cv2.rectangle(result_image, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)
        
        # Lưu ảnh kết quả
        cv2.imwrite(f"./extracted_text/cell_{cell_index}_result.jpg", result_image)
    
    def generate_csv(self):
        """Tạo file CSV từ kết quả nhận dạng"""
        # Chuyển từ dict sang danh sách có thứ tự
        sorted_results = [(idx, text) for idx, text in sorted(self.results.items())]
        
        # Tạo cấu trúc bảng từ kết quả
        with open("output_paddle_vietocr.csv", "w", encoding="utf-8") as f:
            for idx, text in sorted_results:
                f.write(f"{idx},{text}\n")