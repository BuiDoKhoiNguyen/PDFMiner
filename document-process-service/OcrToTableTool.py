import cv2
import numpy as np
import os
from vietocr.vietocr.tool.predictor import Predictor
from vietocr.vietocr.tool.config import Cfg
from PIL import Image
import sys
from PaddleOCR.paddleocr import PaddleOCR

# Cấu hình VietOCR
config = Cfg.load_config_from_name('vgg_transformer')
# config = Cfg.load_config_from_file('vietocr/config.yml')
# config['weights'] = '/Users/bmd1905/Desktop/pretrain_ocr/vi00_vi01_transformer.pth'

config['cnn']['pretrained'] = True
config['predictor']['beamsearch'] = True
config['device'] = 'mps' # mps
recognitor = Predictor(config)

detector = PaddleOCR(use_angle_cls=False, lang="vi", use_gpu=False)

class OcrToTableTool:

    def __init__(self, image, original_image):
        self.thresholded_image = image
        self.original_image = original_image
        self.use_contour_method = False  # Sử dụng phương pháp phát hiện bảng mặc định

    def execute(self):
        # Tạo thư mục lưu trữ nếu chưa tồn tại
        os.makedirs("./ocr_slices", exist_ok=True)
        
        # Phương pháp cũ: Dựa vào contours
        if self.use_contour_method:
            self.dilate_image()
            self.store_process_image('0_dilated_image.jpg', self.dilated_image)
            self.find_contours()
            self.store_process_image('1_contours.jpg', self.image_with_contours_drawn)
            self.convert_contours_to_bounding_boxes()
            self.store_process_image('2_bounding_boxes.jpg', self.image_with_all_bounding_boxes)
            self.mean_height = self.get_mean_height_of_bounding_boxes()
            self.sort_bounding_boxes_by_y_coordinate()
            self.club_all_bounding_boxes_by_similar_y_coordinates_into_rows()
            self.sort_all_rows_by_x_coordinate()
            self.crop_each_bounding_box_and_ocr()
        # Phương pháp mới: Dựa vào phát hiện đường viền bảng
        else:
            self.detect_table_structure()
            self.crop_each_cell_and_ocr()
        
        self.generate_csv_file()

    def threshold_image(self):
        return cv2.threshold(self.grey_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    def convert_image_to_grayscale(self):
        return cv2.cvtColor(self.image, self.dilated_image)

    def dilate_image(self):
        kernel_to_remove_gaps_between_words = np.array([
                [1,1,1,1,1,1,1,1,1,1],
               [1,1,1,1,1,1,1,1,1,1]
        ])
        self.dilated_image = cv2.dilate(self.thresholded_image, kernel_to_remove_gaps_between_words, iterations=5)
        simple_kernel = np.ones((5,5), np.uint8)
        self.dilated_image = cv2.dilate(self.dilated_image, simple_kernel, iterations=2)
    
    def find_contours(self):
        result = cv2.findContours(self.dilated_image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        self.contours = result[0]
        self.image_with_contours_drawn = self.original_image.copy()
        cv2.drawContours(self.image_with_contours_drawn, self.contours, -1, (0, 255, 0), 3)
    
    def approximate_contours(self):
        self.approximated_contours = []
        for contour in self.contours:
            approx = cv2.approxPolyDP(contour, 3, True)
            self.approximated_contours.append(approx)

    def draw_contours(self):
        self.image_with_contours = self.original_image.copy()
        cv2.drawContours(self.image_with_contours, self.approximated_contours, -1, (0, 255, 0), 5)

    def convert_contours_to_bounding_boxes(self):
        self.bounding_boxes = []
        self.image_with_all_bounding_boxes = self.original_image.copy()
        for contour in self.contours:
            x, y, w, h = cv2.boundingRect(contour)
            self.bounding_boxes.append((x, y, w, h))
            self.image_with_all_bounding_boxes = cv2.rectangle(self.image_with_all_bounding_boxes, (x, y), (x + w, y + h), (0, 255, 0), 5)

    def get_mean_height_of_bounding_boxes(self):
        heights = []
        for bounding_box in self.bounding_boxes:
            x, y, w, h = bounding_box
            heights.append(h)
        return np.mean(heights)

    def sort_bounding_boxes_by_y_coordinate(self):
        self.bounding_boxes = sorted(self.bounding_boxes, key=lambda x: x[1])

    def club_all_bounding_boxes_by_similar_y_coordinates_into_rows(self):
        self.rows = []
        half_of_mean_height = self.mean_height / 2
        current_row = [ self.bounding_boxes[0] ]
        for bounding_box in self.bounding_boxes[1:]:
            current_bounding_box_y = bounding_box[1]
            previous_bounding_box_y = current_row[-1][1]
            distance_between_bounding_boxes = abs(current_bounding_box_y - previous_bounding_box_y)
            if distance_between_bounding_boxes <= half_of_mean_height:
                current_row.append(bounding_box)
            else:
                self.rows.append(current_row)
                current_row = [ bounding_box ]
        self.rows.append(current_row)

    def sort_all_rows_by_x_coordinate(self):
        for row in self.rows:
            row.sort(key=lambda x: x[0])

    def crop_each_bounding_box_and_ocr(self):
        """
        Cắt từng bounding box (đại diện cho cell của bảng) và thực hiện OCR
        Sử dụng PaddleOCR để phát hiện text regions trong cell
        Sau đó sử dụng VietOCR để nhận dạng text từ các regions đó
        """
        self.table = []
        current_row = []
        image_number = 0
        for row in self.rows:
            for bounding_box in row:
                x, y, w, h = bounding_box
                y = max(0, y - 5)  # Tránh index âm
                cropped_image = self.original_image[y:y+h, x:x+w]
                image_slice_path = "./ocr_slices/img_" + str(image_number) + ".jpg"
                cv2.imwrite(image_slice_path, cropped_image)
                
                # Sử dụng PaddleOCR để phát hiện các text regions trong cell
                results_from_ocr = self.extract_text_from_cell(image_slice_path)
                
                # Thêm kết quả vào hàng hiện tại
                current_row.append(results_from_ocr)
                image_number += 1
            
            # Thêm hàng vào bảng và reset hàng hiện tại
            self.table.append(current_row)
            current_row = []

    def extract_text_from_cell(self, image_path):
        """
        Trích xuất text từ một cell bằng cách:
        1. Sử dụng PaddleOCR để phát hiện các vùng có text
        2. Sử dụng VietOCR để nhận dạng text từ các vùng đó
        3. Gộp tất cả text trong cell thành một chuỗi duy nhất
        
        Args:
            image_path: Đường dẫn đến hình ảnh của cell
            
        Returns:
            Chuỗi text đã được gộp từ tất cả các text regions trong cell
        """
        try:
            # Đọc ảnh
            img = cv2.imread(image_path)
            if img is None:
                return ""
                
            # Sử dụng PaddleOCR để phát hiện các text regions
            result = detector.ocr(img, cls=False, det=True, rec=False)
            
            if not result or len(result) == 0:
                # Nếu PaddleOCR không phát hiện được text, thử dùng VietOCR trực tiếp
                return self.get_result_from_vietocr(image_path)
            
            # Gộp các text từ các regions đã phát hiện
            # PaddleOCR trả về list của list với mỗi phần tử là [box, [text, confidence]]
            texts = []
            for line in result[0]:
                # Lấy ảnh của region đã phát hiện
                box = line[0]
                if not box or len(box) != 4:  # Box phải có 4 điểm
                    continue
                
                # Chuyển box về dạng tọa độ nguyên
                box = np.array(box).astype(np.int32)
                
                # Tạo mask từ box để cắt region chứa text
                x_min = max(0, min(box[:, 0]))
                y_min = max(0, min(box[:, 1]))
                x_max = max(box[:, 0])
                y_max = max(box[:, 1])
                
                # Cắt region chứa text
                if x_min < x_max and y_min < y_max:
                    text_region = img[y_min:y_max, x_min:x_max]
                    
                    # Lưu region để nhận dạng bằng VietOCR
                    region_path = image_path.replace(".jpg", f"_region_{len(texts)}.jpg")
                    cv2.imwrite(region_path, text_region)
                    
                    # Nhận dạng text bằng VietOCR
                    recognized_text = self.get_result_from_vietocr(region_path)
                    if recognized_text.strip():
                        texts.append(recognized_text)
            
            # Nếu không có text nào được phát hiện, thử dùng VietOCR trực tiếp
            if not texts:
                return self.get_result_from_vietocr(image_path)
                
            # Gộp tất cả text thành một chuỗi, mỗi phần cách nhau bằng dấu xuống dòng
            return "\n".join(texts)
            
        except Exception as e:
            print(f"Lỗi khi xử lý cell: {str(e)}")
            return ""

    def get_result_from_vietocr(self, image_path):
        """
        Nhận diện text từ hình ảnh sử dụng VietOCR
        
        Args:
            image_path: Đường dẫn đến hình ảnh cần nhận diện
            
        Returns:
            Chuỗi text đã được nhận diện
        """
        try:
            img = Image.open(image_path)
            
            # Thực hiện dự đoán
            result = recognitor.predict(img)
            
            # Trả về kết quả đã được cắt khoảng trắng
            return result.strip()
        except Exception as e:
            print(f"Lỗi khi sử dụng VietOCR: {str(e)}")
            return ""

    def get_result_from_tersseract(self, image_path):
        """
        Phương thức cũ, được giữ lại để tương thích với mã hiện có
        """
        return self.get_result_from_vietocr(image_path)
        
    def detect_table_structure(self):
        """
        Phát hiện cấu trúc bảng bằng cách:
        1. Chuyển đổi ảnh sang ảnh xám
        2. Áp dụng bộ lọc để phát hiện các đường kẻ ngang và dọc
        3. Kết hợp các đường kẻ để xác định các giao điểm
        4. Từ các giao điểm, xây dựng các cell của bảng
        """
        # Chuyển đổi ảnh sang ảnh xám
        gray = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2GRAY)
        
        # Áp dụng bộ lọc Gaussian để giảm nhiễu
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Phát hiện cạnh bằng Canny
        edges = cv2.Canny(blurred, 50, 150)
        
        # Tạo kernel để phát hiện đường kẻ ngang và dọc
        kernel_horizontal = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1))
        kernel_vertical = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25))
        
        # Phát hiện đường kẻ ngang
        horizontal_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel_horizontal)
        horizontal_lines_dilated = cv2.dilate(horizontal_lines, kernel_horizontal, iterations=1)
        
        # Phát hiện đường kẻ dọc
        vertical_lines = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel_vertical)
        vertical_lines_dilated = cv2.dilate(vertical_lines, kernel_vertical, iterations=1)
        
        # Kết hợp đường kẻ ngang và dọc
        table_lines = cv2.addWeighted(horizontal_lines_dilated, 1, vertical_lines_dilated, 1, 0)
        
        # Tìm các contour của các cell
        contours, _ = cv2.findContours(table_lines, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        # Lọc các contour theo kích thước
        min_area = 100  # Diện tích tối thiểu của cell
        self.cells = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            if w * h > min_area:
                self.cells.append((x, y, w, h))
        
        # Lưu ảnh để debug
        table_lines_image = self.original_image.copy()
        for cell in self.cells:
            x, y, w, h = cell
            cv2.rectangle(table_lines_image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        self.store_process_image('3_table_structure.jpg', table_lines_image)
        
        # Sắp xếp các cell theo hàng và cột
        self.sort_cells_by_position()

    def sort_cells_by_position(self):
        """
        Sắp xếp các cell theo vị trí trong bảng.
        Đầu tiên nhóm các cell có tọa độ Y gần nhau vào cùng một hàng,
        sau đó sắp xếp các cell trong mỗi hàng theo tọa độ X.
        """
        if not hasattr(self, 'cells') or not self.cells:
            self.cell_rows = []
            return
            
        # Sắp xếp tất cả các cell theo tọa độ Y
        sorted_cells = sorted(self.cells, key=lambda x: x[1])
        
        # Tính khoảng cách trung bình giữa các cell theo chiều Y
        y_coords = [cell[1] for cell in sorted_cells]
        y_diffs = [y_coords[i+1] - y_coords[i] for i in range(len(y_coords)-1)]
        if not y_diffs:
            threshold_y = 10  # Giá trị mặc định nếu chỉ có một cell
        else:
            avg_y_diff = sum(y_diffs) / len(y_diffs)
            threshold_y = avg_y_diff * 0.5  # Ngưỡng để xác định các cell cùng hàng
        
        # Nhóm các cell vào các hàng dựa trên tọa độ Y
        self.cell_rows = []
        current_row = [sorted_cells[0]]
        
        for cell in sorted_cells[1:]:
            if abs(cell[1] - current_row[0][1]) <= threshold_y:
                current_row.append(cell)
            else:
                # Sắp xếp các cell trong hàng hiện tại theo tọa độ X
                current_row.sort(key=lambda x: x[0])
                self.cell_rows.append(current_row)
                current_row = [cell]
                
        # Thêm hàng cuối cùng
        if current_row:
            current_row.sort(key=lambda x: x[0])
            self.cell_rows.append(current_row)
            
        # Debug: Vẽ các cell đã được sắp xếp
        debug_image = self.original_image.copy()
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255), (0, 255, 255)]
        
        for row_idx, row in enumerate(self.cell_rows):
            color = colors[row_idx % len(colors)]
            for cell in row:
                x, y, w, h = cell
                cv2.rectangle(debug_image, (x, y), (x + w, y + h), color, 2)
                
        self.store_process_image('4_sorted_cells.jpg', debug_image)

    def crop_each_cell_and_ocr(self):
        """
        Cắt và OCR từng cell trong bảng đã phát hiện.
        Lưu hình ảnh cell theo định dạng row_{row_idx}_col_{col_idx}.jpg
        """
        if not hasattr(self, 'cell_rows') or not self.cell_rows:
            print("Không có cell nào được phát hiện!")
            return
            
        self.table = []
        
        # Tạo thư mục để lưu các cell
        os.makedirs("./ocr_slices", exist_ok=True)
        
        # Xóa các file cũ trong thư mục ocr_slices
        for file in os.listdir("./ocr_slices"):
            if file.endswith(".jpg"):
                os.remove(os.path.join("./ocr_slices", file))
        
        for row_idx, row in enumerate(self.cell_rows):
            current_row = []
            for col_idx, cell in enumerate(row):
                x, y, w, h = cell
                
                # Cắt cell từ ảnh gốc, thêm padding nhỏ
                padding = 2
                x = max(0, x - padding)
                y = max(0, y - padding)
                w = min(self.original_image.shape[1] - x, w + 2*padding)
                h = min(self.original_image.shape[0] - y, h + 2*padding)
                
                cropped_cell = self.original_image[y:y+h, x:x+w]
                
                # Lưu cell với tên có ý nghĩa
                cell_image_path = f"./ocr_slices/row_{row_idx}_col_{col_idx}.jpg"
                cv2.imwrite(cell_image_path, cropped_cell)
                
                # Trích xuất text từ cell
                cell_text = self.extract_text_from_cell(cell_image_path)
                current_row.append(cell_text)
                
            self.table.append(current_row)

    def generate_csv_file(self):
        """
        Tạo file CSV từ bảng đã được nhận diện
        Xử lý đặc biệt với các ô có nhiều dòng để đảm bảo định dạng CSV chính xác
        """
        with open("output.csv", "w", encoding='utf-8') as f:
            for row in self.table:
                # Xử lý các ô có xuống dòng trong nội dung
                processed_row = []
                for cell in row:
                    # Nếu cell chứa ký tự đặc biệt của CSV (dấu phẩy, dấu ngoặc kép hoặc xuống dòng)
                    if ',' in cell or '"' in cell or '\n' in cell:
                        # Thay thế dấu ngoặc kép bằng hai dấu ngoặc kép (chuẩn CSV)
                        cell = cell.replace('"', '""')
                        # Bọc nội dung trong dấu ngoặc kép
                        processed_row.append(f'"{cell}"')
                    else:
                        processed_row.append(cell)
                f.write(",".join(processed_row) + "\n")

    def store_process_image(self, file_name, image):
        path = "./process_images/ocr_table_tool/" + file_name
        cv2.imwrite(path, image)