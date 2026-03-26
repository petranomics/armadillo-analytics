'use client';

import { useRef, useCallback } from 'react';
import { ImageIcon, Upload, Trash2, X, Camera } from 'lucide-react';
import { toDataUrl } from '@/lib/image-cache';

interface PhotoPickerProps {
  availablePhotos: string[];
  uploadedPhotos: string[];
  headerPhotoUrl: string;
  galleryPhotoUrls: string[];
  coverPhotoUrl: string;
  onSetHeaderPhoto: (url: string) => void;
  onToggleGalleryPhoto: (url: string) => void;
  onSetCoverPhoto: (url: string) => void;
  onUploadPhotos: (dataUrls: string[]) => void;
  onRemoveUploadedPhoto: (dataUrl: string) => void;
}

function uploadFile(accept: string, multiple: boolean): Promise<string[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => {
      const files = input.files;
      if (!files || files.length === 0) { resolve([]); return; }
      const readers: Promise<string>[] = [];
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        readers.push(
          new Promise((res) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.readAsDataURL(file);
          })
        );
      }
      Promise.all(readers).then(resolve);
    };
    input.click();
  });
}

export default function PhotoPicker({
  availablePhotos,
  uploadedPhotos,
  headerPhotoUrl,
  galleryPhotoUrls,
  coverPhotoUrl,
  onSetHeaderPhoto,
  onToggleGalleryPhoto,
  onSetCoverPhoto,
  onUploadPhotos,
  onRemoveUploadedPhoto,
}: PhotoPickerProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const allPhotos = [...uploadedPhotos, ...availablePhotos];

  // Convert external URLs to data URLs before setting
  const handleSetHeader = useCallback(async (url: string) => {
    const cached = await toDataUrl(url);
    onSetHeaderPhoto(cached);
  }, [onSetHeaderPhoto]);

  const handleSetCover = useCallback(async (url: string) => {
    if (!url) { onSetCoverPhoto(''); return; }
    const cached = await toDataUrl(url);
    onSetCoverPhoto(cached);
  }, [onSetCoverPhoto]);

  const handleToggleGallery = useCallback(async (url: string) => {
    if (galleryPhotoUrls.includes(url)) {
      onToggleGalleryPhoto(url);
      return;
    }
    const cached = await toDataUrl(url);
    onToggleGalleryPhoto(cached);
  }, [galleryPhotoUrls, onToggleGalleryPhoto]);

  // Upload handlers for each section
  const handleUploadCover = async () => {
    const [dataUrl] = await uploadFile('image/*', false);
    if (dataUrl) {
      onUploadPhotos([dataUrl]);
      onSetCoverPhoto(dataUrl);
    }
  };

  const handleUploadProfile = async () => {
    const [dataUrl] = await uploadFile('image/*', false);
    if (dataUrl) {
      onUploadPhotos([dataUrl]);
      onSetHeaderPhoto(dataUrl);
    }
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* ---- COVER PHOTO ---- */}
      <div>
        <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1.5">
          Cover Photo
        </label>
        <p className="text-[10px] text-armadillo-muted/70 mb-2">Banner image at the top of your one-sheet</p>
        {coverPhotoUrl ? (
          <div className="relative">
            <img
              src={coverPhotoUrl}
              alt="Cover"
              className="w-full rounded-lg object-cover"
              style={{ aspectRatio: '21/9', maxHeight: '100px' }}
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                onClick={handleUploadCover}
                className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                title="Change cover"
              >
                <Camera size={11} className="text-white" />
              </button>
              <button
                onClick={() => handleSetCover('')}
                className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                title="Remove cover"
              >
                <X size={11} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleUploadCover}
            className="flex items-center gap-2 w-full justify-center bg-armadillo-bg border border-dashed border-armadillo-border rounded-lg px-4 py-5 text-xs text-armadillo-muted hover:border-burnt hover:text-burnt transition-colors"
          >
            <Upload size={14} />
            Upload Cover Photo
          </button>
        )}
      </div>

      {/* ---- PROFILE PHOTO ---- */}
      <div>
        <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium block mb-1.5">
          Profile Photo
        </label>
        <div className="flex items-center gap-3">
          {headerPhotoUrl ? (
            <div className="relative shrink-0">
              <img
                src={headerPhotoUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-armadillo-border"
              />
              <button
                onClick={handleUploadProfile}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-burnt hover:bg-burnt-light flex items-center justify-center transition-colors"
                title="Change profile photo"
              >
                <Camera size={10} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleUploadProfile}
              className="w-16 h-16 rounded-full bg-armadillo-bg border-2 border-dashed border-armadillo-border flex items-center justify-center hover:border-burnt transition-colors shrink-0"
            >
              <Camera size={16} className="text-armadillo-muted" />
            </button>
          )}
          {/* Quick pick from available photos */}
          {allPhotos.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {allPhotos.slice(0, 6).map((url, i) => (
                <button
                  key={`profile-${i}`}
                  onClick={() => handleSetHeader(url)}
                  className={`relative w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 transition-colors ${
                    headerPhotoUrl === url ? 'border-burnt' : 'border-armadillo-border hover:border-armadillo-muted'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- GALLERY PHOTOS ---- */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-armadillo-muted uppercase tracking-wider font-medium">
            Gallery Photos ({galleryPhotoUrls.length}/6)
          </label>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryFileSelect}
            className="hidden"
          />
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-1 text-[10px] text-burnt font-medium hover:underline"
          >
            <Upload size={10} />
            Upload
          </button>
        </div>
        <p className="text-[10px] text-armadillo-muted/70 mb-2">Select up to 6 photos to showcase on your one-sheet</p>

        {allPhotos.length === 0 ? (
          <div className="bg-armadillo-bg border border-armadillo-border rounded-lg p-4 text-center">
            <ImageIcon size={20} className="text-armadillo-muted mx-auto mb-2" />
            <p className="text-xs text-armadillo-muted">
              Upload photos or fetch your Instagram data to see feed photos here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {allPhotos.map((url, i) => {
              const isSelected = galleryPhotoUrls.includes(url);
              const isFull = galleryPhotoUrls.length >= 6 && !isSelected;
              const isUploaded = uploadedPhotos.includes(url);
              return (
                <div key={`gallery-${i}`} className="relative">
                  <button
                    onClick={() => !isFull && handleToggleGallery(url)}
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
                        <span className="text-white text-[9px] font-bold">{galleryPhotoUrls.indexOf(url) + 1}</span>
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
        )}
      </div>
    </div>
  );
}
