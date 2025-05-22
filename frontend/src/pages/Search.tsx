import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton, 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Button,
  Alert
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
  documentId?: string; // Thêm trường này để tương thích với API
  content?: string;  // Thêm trường này để chứa content từ API
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
          const sentences = content.split(/[.!?]\s+/);
          const snippets = sentences
            .filter((s: string) => s.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 3)
            .map((s: string) => s.trim() + ".");
          
          return {
            id: doc.documentId,
            documentId: doc.documentId,
            title: doc.title || "Untitled Document",
            snippets: snippets.length ? snippets : [content.substring(0, 200) + "..."],
            matchCount: snippets.length || 1,
            content: doc.content
          };
        });
        
        setSearchResults(mappedResults);
      } else {
        setSearchResults([]);
      }
      setHasSearched(true);
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
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {searchResults.map((result) => (
                <Card key={result.id}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      gutterBottom
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => navigate(`/documents/${encodeURIComponent(result.id)}`)}
                    >
                      {result.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {result.matchCount} kết quả phù hợp
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <List dense>
                      {result.snippets.map((snippet, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <DocumentIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={snippet}
                            primaryTypographyProps={{
                              dangerouslySetInnerHTML: {
                                __html: snippet.replace(
                                  new RegExp(query, 'gi'),
                                  (match) => `<mark style="background-color: #fff59d; padding: 0 2px;">${match}</mark>`
                                )
                              }
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button 
                        size="small" 
                        onClick={() => navigate(`/documents/${encodeURIComponent(result.id)}`)}
                      >
                        Xem tài liệu
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};
