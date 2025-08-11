'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocationSearch } from '@/hooks/use-location-search';
import { Loader2, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationSelectorProps {
  value?: { id: number; name: string; country: string } | null;
  onChange: (location: { id: number; name: string; country: string } | null) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  error?: string;
  disabled?: boolean;
}

export function LocationSelector({
  value,
  onChange,
  placeholder = 'Search for a city...',
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  error,
  disabled = false,
}: LocationSelectorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value ? `${value.name}, ${value.country}` : '');
  const { query, setQuery, results, isLoading, error: searchError, clearResults } = useLocationSearch();
  const containerRef = useRef<HTMLDivElement>(null);

  // Update input value when the selected value changes
  useEffect(() => {
    if (value) {
      setInputValue(`${value.name}, ${value.country}`);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (location: { id: number; name: string; country: string }) => {
    onChange(location);
    setIsFocused(false);
    clearResults();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setInputValue('');
    setQuery('');
    clearResults();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only search if the input value has changed significantly
    if (newValue.length > 1) {
      setQuery(newValue);
    } else {
      clearResults();
    }
  };

  const showDropdown = isFocused && (isLoading || results.length > 0 || searchError);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              inputClassName,
              error && 'border-destructive focus-visible:ring-destructive/50'
            )}
            disabled={disabled}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
        
        {searchError && isFocused && (
          <p className="mt-1 text-xs text-destructive">{searchError}</p>
        )}
      </div>

      {showDropdown && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
            dropdownClassName
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-60 overflow-auto">
              {results.map((location) => (
                <div
                  key={location.id}
                  className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() =>
                    handleSelect({
                      id: location.id,
                      name: location.name,
                      country: location.country,
                    })
                  }
                >
                  <div className="font-medium">{location.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {location.region ? `${location.region}, ` : ''}
                    {location.country}
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-sm text-muted-foreground">
              No locations found. Try a different search term.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
