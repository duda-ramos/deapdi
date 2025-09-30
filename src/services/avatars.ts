import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET_NAME = 'avatars';

export interface AvatarUploadResult {
  url: string;
  path: string;
}

export const avatarService = {
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo selecionado' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Formato não permitido. Use JPEG, PNG, WebP ou GIF'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Máximo: 2MB'
      };
    }

    return { valid: true };
  },

  async uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    try {
      const { data: existingFiles, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(userId);

      if (listError) {
        console.error('Error listing existing files:', listError);
      }

      if (existingFiles && existingFiles.length > 0) {
        for (const existingFile of existingFiles) {
          await supabase.storage
            .from(BUCKET_NAME)
            .remove([`${userId}/${existingFile.name}`]);
        }
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error('Erro ao fazer upload do avatar');
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      return {
        url: publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error instanceof Error ? error : new Error('Erro ao fazer upload do avatar');
    }
  },

  async deleteAvatar(userId: string): Promise<void> {
    try {
      const { data: files } = await supabase.storage
        .from(BUCKET_NAME)
        .list(userId);

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

        if (error) {
          throw error;
        }
      }

      await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);
    } catch (error) {
      console.error('Avatar delete error:', error);
      throw new Error('Erro ao deletar avatar');
    }
  },

  getAvatarUrl(userId: string, fileName?: string): string | null {
    if (!fileName) return null;

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${userId}/${fileName}`);

    return data.publicUrl;
  },

  async compressImage(file: File, maxWidth: number = 500, maxHeight: number = 500): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            file.type,
            0.9
          );
        };
        img.onerror = () => reject(new Error('Could not load image'));
      };
      reader.onerror = () => reject(new Error('Could not read file'));
    });
  }
};