'use client';

import { Check, ImageIcon } from 'lucide-react';

interface PhotoPickerProps {
  availablePhotos: string[];   // URLs from avatar + post thumbnails
  headerPhotoUrl: string;
  galleryPhotoUrls: string[];
  onSetHeaderPhoto: (url: string) => void;
  onToggleGalleryPhoto: (url: string) => void;
}

export default function PhotoPicker({
  availablePhotos,
  headerPhotoUrl,
  galleryPhotoUrls,
  onSetHeaderPhoto,
  onToggleGalleryPhoto,
}: PhotoPickerProps) {
  if (availablePhotos.length === 0) {
    return (
      <div className="bg-armadillo-bg border border-armadillo-border rounded-lg p-4 text-center">
        <ImageIcon size={20} className="text-armadillo-muted mx-auto mb-2" />
        <p className="text-xs text-armadillo-muted">
          Fetch your Instagram data first to select photos from your feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header photo selection */}
      <div>
        <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1.5">
          Profile Photo
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {availablePhotos.slice(0, 8).map((url, i) => (
            <button
              key={`header-${i}`}
              onClick={() => onSetHeaderPhoto(url)}
              className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                headerPhotoUrl === url ? 'border-burnt' : 'border-armadillo-border hover:border-armadillo-muted'
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              {headerPhotoUrl === url && (
                <div className="absolute inset-0 bg-burnt/30 flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery photos */}
      <div>
        <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1.5">
          Gallery Photos ({galleryPhotoUrls.length}/6)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {availablePhotos.map((url, i) => {
            const isSelected = galleryPhotoUrls.includes(url);
            const isFull = galleryPhotoUrls.length >= 6 && !isSelected;
            return (
              <button
                key={`gallery-${i}`}
                onClick={() => !isFull && onToggleGalleryPhoto(url)}
                disabled={isFull}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  isSelected
                    ? 'border-burnt'
                    : isFull
                      ? 'border-armadillo-border opacity-40 cursor-not-allowed'
                      : 'border-armadillo-border hover:border-armadillo-muted'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {isSelected && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-burnt flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
