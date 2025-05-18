import cv2
import numpy as np
import os

class TableLinesRemover:

    def __init__(self, image):
        self.image = image
        os.makedirs("./process_images/table_lines_remover/", exist_ok=True)
        os.makedirs("./cells/", exist_ok=True)

    def execute(self):
        self.grayscale_image()
        self.store_process_image("0_grayscaled.jpg", self.grey)

        self.threshold_image()
        self.store_process_image("1_thresholded.jpg", self.thresholded_image)

        self.invert_image()
        self.store_process_image("2_inverted.jpg", self.inverted_image)

        self.erode_vertical_lines()
        self.store_process_image("3_erode_vertical_lines.jpg", self.vertical_lines_eroded_image)

        self.erode_horizontal_lines()
        self.store_process_image("4_erode_horizontal_lines.jpg", self.horizontal_lines_eroded_image)

        self.combine_eroded_images()
        self.store_process_image("5_combined_eroded_images.jpg", self.combined_image)

        self.dilate_combined_image_to_make_lines_thicker()
        self.store_process_image("6_dilated_combined_image.jpg", self.combined_image_dilated)

        self.subtract_combined_and_dilated_image_from_original_image()
        self.store_process_image("7_image_without_lines.jpg", self.image_without_lines)

        self.remove_noise_with_erode_and_dilate()
        self.store_process_image("8_image_without_lines_noise_removed.jpg", self.image_without_lines_noise_removed)

        self.cells = self.detect_grid_cells()
        self.save_cells()
        return self.cells

    def grayscale_image(self):
        self.grey = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)

    def threshold_image(self):
        self.thresholded_image = cv2.threshold(self.grey, 127, 255, cv2.THRESH_BINARY)[1]

    def invert_image(self):
        self.inverted_image = cv2.bitwise_not(self.thresholded_image)

    def erode_vertical_lines(self):
        kernel = np.array([[1, 1, 1, 1, 1, 1]])
        self.vertical_lines_eroded_image = cv2.erode(self.inverted_image, kernel, iterations=10)
        self.vertical_lines_eroded_image = cv2.dilate(self.vertical_lines_eroded_image, kernel, iterations=10)

    def erode_horizontal_lines(self):
        kernel = np.array([[1], [1], [1], [1], [1], [1], [1]])
        self.horizontal_lines_eroded_image = cv2.erode(self.inverted_image, kernel, iterations=10)
        self.horizontal_lines_eroded_image = cv2.dilate(self.horizontal_lines_eroded_image, kernel, iterations=10)

    def combine_eroded_images(self):
        self.combined_image = cv2.add(self.vertical_lines_eroded_image, self.horizontal_lines_eroded_image)

    def dilate_combined_image_to_make_lines_thicker(self):
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        self.combined_image_dilated = cv2.dilate(self.combined_image, kernel, iterations=5)

    def subtract_combined_and_dilated_image_from_original_image(self):
        self.image_without_lines = cv2.subtract(self.inverted_image, self.combined_image_dilated)

    def remove_noise_with_erode_and_dilate(self):
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        self.image_without_lines_noise_removed = cv2.erode(self.image_without_lines, kernel, iterations=1)
        self.image_without_lines_noise_removed = cv2.dilate(self.image_without_lines_noise_removed, kernel, iterations=1)

    def detect_grid_cells(self):
        vertical = self.vertical_lines_eroded_image
        horizontal = self.horizontal_lines_eroded_image

        intersections = cv2.bitwise_and(vertical, horizontal)

        contours, _ = cv2.findContours(intersections, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
        points = [cv2.boundingRect(cnt) for cnt in contours]
        centers = [(x + w // 2, y + h // 2) for (x, y, w, h) in points]

        sorted_points = sorted(centers, key=lambda p: (p[1], p[0]))

        rows = []
        current_row = []
        tolerance = 10

        for i, point in enumerate(sorted_points):
            if i == 0:
                current_row.append(point)
            else:
                if abs(point[1] - current_row[-1][1]) < tolerance:
                    current_row.append(point)
                else:
                    rows.append(sorted(current_row, key=lambda p: p[0]))
                    current_row = [point]
        if current_row:
            rows.append(sorted(current_row, key=lambda p: p[0]))

        cells = []
        for i in range(len(rows) - 1):
            for j in range(len(rows[i]) - 1):
                x1, y1 = rows[i][j]
                x2, y2 = rows[i + 1][j + 1]
                if x2 > x1 and y2 > y1:
                    cell_img = self.image[y1:y2, x1:x2]
                    cells.append({
                        "row": i,
                        "col": j,
                        "x": x1,
                        "y": y1,
                        "w": x2 - x1,
                        "h": y2 - y1,
                        "image": cell_img
                    })
        return cells

    def save_cells(self):
        for cell in self.cells:
            filename = f"./cells/cell_{cell['row']}_{cell['col']}.jpg"
            cv2.imwrite(filename, cell["image"])

    def store_process_image(self, file_name, image):
        path = "./process_images/table_lines_remover/" + file_name
        cv2.imwrite(path, image)