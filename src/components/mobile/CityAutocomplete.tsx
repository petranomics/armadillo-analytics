'use client';

import { useState, useRef, useEffect } from 'react';
import { searchCities } from '@/lib/us-cities';
import { MapPin } from 'lucide-react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CityAutocomplete({ value, onChange, placeholder = 'e.g. Austin, TX' }: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (text: string) => {
    onChange(text);
    const results = searchCities(text);
    setSuggestions(results);
    setOpen(results.length > 0);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-armadillo-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder={placeholder}
        className="w-full bg-armadillo-card border border-armadillo-border rounded-xl pl-10 pr-4 py-3 text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none focus:border-burnt"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-armadillo-card border border-armadillo-border rounded-xl overflow-hidden shadow-lg">
          {suggestions.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              className="w-full text-left px-4 py-2.5 text-sm text-armadillo-text hover:bg-burnt/10 transition-colors flex items-center gap-2"
            >
              <MapPin size={12} className="text-armadillo-muted shrink-0" />
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
