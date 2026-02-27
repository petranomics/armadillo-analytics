'use client';

import { useRef } from 'react';
import { Check, ImageIcon, Upload, Trash2 } from 'lucide-react';

interface PhotoPickerProps {
  availablePhotos: string[];
  uploadedPhotos: string[];
  headerPhotoUrl: string;
  galleryPhotoUrls: string[];
  onSetHeaderPhoto: (url: string) => void;
  onToggleGalleryPhoto: (url: string) => void;
  onUploadPhotos: (dataUrls: string[]) => void;
  onRemoveUploadedPhoto: (dataUrl: string) => void;
}

export default function PhotoPicker({
  availablePhotos,
  uploadedPhotos,
  headerPhotoUrl,
  galleryPhotoUrls,
  onSetHeaderPhoto,
  onToggleGalleryPhoto,
  onUploadPhotos,
  onRemoveUploadedPhoto,
}: PhotoPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPhotos = [...uploadedPhotos, ...availablePhotos];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const readers: Promise<string>[] = [];
    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      readers.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
      );
    }

    Promise.all(readers).then((dataUrls) => {
      onUploadPhotos(dataUrls);
    });

    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 w-full justify-center bg-armadillo-bg border border-dashed border-armadillo-border rounded-lg px-4 py-3 text-xs text-armadillo-muted hover:border-burnt hover:text-burnt transition-colors"
        >
          <Upload size={14} />
          Upload Photos
        </button>
      </div>

      {allPhotos.length === 0 ? (
        <div className="bg-armadillo-bg border border-armadillo-border rounded-lg p-4 text-center">
          <ImageIcon size={20} className="text-armadillo-muted mx-auto mb-2" />
          <p className="text-xs text-armadillo-muted">
            Upload your own photos or fetch Instagram data for feed photos.
          </p>
        </div>
      ) : (
        <>
          {/* Header photo selection */}
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1.5">
              Profile Photo
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allPhotos.slice(0, 12).map((url, i) => {
                const isUploaded = uploadedPhotos.includes(url);
                return (
                  <div key={`header-${i}`} className="relative shrink-0">
                    <button
                      onClick={() => onSetHeaderPhoto(url)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
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
                    {isUploaded && (
                      <button
                        onClick={() => onRemoveUploadedPhoto(url)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger flex items-center justify-center"
                        title="Remove uploaded photo"
                      >
                        <Trash2 size={8} className="text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gallery photos */}
          <div>
            <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1.5">
              Gallery Photos ({galleryPhotoUrls.length}/6)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {allPhotos.map((url, i) => {
                const isSelected = galleryPhotoUrls.includes(url);
                const isFull = galleryPhotoUrls.length >= 6 && !isSelected;
                const isUploaded = uploadedPhotos.includes(url);
                return (
                  <div key={`gallery-${i}`} className="relative">
                    <button
                      onClick={() => !isFull && onToggleGalleryPhoto(url)}
                      disabled={isFull}
                      className={`relative aspect-square w-full rounded-lg overflow-hidden border-2 transition-colors ${
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
                    {isUploaded && (
                      <button
                        onClick={() => onRemoveUploadedPhoto(url)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger flex items-center justify-center z-10"
                        title="Remove uploaded photo"
                      >
                        <Trash2 size={8} className="text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
