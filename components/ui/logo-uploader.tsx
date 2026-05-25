import { useId, useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoUploaderProps {
  currentUrl?: string | null;
  onFileSelected: (file: File) => void;
  onRemove?: () => void;
  uploading?: boolean;
  disabled?: boolean;
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const DEFAULT_MAX_MB = 2;

export function LogoUploader({
  currentUrl,
  onFileSelected,
  onRemove,
  uploading = false,
  disabled = false,
  maxSizeMB = DEFAULT_MAX_MB,
  className,
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reactId = useId();
  const inputId = `logo-${reactId}`;
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const preview = localPreview ?? currentUrl ?? null;
  const isInteractive = !disabled && !uploading;

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Formato não suportado. Use JPG, PNG, WebP ou SVG.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Arquivo maior que ${maxSizeMB}MB. Escolha uma imagem menor.`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    onFileSelected(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!isInteractive) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (isInteractive) setDragging(true);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  return (
    <div className={cn('logo-uploader', className)} data-slot="logo-uploader">
      <label
        htmlFor={inputId}
        className={cn(
          'logo-uploader__drop',
          dragging && 'logo-uploader__drop--dragging',
          !isInteractive && 'logo-uploader__drop--disabled',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
      >
        {preview ? (
          <img src={preview} alt="Logo do workspace" className="logo-uploader__preview" />
        ) : (
          <div className="logo-uploader__placeholder">
            <ImageIcon size={32} aria-hidden="true" />
            <span className="logo-uploader__placeholder-text">Nenhuma logo enviada</span>
          </div>
        )}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="logo-uploader__input"
          onChange={handleChange}
          disabled={!isInteractive}
        />
      </label>

      <div className="logo-uploader__actions">
        <button
          type="button"
          className="logo-uploader__button"
          onClick={() => inputRef.current?.click()}
          disabled={!isInteractive}
        >
          <Upload size={16} aria-hidden="true" />
          <span>{uploading ? 'Enviando…' : preview ? 'Trocar logo' : 'Enviar logo'}</span>
        </button>

        {preview && onRemove && (
          <button
            type="button"
            className="logo-uploader__button logo-uploader__button--danger"
            onClick={handleRemove}
            disabled={!isInteractive}
          >
            <Trash2 size={16} aria-hidden="true" />
            <span>Remover</span>
          </button>
        )}
      </div>

      <p className="logo-uploader__hint">
        PNG, JPG, WebP ou SVG · até {maxSizeMB}MB · fundo transparente recomendado.
      </p>

      {error && (
        <p className="logo-uploader__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
