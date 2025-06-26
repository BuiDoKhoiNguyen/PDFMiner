import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  IconButton, 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Button,
  Alert,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  Description as DocumentIcon,
  Article as ArticleIcon
} from '@mui/icons-material';
import { documentApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

interface DocumentSuggestion {
  id: string;
  text: string; // Matches backend response field
}

interface SearchResult {
  id: string;        // ID tài liệu để điều hướng
  title: string;     // Tiêu đề tài liệu
  snippets: string[]; // Các đoạn trích từ tài liệu
  matchCount: number; // Số lượng kết quả phù hợp
  documentId?: string;
  searchText: string; // Thêm trường này để tương thích với API
  content?: string;  // Thêm trường này để chứa content từ API
  documentType?: string; // Loại tài liệu
  issueDate?: string; // Ngày ban hành
  status?: string; // Trạng thái xử lý tài liệu
}

// Define API response type for better type safety
interface ApiDocument {
  documentId: string;
  documentNumber: string;
  documentName: string;
  title: string;
  content: string;
  documentType: string;
  issuingAgency: string;
  signer: string | null;
  issueDate: string;
  status: string;
  fileLink: string;
  tableData: string | null;
  searchText: string;
}

export const Search = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DocumentSuggestion[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get suggestions while typing
  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      
      try {
        const response = await documentApi.getSuggestions(query, 6);
        // Handle different response formats and property names
        if (Array.isArray(response.data)) {
          // Map any response to our DocumentSuggestion interface
          setSuggestions(response.data.map((item: {id: string, text?: string, textSearch?: string}) => ({
            id: item.id,
            text: item.text || item.textSearch || ''
          })));
        } else if (response.data?.data) {
          // Handle nested data property
          setSuggestions(response.data.data.map((item: {id: string, text?: string, textSearch?: string}) => ({
            id: item.id,
            text: item.text || item.textSearch || ''
          })));
        } else {
          setSuggestions([]);
        }
        console.log("Suggestions received:", response.data);
      } catch (error) {
        // Silently fail for suggestions
        console.error("Failed to get suggestions:", error);
        setSuggestions([]);
      }
    };
    
    const debounce = setTimeout(() => {
      getSuggestions();
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    console.log("Starting search for query:", query);
    setLoading(true);
    setError('');
    
    try {
      const response = await documentApi.searchDocuments(query);
      console.log("Search results:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Map API response format to our SearchResult interface
        const mappedResults = response.data.map((doc: ApiDocument) => {
          // Extract 2-3 sentences from content as snippets
          const content = doc.content || "";
          // Split content by periods, question marks, or exclamation points followed by space
          const sentences = content.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
          
          // Make sure we have at least some content to show
          let snippets: string[] = [];
          
          // Try to find sentences containing the search term
          const matchingSentences = sentences
            .filter((s: string) => s.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map((s: string) => s.trim() + ".");
            
          if (matchingSentences.length > 0) {
            snippets = matchingSentences;
          } else if (sentences.length > 0) {
            // If no matching sentences found, just take the first few sentences
            snippets = sentences.slice(0, 2).map((s: string) => s.trim() + ".");
          } else {
            // If no sentences found, take a substring of the content
            snippets = [content.substring(0, 200) + "..."];
          }
          
          console.log("Document ID:", doc.documentId, "Snippets:", snippets);
          
          return {
            id: doc.documentId,
            documentId: doc.documentId,
            title: doc.title || "Untitled Document",
            snippets: snippets,
            matchCount: matchingSentences.length || 1,
            content: doc.content,
            documentType: doc.documentType || "Không phân loại",
            searchText: doc.searchText || "",
            issueDate: doc.issueDate || "",
            status: doc.status || "COMPLETED"
          };
        });
        
        console.log("Mapped results:", mappedResults);
        setSearchResults(mappedResults);
      } else {
        setSearchResults([]);
      }
      setHasSearched(true);
      // Hide suggestions when search results are displayed
      setSuggestions([]);
    } catch (error) {
      console.error("Search failed:", error);
      setError(
        error instanceof Error ? error.message : 'Tìm kiếm thất bại'
      );
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setError('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tìm kiếm tài liệu
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Tìm kiếm thông tin trong các tài liệu PDF đã tải lên
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Nhập từ khóa tìm kiếm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          {suggestions.length > 0 && (
            <Paper sx={{ 
              mt: 1, 
              position: 'absolute', 
              width: '100%', 
              maxHeight: 300, 
              overflow: 'auto',
              zIndex: 999,
              boxShadow: 3
            }}>
              <List dense>
                {suggestions.map((suggestion) => (
                  <ListItem 
                    component="div"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                      padding: 2
                    }}
                    key={suggestion.id}
                    onClick={() => {
                      // Nếu chọn một gợi ý, điều hướng trực tiếp đến trang chi tiết tài liệu
                      // Mã hóa ID để xử lý các ký tự đặc biệt trong URL
                      navigate(`/documents/${encodeURIComponent(suggestion.id)}`);
                      setSuggestions([]); // Ẩn gợi ý sau khi chọn
                    }}
                  >
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 1
                        }}>
                          <Typography 
                            sx={{ 
                              fontWeight: 500,
                              whiteSpace: 'normal',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {suggestion.text}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            size="large"
          >
            {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : hasSearched && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Kết quả tìm kiếm: {searchResults.length} tài liệu
            </Typography>
          </Box>

          {searchResults.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ArticleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Không tìm thấy kết quả
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Không tìm thấy tài liệu nào phù hợp với từ khóa "{query}"
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {searchResults.map((result) => (
                <Box key={result.id} sx={{ width: { xs: '100%', sm: '47%', md: '31%' } }}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography 
                          variant="h6" 
                          component="div" 
                          sx={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            cursor: 'pointer', 
                            '&:hover': { textDecoration: 'underline' },
                            maxWidth: '80%'
                          }}
                          onClick={() => navigate(`/documents/${encodeURIComponent(result.id)}`)}
                        >
                          {result.searchText}
                        </Typography>
                        <Chip
                          label={result.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang xử lý'}
                          color={result.status === 'COMPLETED' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Loại: {result.documentType}
                        </Typography>
                        {result.issueDate && (
                          <Typography variant="body2" color="text.secondary">
                            Ngày: {formatDate(result.issueDate)}
                          </Typography>
                        )}
                        <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                          {result.matchCount} kết quả phù hợp
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
                          Trích đoạn:
                        </Typography>
                        <Box sx={{ 
                          bgcolor: 'rgba(0, 0, 0, 0.02)', 
                          p: 1.5, 
                          borderRadius: 1,
                          maxHeight: 120,
                          overflow: 'auto'
                        }}>
                          {result.snippets.length > 0 ? (
                            result.snippets.map((snippet, index) => (
                              <Typography 
                                key={index} 
                                variant="body2"
                                paragraph
                                sx={{ mb: index < result.snippets.length - 1 ? 1 : 0 }}
                                dangerouslySetInnerHTML={{
                                  __html: snippet.replace(
                                    new RegExp(query, 'gi'),
                                    (match) => `<mark style="background-color: #fff59d; padding: 0 2px;">${match}</mark>`
                                  )
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="body2">Không có trích đoạn</Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/documents/${encodeURIComponent(result.id)}`)}
                      >
                        Xem tài liệu
                      </Button>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};
