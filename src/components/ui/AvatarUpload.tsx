import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import { avatarService } from '../../services/avatars';
import { Button } from './Button';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40'
};

const iconSizeClasses = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  size = 'lg'
}) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = avatarService.validateFile(file);
    if (!validation.valid) {
      onUploadError?.(validation.error || 'Arquivo inválido');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);

      const compressedFile = await avatarService.compressImage(file);

      const result = await avatarService.uploadAvatar(userId, compressedFile);

      setAvatarUrl(result.url);
      setPreview(null);
      onUploadSuccess?.(result.url);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';
      onUploadError?.(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Deseja remover o avatar?')) {
      return;
    }

    try {
      setUploading(true);
      await avatarService.deleteAvatar(userId);
      setAvatarUrl(null);
      setPreview(null);
      onUploadSuccess?.('');
    } catch (error) {
      console.error('Delete error:', error);
      onUploadError?.('Erro ao remover avatar');
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview || avatarUrl;
  const iconSize = iconSizeClasses[size];

  return (
    <div className="flex flex-col items-center space-y-4">
      <div 
        className="relative"
        aria-busy={uploading}
        aria-live="polite"
      >
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-gray-300 relative group`}
          role="img"
          aria-label={displayUrl ? "Preview do avatar" : "Nenhum avatar carregado"}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar do usuário"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera size={iconSize} className="text-gray-400" aria-hidden="true" />
          )}

          {uploading && (
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              role="status"
              aria-label="Fazendo upload do avatar"
            >
              <Loader size={iconSize} className="text-white animate-spin" aria-hidden="true" />
            </div>
          )}

          {!uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                type="button"
                aria-label="Fazer upload de avatar"
              >
                <Upload size={iconSize / 1.5} className="text-gray-700" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {avatarUrl && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            type="button"
            aria-label="Remover avatar"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Selecionar arquivo de imagem para avatar"
      />

      <div className="flex flex-col items-center space-y-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label={avatarUrl ? "Alterar avatar" : "Fazer upload de avatar"}
        >
          <Upload size={16} className="mr-2" aria-hidden="true" />
          {avatarUrl ? 'Alterar Avatar' : 'Upload Avatar'}
        </Button>

        <p className="text-xs text-gray-500 text-center" aria-label="Formatos aceitos: JPEG, PNG, WebP ou GIF. Tamanho máximo: 2MB">
          JPEG, PNG, WebP ou GIF
          <br />
          Máximo 2MB
        </p>
      </div>
    </div>
  );
};