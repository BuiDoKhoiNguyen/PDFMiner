import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Description as DocumentIcon,
  Info as InfoIcon,
  InsertDriveFile as FileIcon,
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { documentApi } from '../utils/api';
import { Document as PdfDocument, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import '../utils/pdfConfig'; 
import { pdfOptions } from '../utils/pdfConfig';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Metadata {
  documentType?: string;
  authors?: string[];
  createdDate?: string;
  keywords?: string[];
  [key: string]: unknown; // For other possible metadata fields
}

interface DocumentData {
  documentId: string;
  title: string;
  documentNumber?: string;
  documentType?: string;
  issuingAgency?: string;
  signer?: string;
  issueDate?: string;
  status?: string;
  fileLink?: string;
  content?: string;
  fileKey?: string;
  fileSize?: number;
  pageCount?: number;
  createdAt?: string;
  metadata?: Metadata;
}

export const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');
        // Đảm bảo ID được giải mã đúng từ URL
        const decodedId = decodeURIComponent(id);
        console.log('Đang tải tài liệu với ID:', decodedId);
        const response = await documentApi.getDocumentById(decodedId);

        // Sử dụng dữ liệu thực từ API
        setDocument(response.data);

        // Nếu có fileKey hoặc fileLink, lấy URL để hiển thị PDF
        if (response.data.fileKey) {
          try {
            console.log('Đang tải file PDF với fileKey:', response.data.fileKey);
            const fileResponse = await documentApi.getDocumentFileUrl(response.data.fileKey);
            console.log('URL PDF từ fileKey:', fileResponse.data.url);
            setPdfUrl(fileResponse.data.url);
          } catch (fileErr) {
            console.error('Không thể lấy URL của file PDF từ fileKey:', fileErr);
            // Thử sử dụng fileLink nếu có lỗi với fileKey
            if (response.data.fileLink) {
              console.log('Sử dụng fileLink sau khi fileKey thất bại:', response.data.fileLink);
              setPdfUrl(response.data.fileLink);
            }
          }
        } else if (response.data.fileLink) {
          console.log('Sử dụng fileLink trực tiếp:', response.data.fileLink);
          setPdfUrl(response.data.fileLink);
        } else {
          console.log('Không có fileKey hoặc fileLink trong dữ liệu tài liệu');
        }
      } catch (err) {
        const error = err as Error | ApiError;
        const errorMessage = error instanceof Error
          ? error.message
          : 'response' in error && error.response?.data?.message
            ? error.response.data.message
            : 'Không thể tải tài liệu';

        console.error('Lỗi khi tải tài liệu:', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  useEffect(() => {
    console.log('pdfUrl đã thay đổi:', pdfUrl);
  }, [pdfUrl]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Không có ngày';

    try {
      // Xử lý nhiều định dạng khác nhau
      let date;

      // Kiểm tra nếu là chuỗi ngày dạng YYYY-MM-DD
      if (dateString.length === 10 && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-').map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          // Tạo đối tượng Date với UTC để tránh vấn đề timezone
          date = new Date(Date.UTC(year, month - 1, day));
        }
      } else {
        // Thử tạo Date từ chuỗi gốc
        date = new Date(dateString);
      }

      // Kiểm tra xem ngày có hợp lệ không
      if (!date || isNaN(date.getTime())) {
        console.warn('Định dạng ngày không hợp lệ:', dateString);
        return 'Ngày không hợp lệ';
      }

      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Lỗi khi định dạng ngày:', error, dateString);
      return 'Ngày không hợp lệ';
    }
  };

  const handleDownloadPdf = async () => {
    if (document?.fileKey) {
      try {
        const response = await documentApi.downloadDocumentFile(document.fileKey);

        // Tạo blob từ dữ liệu nhận được
        const blob = new Blob([response.data], { type: 'application/pdf' });

        // Tạo URL cho blob và tạo link để download
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${document.title || 'document'}.pdf`);

        // Thêm link vào DOM, click nó và sau đó xóa đi
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);

        // Giải phóng URL object
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Lỗi khi tải PDF từ fileKey:', err);
      }
    } else if (document?.fileLink) {
      // Nếu không có fileKey nhưng có fileLink thì mở liên kết trực tiếp
      try {
        const link = window.document.createElement('a');
        link.href = document.fileLink;
        link.setAttribute('download', `${document.title || 'document'}.pdf`);
        link.setAttribute('target', '_blank');
        link.click();
      } catch (err) {
        console.error('Lỗi khi tải PDF từ fileLink:', err);
      }
    } else {
      console.warn('Không có fileKey hoặc fileLink để tải xuống tài liệu');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber =>
      Math.min(Math.max(prevPageNumber + offset, 1), numPages || 1)
    );
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Không tìm thấy tài liệu'}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/documents')}
          >
            Quay lại danh sách tài liệu
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/documents')}
        >
          Quay lại danh sách
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <DocumentIcon color="primary" sx={{ fontSize: 40, mr: 2, mt: 1 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {document.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {document.pageCount && <Chip label={`${document.pageCount} trang`} variant="outlined" size="small" />}
              {document.fileSize && <Chip label={formatFileSize(document.fileSize)} variant="outlined" size="small" />}
              <Chip
                label={`Đã tải lên: ${formatDate(document.issueDate || document.createdAt)}`}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
          {(document.fileKey || document.fileLink) && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPdf}
              sx={{ ml: 2, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}
            >
              Tải xuống
            </Button>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        <Box sx={{ width: { xs: '100%', md: '66.66%' } }}>
          <Paper sx={{ p: 3, mb: { xs: 4, md: 0 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Xem tài liệu
              </Typography>
              <Box>
                <Tooltip title="Thu nhỏ">
                  <IconButton onClick={zoomOut} disabled={!pdfUrl}>
                    <ZoomOutIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Phóng to">
                  <IconButton onClick={zoomIn} disabled={!pdfUrl}>
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {pdfUrl ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: '#f5f5f5'
              }}>
                 <PdfDocument
                  file={encodeURI(pdfUrl)}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<CircularProgress />}
                  error={<Alert severity="error">Không thể tải PDF. Vui lòng thử lại sau.</Alert>}
                  onError={(error) => console.error("PDF load error:", error)}
                  options={pdfOptions}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </PdfDocument>

                {numPages && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 1,
                    backgroundColor: '#fff',
                    width: '100%',
                    borderTop: '1px solid #e0e0e0'
                  }}>
                    <IconButton
                      onClick={() => changePage(-1)}
                      disabled={pageNumber <= 1}
                    >
                      <PrevIcon />
                    </IconButton>
                    <Typography variant="body2" sx={{ mx: 2 }}>
                      Trang {pageNumber} / {numPages}
                    </Typography>
                    <IconButton
                      onClick={() => changePage(1)}
                      disabled={pageNumber >= (numPages || 1)}
                    >
                      <NextIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 1
              }}>
                <Alert severity="info" sx={{ mb: 3, width: '100%' }}>
                  Không thể tải file PDF. Dưới đây là nội dung đã trích xuất từ tài liệu.
                </Alert>
                
                {document.fileLink && (
                  <Box sx={{ mb: 3, width: '100%' }}>
                    <Typography variant="body2" gutterBottom>
                      Đường dẫn PDF: {document.fileLink}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadPdf}
                      sx={{ mt: 1 }}
                    >
                      Tải xuống PDF
                    </Button>
                  </Box>
                )}
                
                {document.content ? (
                  <Box
                    sx={{
                      mt: 2,
                      width: '100%',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      p: 2,
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      maxHeight: 500,
                      overflow: 'auto',
                      fontSize: '0.875rem'
                    }}
                  >
                    {document.content}
                  </Box>
                ) : (
                  <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
                    Không có dữ liệu nội dung được trích xuất.
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin tài liệu
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText
                  primary="ID tài liệu"
                  secondary={document.documentId}
                />
              </ListItem>
              {document.documentNumber && (
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Số hiệu"
                    secondary={document.documentNumber}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon>
                  <FileIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Loại tài liệu"
                  secondary={document.documentType || document.metadata?.documentType || 'Không xác định'}
                />
              </ListItem>
              {document.issuingAgency && (
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Cơ quan ban hành"
                    secondary={document.issuingAgency}
                  />
                </ListItem>
              )}
              {document.signer && (
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Người ký"
                    secondary={document.signer}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <Box>
                  <Typography variant="body1">Trạng thái</Typography>
                  <Chip
                    label={document.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang xử lý'}
                    color={document.status === 'COMPLETED' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Tác giả"
                  secondary={document.metadata?.authors?.join(', ') || 'Không xác định'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Ngày ban hành"
                  secondary={formatDate(document.issueDate) || document.metadata?.createdDate || 'Không xác định'}
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Từ khóa
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {document.metadata?.keywords?.map((keyword: string, index: number) => (
                <Chip
                  key={index}
                  label={keyword}
                  color="primary"
                  variant="outlined"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(keyword)}`)}
                />
              )) || 'Không có từ khóa'}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};
