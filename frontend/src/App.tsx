// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import DocumentList from './components/DocumentList';
import DocumentUpload from './components/DocumentUpload';
import api from './services/api';
import { DocumentEntity } from './types';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<DocumentEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleSearch = async (keyword: string) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const results = await api.searchDocuments(keyword);
      setSearchResults(results);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Router>
      <div className="App">
        <Header />
        <Container className="py-4">
          <Routes>
            <Route path="/" element={
              <>
                <div className="search-page">
                  <h1 className="text-center mb-4">Tìm kiếm công văn</h1>
                  <SearchBar onSearch={handleSearch} />
                  
                  {isLoading ? (
                    <div className="text-center my-5">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  ) : (
                    hasSearched && <DocumentList documents={searchResults} />
                  )}
                </div>
              </>
            } />
            <Route path="/upload" element={<DocumentUpload />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
};

export default App;