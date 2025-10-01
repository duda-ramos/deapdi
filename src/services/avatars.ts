import type { StorageError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface UploadResult {
  url: string;
  path: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1024;
const COMPRESSION_QUALITY = 0.82;
const BUCKET_NAME = 'avatars';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const extensionFromMime: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

const sanitizeFileName = (name: string) => {
  const baseName = name.replace(/[^a-zA-Z0-9.\-]/g, '_');
  if (baseName.length > 0) {
    return baseName;
  }
  return `avatar.${Date.now()}`;
};

const resolveFileExtension = (file: File) => {
  const explicitExtension = file.name.split('.').pop()?.toLowerCase();
  if (explicitExtension && /^[a-z0-9]+$/.test(explicitExtension)) {
    return explicitExtension;
  }
  return extensionFromMime[file.type] ?? 'jpg';
};

const ensureSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Configuração do Supabase não encontrada. Verifique suas credenciais.');
  }
  return supabase;
};

const listAvatarFiles = async (userId: string) => {
  const client = ensureSupabaseClient();
  const { data, error } = await client.storage.from(BUCKET_NAME).list(userId, {
    limit: 100
  });

  if (error) {
    throw new Error('Não foi possível listar os arquivos de avatar existentes.');
  }

  return data ?? [];
};

const removeAvatarFiles = async (userId: string) => {
  const client = ensureSupabaseClient();
  const files = await listAvatarFiles(userId);

  if (files.length === 0) {
    return;
  }

  const paths = files.map(file => `${userId}/${file.name}`);
  const { error } = await client.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    throw new Error('Não foi possível remover o avatar atual.');
  }
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      resolve(reader.result);
    } else {
      reject(new Error('Falha ao processar o arquivo.'));
    }
  };
  reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'));
  reader.readAsDataURL(file);
});

const loadImage = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Não foi possível carregar a imagem para compressão.'));
  image.src = dataUrl;
});

const createCompressedBlob = async (image: HTMLImageElement, originalType: string): Promise<Blob | null> => {
  if (typeof document === 'undefined') {
    return null;
  }

  const canvas = document.createElement('canvas');
  let { width, height } = image;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const aspectRatio = width / height;

    if (aspectRatio > 1) {
      width = MAX_DIMENSION;
      height = Math.round(MAX_DIMENSION / aspectRatio);
    } else {
      height = MAX_DIMENSION;
      width = Math.round(MAX_DIMENSION * aspectRatio);
    }
  }

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0, width, height);

  const mimeType = originalType === 'image/png' ? 'image/png' : 'image/jpeg';

  return await new Promise<Blob | null>(resolve => {
    canvas.toBlob(
      blob => resolve(blob),
      mimeType,
      COMPRESSION_QUALITY
    );
  });
};

const compressImage = async (file: File): Promise<File> => {
  if (typeof window === 'undefined') {
    return file;
  }

  if (file.type === 'image/gif') {
    // Preserve GIF animations by skipping compression
    return file;
  }

  if (typeof Image === 'undefined' || typeof FileReader === 'undefined') {
    return file;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const blob = await createCompressedBlob(image, file.type);

    if (!blob) {
      return file;
    }

    if (blob.size >= file.size) {
      return file;
    }

    const compressedFile = new File([blob], sanitizeFileName(file.name), {
      type: blob.type,
      lastModified: Date.now()
    });

    return compressedFile;
  } catch (error) {
    console.warn('Falha ao comprimir imagem de avatar:', error);
    return file;
  }
};

const buildPublicUrl = (path: string) => {
  const client = ensureSupabaseClient();
  const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error('Não foi possível gerar a URL pública do avatar.');
  }

  return data.publicUrl;
};

const handleStorageError = (error: StorageError | null, fallbackMessage: string) => {
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error(fallbackMessage);
};

const uploadAvatar = async (userId: string, file: File): Promise<UploadResult> => {
  const client = ensureSupabaseClient();

  // Attempt to clear existing avatar files without blocking the upload process
  try {
    await removeAvatarFiles(userId);
  } catch (error) {
    console.warn('Não foi possível remover avatar anterior antes do upload:', error);
  }

  const extension = resolveFileExtension(file);
  const sanitizedName = sanitizeFileName(file.name).replace(/\.[^.]+$/, '');
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${sanitizedName || 'avatar'}-${uniqueSuffix}.${extension}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await client.storage.from(BUCKET_NAME).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type
  });

  if (error) {
    handleStorageError(error, 'Erro ao fazer upload do avatar.');
  }

  const publicUrl = buildPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath
  };
};

const deleteAvatar = async (userId: string) => {
  try {
    await removeAvatarFiles(userId);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro ao remover avatar.');
  }
};

const validateFile = (file: File): ValidationResult => {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Formato de arquivo inválido. Utilize JPEG, PNG, WebP ou GIF.'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'O arquivo excede o limite máximo de 2MB.'
    };
  }

  return { valid: true };
};

export const avatarService = {
  validateFile,
  compressImage,
  uploadAvatar,
  deleteAvatar
};

export type { UploadResult, ValidationResult };
