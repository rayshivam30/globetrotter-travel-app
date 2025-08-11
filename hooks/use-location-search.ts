'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

interface LocationSearchResult {
  id: number;
  name: string;
  country: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

export function useLocationSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/locations/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const { data } = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error searching locations:', err);
      setError('Failed to load locations. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create debounced search function with useMemo to prevent recreation on every render
  const debouncedSearch = useMemo(
    () => debounce(searchLocations, 500),
    [searchLocations]
  );

  // Clear results when query is empty
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    debouncedSearch(query);
    
    // Cleanup debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  // Function to manually trigger a search
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  // Function to clear search results
  const clearResults = () => {
    setQuery('');
    setResults([]);
    setError(null);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search,
    clearResults,
  };
}
