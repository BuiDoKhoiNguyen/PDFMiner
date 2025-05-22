import { pdfjs } from 'react-pdf';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

// Khởi tạo Worker cho PDF.js - chỉ cần thực hiện một lần
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

// Cấu hình để sử dụng cMaps đã được sao chép vào thư mục public (nhờ vite-plugin-static-copy)
export const pdfOptions = {
  cMapUrl: '/cmaps/', // Đường dẫn tương đối đến thư mục cmaps
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@4.8.69/standard_fonts/'
};

// Có thể bổ sung thêm các cấu hình khác cho PDF.js trong tương lai
