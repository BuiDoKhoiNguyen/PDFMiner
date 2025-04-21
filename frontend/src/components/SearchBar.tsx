// src/components/SearchBar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, FormControl, ListGroup } from 'react-bootstrap';
import api from '../services/api';
import { DocumentSuggestResponse } from '../types';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [keyword, setKeyword] = useState<string>('');
  const [suggestions, setSuggestions] = useState<DocumentSuggestResponse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (keyword.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await api.getSuggestions(keyword);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý:', error);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (keyword.trim()) {
      onSearch(keyword.trim());
    }
  };

  const handleSuggestionClick = (suggestion: DocumentSuggestResponse) => {
    setKeyword(suggestion.textSearch);
    setShowSuggestions(false);
    onSearch(suggestion.textSearch);
  };

  return (
    <div className="search-container" style={{ position: 'relative' }}>
      <Form onSubmit={handleSearch}>
        <InputGroup className="mb-3">
          <FormControl
            placeholder="Tìm kiếm công văn..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onClick={() => keyword.trim().length >= 2 && setShowSuggestions(true)}
          />
          <InputGroup.Text 
            onClick={handleSearch}
            style={{ cursor: 'pointer' }}
          >
            🔍
          </InputGroup.Text>
        </InputGroup>
      </Form>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionRef}>
          <ListGroup 
            style={{
              position: 'absolute',
              width: '100%',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {suggestions.map((suggestion) => (
              <ListGroup.Item 
                key={suggestion.id} 
                action 
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.textSearch}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default SearchBar;