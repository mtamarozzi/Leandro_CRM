import { useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Image as ImageIcon, Star, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/src/types/database';

type MediaRow = Database['public']['Tables']['media']['Row'];

interface PhotoUploaderProps {
  media: MediaRow[];
  onUploadFiles: (files: File[]) => void | Promise<void>;
  onReorder: (orderedIds: string[]) => void;
  onSetCover: (mediaId: string) => void;
  onDelete: (media: MediaRow) => void;
  uploading?: boolean;
  disabled?: boolean;
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_MB = 5;

export function PhotoUploader({
  media,
  onUploadFiles,
  onReorder,
  onSetCover,
  onDelete,
  uploading = false,
  disabled = false,
  maxSizeMB = DEFAULT_MAX_MB,
  className,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const isInteractive = !disabled && !uploading;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const validate = (files: File[]): string | null => {
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return `${file.name}: formato não suportado. Use JPG, PNG ou WebP.`;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `${file.name}: maior que ${maxSizeMB}MB.`;
      }
    }
    return null;
  };

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    const validationError = validate(arr);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    void onUploadFiles(arr);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!isInteractive) return;
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (isInteractive) setDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = media.findIndex((m) => m.id === active.id);
    const newIndex = media.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(media, oldIndex, newIndex);
    onReorder(reordered.map((m) => m.id));
  };

  return (
    <div className={cn('photo-uploader', className)} data-slot="photo-uploader">
      <label
        htmlFor="photo-uploader-input"
        className={cn(
          'photo-uploader__drop',
          dragging && 'photo-uploader__drop--dragging',
          !isInteractive && 'photo-uploader__drop--disabled',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
      >
        <div className="photo-uploader__drop-content">
          <Upload size={28} aria-hidden="true" />
          <span className="photo-uploader__drop-title">
            {uploading ? 'Enviando…' : 'Arraste fotos ou clique para selecionar'}
          </span>
          <span className="photo-uploader__drop-hint">
            JPG, PNG ou WebP · até {maxSizeMB}MB cada · você pode selecionar várias
          </span>
        </div>
        <input
          id="photo-uploader-input"
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          className="photo-uploader__input"
          onChange={handleChange}
          disabled={!isInteractive}
        />
      </label>

      {error && (
        <p className="photo-uploader__error" role="alert">
          {error}
        </p>
      )}

      {media.length === 0 ? (
        <div className="photo-uploader__empty">
          <ImageIcon size={32} aria-hidden="true" />
          <span>Nenhuma foto enviada ainda.</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={media.map((m) => m.id)}
            strategy={rectSortingStrategy}
          >
            <div className="photo-uploader__grid">
              {media.map((m) => (
                <PhotoCard
                  key={m.id}
                  media={m}
                  disabled={!isInteractive}
                  onSetCover={() => onSetCover(m.id)}
                  onDelete={() => onDelete(m)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface PhotoCardProps {
  media: MediaRow;
  disabled: boolean;
  onSetCover: () => void;
  onDelete: () => void;
}

function PhotoCard({ media, disabled, onSetCover, onDelete }: PhotoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: media.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'photo-uploader__card',
        media.is_cover && 'photo-uploader__card--cover',
      )}
    >
      <button
        type="button"
        className="photo-uploader__handle"
        aria-label="Reordenar"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} aria-hidden="true" />
      </button>

      <img src={media.url} alt={media.caption ?? 'Foto do imóvel'} className="photo-uploader__thumb" />

      {media.is_cover && (
        <span className="photo-uploader__cover-badge" title="Foto de capa">
          <Star size={12} aria-hidden="true" /> Capa
        </span>
      )}

      <div className="photo-uploader__card-actions">
        <button
          type="button"
          className="photo-uploader__action"
          onClick={onSetCover}
          disabled={disabled || media.is_cover === true}
          title={media.is_cover ? 'Já é a capa' : 'Definir como capa'}
        >
          <Star size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="photo-uploader__action photo-uploader__action--danger"
          onClick={onDelete}
          disabled={disabled}
          title="Remover foto"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
