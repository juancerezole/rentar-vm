import { useRef, useState } from 'react';
import { Upload, X, Loader2, ImagePlus, GripVertical } from 'lucide-react';
import { api } from '../api.js';

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = 'rentar_properties';
const MAX_IMAGES    = 10;
const MAX_MB        = 5;

export default function ImageUploader({ propertyId, images, onImagesChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [dragOver, setDragOver]   = useState(false);
  const inputRef = useRef(null);

  async function uploadFiles(files) {
    setError('');
    const slots     = MAX_IMAGES - images.length;
    const toUpload  = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, slots);
    if (toUpload.length === 0) return;
    if (images.length >= MAX_IMAGES) {
      setError(`Máximo ${MAX_IMAGES} fotos por propiedad.`);
      return;
    }

    setUploading(true);
    const added = [];
    try {
      for (const file of toUpload) {
        if (file.size > MAX_MB * 1024 * 1024) {
          setError(`"${file.name}" supera los ${MAX_MB}MB permitidos.`);
          continue;
        }

        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', UPLOAD_PRESET);

        const cldRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: fd },
        );
        const cldData = await cldRes.json();
        if (!cldRes.ok) throw new Error(cldData.error?.message || 'Error en Cloudinary');

        const { data } = await api.post(`/properties/${propertyId}/images`, {
          url:       cldData.secure_url,
          public_id: cldData.public_id,
        });
        added.push(data.image);
      }
      onImagesChange([...images, ...added]);
    } catch (err) {
      setError(err.message || 'Error al subir la foto.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(imgId) {
    const img = images.find(i => i.id === imgId);
    if (!img) return;
    try {
      await api.delete(`/properties/${propertyId}/images/${imgId}`);
      onImagesChange(images.filter(i => i.id !== imgId));
    } catch {
      setError('Error al eliminar la foto.');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  }

  const remaining = MAX_IMAGES - images.length;

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((img, i) => (
            <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-ink-200 dark:border-night-border bg-ink-100 dark:bg-night-elevated">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-brand/80 dark:bg-accent-orange/80 text-white text-[9px] font-bold text-center py-0.5">
                  Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
            dragOver
              ? 'border-brand dark:border-accent-orange bg-brand-soft dark:bg-accent-orange/10'
              : 'border-ink-200 dark:border-night-border hover:border-brand-mid dark:hover:border-accent-orange/60 hover:bg-ink-50 dark:hover:bg-night-elevated/50'
          }`}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-ink-500 dark:text-night-muted">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Subiendo...</span>
            </div>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 text-ink-300 dark:text-night-border mx-auto mb-2" />
              <p className="text-sm font-medium text-ink-600 dark:text-night-muted">
                Arrastrá fotos aquí o <span className="text-brand dark:text-accent-orange underline">seleccioná archivos</span>
              </p>
              <p className="text-xs text-ink-400 dark:text-night-dim mt-1">
                JPG, PNG o WebP · Máx. {MAX_MB}MB · {images.length}/{MAX_IMAGES} fotos
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => uploadFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
