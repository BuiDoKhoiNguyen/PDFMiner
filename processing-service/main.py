import TableExtractor as te
import TableLinesRemover as tlr
import TableCellExtractor as tce
import cv2
import os
import numpy as np

# Tạo các thư mục cần thiết
os.makedirs("./process_images/table_cells", exist_ok=True)
os.makedirs("./extracted_text", exist_ok=True)

path_to_image = "samples/XNDH.png"
# Bước 1: Trích xuất bảng từ ảnh
table_extractor = te.TableExtractor(path_to_image)
perspective_corrected_image = table_extractor.execute()

# Bước 2: Xóa đường kẻ bảng
lines_remover = tlr.TableLinesRemover(perspective_corrected_image)
image_without_lines = lines_remover.execute()

