'use client';

import type { MediaKitOffering } from '@/lib/media-kit';
import type { UserType } from '@/lib/user-types';
import { DEFAULT_OFFERINGS, ONE_SHEET_CONFIG } from '@/lib/media-kit';
import { Plus, X, RotateCcw } from 'lucide-react';

interface OfferingsEditorProps {
  offerings: MediaKitOffering[];
  onChange: (offerings: MediaKitOffering[]) => void;
  userType: UserType;
}

export default function OfferingsEditor({ offerings, onChange, userType }: OfferingsEditorProps) {
  const accent = ONE_SHEET_CONFIG[userType].accentColor;

  const addOffering = () => {
    if (offerings.length >= 8) return;
    onChange([
      ...offerings,
      { id: Date.now().toString(), name: '', price: '', description: '' },
    ]);
  };

  const removeOffering = (id: string) => {
    onChange(offerings.filter(o => o.id !== id));
  };

  const updateOffering = (id: string, field: keyof MediaKitOffering, value: string) => {
    onChange(offerings.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_OFFERINGS[userType].map((o, i) => ({ ...o, id: Date.now().toString() + i })));
  };

  return (
    <div className="space-y-2">
      {offerings.map((offering, index) => (
        <div key={offering.id} className="bg-armadillo-bg border border-armadillo-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            {/* Number indicator */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ backgroundColor: accent + '18', color: accent }}
            >
              {index + 1}
            </div>
            <input
              type="text"
              value={offering.name}
              onChange={(e) => updateOffering(offering.id, 'name', e.target.value)}
              placeholder="e.g. Sponsored Post"
              className="flex-1 bg-transparent text-sm text-armadillo-text placeholder-armadillo-muted/50 focus:outline-none"
            />
            {/* Price with $ prefix */}
            <div className="flex items-center w-32 bg-transparent">
              <span className="text-sm text-armadillo-muted/50 mr-0.5">$</span>
              <input
                type="text"
                value={offering.price}
                onChange={(e) => updateOffering(offering.id, 'price', e.target.value)}
                placeholder="Price"
                className="w-full bg-transparent text-sm text-burnt text-right placeholder-armadillo-muted/50 focus:outline-none"
              />
            </div>
            <button
              onClick={() => removeOffering(offering.id)}
              className="text-armadillo-muted hover:text-danger transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            value={offering.description || ''}
            onChange={(e) => updateOffering(offering.id, 'description', e.target.value)}
            placeholder="Brief description (optional)"
            className="w-full bg-transparent text-[11px] text-armadillo-muted placeholder-armadillo-muted/30 focus:outline-none ml-7"
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        {offerings.length < 8 && (
          <button
            onClick={addOffering}
            className="flex items-center gap-1.5 text-xs text-burnt hover:text-burnt-light transition-colors"
          >
            <Plus size={12} /> Add offering
          </button>
        )}
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-1.5 text-xs text-armadillo-muted hover:text-armadillo-text transition-colors"
        >
          <RotateCcw size={10} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
