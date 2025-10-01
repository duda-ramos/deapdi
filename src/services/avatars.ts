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
    try {
      const fileName = `${userId}/${Date.now()}-${file.name}`;

      // Check if bucket exists and create helpful error message if not
      const { data: bucketList, error: bucketListError } = await supabase.storage.listBuckets();
      
      if (bucketListError) {
        console.error('Error checking buckets:', bucketListError);
        throw new Error('Não foi possível acessar o storage. Verifique se o Supabase está configurado corretamente.');
      }

      const avatarBucketExists = bucketList?.find(bucket => bucket.name === BUCKET_NAME);
      if (!avatarBucketExists) {
        throw new Error(`O bucket '${BUCKET_NAME}' não existe no Supabase. Para resolver: 1) Acesse o Supabase Dashboard, 2) Vá em Storage, 3) Clique em "New Bucket", 4) Nome: "${BUCKET_NAME}", 5) Marque como público, 6) Configure as políticas RLS apropriadas.`);
      }

      const { data: existingFiles, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(userId);

      if (listError) {
        // If it's just a "folder not found" error, that's fine - folder will be created
        if (!listError.message?.includes('not found') && !listError.message?.includes('does not exist')) {
          console.error('Error listing existing files:', listError);
          throw new Error(`Erro ao listar arquivos existentes: ${listError.message}`);
        }
        if (!listError.message?.includes('not found')) {
          console.error('Error listing existing files:', listError);
        }
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
        
        if (error.message?.includes('Bucket not found')) {
          throw new Error(`Bucket '${BUCKET_NAME}' não encontrado. Para resolver: 1) Acesse o Supabase Dashboard, 2) Vá em Storage, 3) Clique em "New Bucket", 4) Nome: "${BUCKET_NAME}", 5) Marque como público.`);
        }

        if (error.message?.includes('policy')) {
          throw new Error('Permissões insuficientes para upload. Configure as políticas RLS do bucket no Supabase Dashboard.');
        }

        if (error.message?.includes('size')) {
          throw new Error('Arquivo muito grande. Reduza o tamanho da imagem e tente novamente.');
        }

        throw new Error(`Erro no upload: ${error.message || 'Erro desconhecido'}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError);
        // Don't throw here - the file was uploaded successfully
        console.warn('Avatar uploaded but profile update failed. URL:', publicUrl);
      }

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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError);
        // Still return success since file was uploaded
        console.warn('Avatar uploaded successfully but profile update failed');
      }
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