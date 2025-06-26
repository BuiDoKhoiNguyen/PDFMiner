import os
import numpy as np
from PIL import Image, ImageEnhance
import cv2
from vietocr.vietocr.tool.predictor import Predictor
from vietocr.vietocr.tool.config import Cfg
from PaddleOCR import PaddleOCR

def init_models():
    """
    Initialize the PaddleOCR detector and VietOCR recognizer
    
    Returns:
        recognitor: VietOCR recognizer for text recognition
        detector: PaddleOCR detector for text detection
    """
    # Configure VietOCR
    config = Cfg.load_config_from_name('vgg_transformer')
    config['cnn']['pretrained'] = True
    config['predictor']['beamsearch'] = True
    config['device'] = 'mps'  # or 'cuda', 'cpu' depending on your hardware
    recognitor = Predictor(config)

    # Configure PaddleOCR
    detector = PaddleOCR(use_angle_cls=False, lang="vi", use_gpu=False)
    
    return recognitor, detector

def preprocess_image(image, factor=2.0):
    """
    Preprocess the image to enhance the table structure and text
    
    Args:
        image: Input image
        factor: Enhancement factor (default: 2.0)
        
    Returns:
        processed_image: Enhanced binary image
        original_copy: Copy of the original image
    """
    # Keep a copy of the original image for visualization
    original_copy = image.copy()
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Enhance sharpness and contrast using PIL
    img_pil = Image.fromarray(image)
    enhancer = ImageEnhance.Sharpness(img_pil).enhance(factor)
    # Add contrast enhancement for low contrast images
    if gray.std() < 30:  
        enhancer = ImageEnhance.Contrast(enhancer).enhance(factor)
    image_enhanced = np.array(enhancer)
    
    # Convert to binary image
    gray = cv2.cvtColor(image_enhanced, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    binary = 255 - binary
    
    return binary, original_copy

def detect_lines(binary_image):
    """
    Detect horizontal and vertical lines in the table
    
    Args:
        binary_image: Binary image of the table
        
    Returns:
        new_h_lines: List of horizontal lines [x1, y1, x2, y2]
        new_v_lines: List of vertical lines [x1, y1, x2, y2]
    """
    # Get image dimensions
    height, width = binary_image.shape
    
    # Define kernel length as relative to image dimensions
    kernel_len = width // 120
    
    # Detect horizontal lines
    hor_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_len, 1))
    image_horizontal = cv2.erode(binary_image, hor_kernel, iterations=3)
    horizontal_lines = cv2.dilate(image_horizontal, hor_kernel, iterations=3)
    
    # Tăng ngưỡng phát hiện và giảm maxLineGap để giảm lỗi phát hiện
    h_lines = cv2.HoughLinesP(horizontal_lines, 1, np.pi/180, 50, minLineLength=width//10, maxLineGap=100)
    
    # Group horizontal lines
    new_h_lines = []
    if h_lines is not None:
        while len(h_lines) > 0:
            thresh = sorted(h_lines, key=lambda x: x[0][1])[0][0]
            lines = [line for line in h_lines if thresh[1] - kernel_len <= line[0][1] <= thresh[1] + kernel_len]
            h_lines = [line for line in h_lines if thresh[1] - kernel_len > line[0][1] or line[0][1] > thresh[1] + kernel_len]
            x = []
            for line in lines:
                x.append(line[0][0])
                x.append(line[0][2])
            if x:  # Chỉ xử lý khi có điểm
                x_min, x_max = min(x) - int(3*kernel_len), max(x) + int(3*kernel_len)
                new_h_lines.append([x_min, thresh[1], x_max, thresh[1]])
    
    # Detect vertical lines
    ver_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, kernel_len))
    image_vertical = cv2.erode(binary_image, ver_kernel, iterations=3)
    vertical_lines = cv2.dilate(image_vertical, ver_kernel, iterations=3)
    
    # Tăng ngưỡng phát hiện và thêm minLineLength
    v_lines = cv2.HoughLinesP(vertical_lines, 1, np.pi/180, 50, minLineLength=height//10, maxLineGap=100)
    
    # Group vertical lines
    new_v_lines = []
    if v_lines is not None:
        while len(v_lines) > 0:
            thresh = sorted(v_lines, key=lambda x: x[0][0])[0][0]
            lines = [line for line in v_lines if thresh[0] - kernel_len <= line[0][0] <= thresh[0] + kernel_len]
            v_lines = [line for line in v_lines if thresh[0] - kernel_len > line[0][0] or line[0][0] > thresh[0] + kernel_len]
            y = []
            for line in lines:
                y.append(line[0][1])
                y.append(line[0][3])
            if y:  # Chỉ xử lý khi có điểm
                y_min, y_max = min(y) - int(3*kernel_len), max(y) + int(3*kernel_len)
                new_v_lines.append([thresh[0], y_min, thresh[0], y_max])
    
    return new_h_lines, new_v_lines

def find_intersection_points(h_lines, v_lines):
    """
    Find intersection points between horizontal and vertical lines
    
    Args:
        h_lines: List of horizontal lines
        v_lines: List of vertical lines
        
    Returns:
        points: List of intersection points [x, y]
    """
    def seg_intersect(line1, line2):
        a1, a2 = np.array(line1[:2]), np.array(line1[2:])
        b1, b2 = np.array(line2[:2]), np.array(line2[2:])
        da = a2-a1
        db = b2-b1
        dp = a1-b1
        
        def perp(a):
            b = np.empty_like(a)
            b[0] = -a[1]
            b[1] = a[0]
            return b
            
        dap = perp(da)
        denom = np.dot(dap, db)
        num = np.dot(dap, dp)
        
        if denom == 0:
            return None  # Parallel lines
        
        return (num / denom)*db + b1
    
    points = []
    for hline in h_lines:
        x1A, y1A, x2A, y2A = hline
        for vline in v_lines:
            x1B, y1B, x2B, y2B = vline
            
            result = seg_intersect([x1A, y1A, x2A, y2A], [x1B, y1B, x2B, y2B])
            if result is not None:
                x, y = result
                if x1A <= x <= x2A and y1B <= y <= y2B:
                    points.append([int(x), int(y)])
    
    return points

def identify_table_cells(points, image):
    """
    Identify the table cells from intersection points
    
    Args:
        points: List of intersection points
        image: Original image to draw on
        
    Returns:
        cells: List of cell coordinates [left, top, right, bottom]
        image_with_cells: Image with cells drawn
    """
    def get_bottom_right(right_points, bottom_points, points):
        for right in right_points:
            for bottom in bottom_points:
                if [right[0], bottom[1]] in points:
                    return right[0], bottom[1]
        return None, None
    
    cells = []
    image_with_cells = image.copy()
    
    for point in points:
        left, top = point
        right_points = sorted([p for p in points if p[0] > left and p[1] == top], key=lambda x: x[0])
        bottom_points = sorted([p for p in points if p[1] > top and p[0] == left], key=lambda x: x[1])
        
        right, bottom = get_bottom_right(right_points, bottom_points, points)
        if right and bottom:
            # Draw rectangle on the image
            cv2.rectangle(image_with_cells, (left, top), (right, bottom), (0, 0, 255), 2)
            cells.append([left, top, right, bottom])
    
    return cells, image_with_cells

def extract_and_recognize_cell_text(image, cells, detector, recognitor, output_dir, padding=2):
    """
    Extract and recognize text in each cell using PaddleOCR for detection and VietOCR for recognition
    
    Args:
        image: Original image
        cells: List of cell coordinates [left, top, right, bottom]
        detector: PaddleOCR detector
        recognitor: VietOCR recognizer
        output_dir: Output directory for saving cell images
        padding: Padding around cells
        
    Returns:
        table_data: List of dictionaries containing cell information
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    table_data = []
    
    for i, cell in enumerate(cells):
        left, top, right, bottom = cell
        
        # Add padding
        left = max(0, left - padding)
        top = max(0, top - padding)
        right = min(image.shape[1], right + padding)
        bottom = min(image.shape[0], bottom + padding)
        
        # Crop cell image
        cell_img = image[top:bottom, left:right]
        
        # Save cell image
        cell_img_path = os.path.join(output_dir, f"cell_{i}.png")
        cv2.imwrite(cell_img_path, cell_img)
        
        # Detect text regions using PaddleOCR
        paddle_result = detector.ocr(cell_img_path, cls=False, det=True, rec=False)
        text_boxes = []
        
        # Extract text regions
        if paddle_result and paddle_result[0]:
            for line in paddle_result[0]:
                # PaddleOCR returns 4 corner points, we need just the top-left and bottom-right
                box = [[int(line[0][0]), int(line[0][1])], [int(line[2][0]), int(line[2][1])]]
                text_boxes.append(box)
        
        # Recognize text using VietOCR
        texts = []
        cell_pil = Image.fromarray(cell_img)
        
        if text_boxes:
            for box in text_boxes:
                x1, y1 = box[0]
                x2, y2 = box[1]
                # Crop text region from cell
                text_region = cell_img[y1:y2, x1:x2]
                try:
                    text_region_pil = Image.fromarray(text_region)
                    # Recognize using VietOCR
                    text = recognitor.predict(text_region_pil)
                    texts.append(text)
                except:
                    pass
        else:
            # If no text boxes detected, try to recognize the entire cell
            try:
                text = recognitor.predict(cell_pil)
                texts.append(text)
            except:
                pass
        
        # Save result
        cell_text = " ".join(texts)
        table_data.append({
            "cell_id": i,
            "position": [left, top, right, bottom],
            "text": cell_text
        })
    
    return table_data

def extract_table(img_path, output_dir='./output/tables_extracted', factor=2.0):
    """
    Extract tables and recognize text
    
    Args:
        img_path: Path to the image
        output_dir: Output directory
        factor: Enhancement factor for preprocessing
        
    Returns:
        table_data: List of dictionaries containing cell information
        result_img_path: Path to the resulting image
    """
    # Initialize models
    recognitor, detector = init_models()
    
    # Create output directory
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Load image
    table_image = cv2.imread(img_path)
    if table_image is None:
        print(f"Cannot read image at {img_path}")
        return None, None
    
    # Preprocess image
    binary_image, table_image_orig = preprocess_image(table_image, factor)
    
    # Detect lines
    h_lines, v_lines = detect_lines(binary_image)
    
    # Find intersection points
    points = find_intersection_points(h_lines, v_lines)
    
    # Identify table cells
    cells, table_image_with_cells = identify_table_cells(points, table_image_orig)
    
    # Extract and recognize text in cells
    table_data = extract_and_recognize_cell_text(
        table_image_orig, cells, detector, recognitor, output_dir)
    
    # Save result image
    result_img_path = os.path.join(output_dir, "table_detected.jpg")
    cv2.imwrite(result_img_path, table_image_with_cells)
    
    # Save text results
    result_txt_path = os.path.join(output_dir, "table_text.txt")
    with open(result_txt_path, 'w', encoding='utf-8') as f:
        for cell_data in table_data:
            f.write(f"Cell {cell_data['cell_id']}: {cell_data['text']}\n")
    
    return table_data, result_img_path
