import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/auth/dal';
import { createServiceClient } from '@/lib/supabase/server';

const AVATAR_BUCKET = 'tutor-avatars';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getFileExtension(fileName: string, mimeType: string): string {
  const fromName = fileName.split('.').pop()?.trim().toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

async function ensureAvatarBucket() {
  const supabase = await createServiceClient();
  const { error: getBucketError } = await supabase.storage.getBucket(AVATAR_BUCKET);

  if (!getBucketError) {
    return supabase;
  }

  const message = getBucketError.message.toLowerCase();
  const bucketMissing = message.includes('not found') || message.includes('does not exist');

  if (!bucketMissing) {
    throw getBucketError;
  }

  const { error: createBucketError } = await supabase.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });

  if (createBucketError) {
    throw createBucketError;
  }

  return supabase;
}

export async function POST(request: NextRequest) {
  try {
    const userData = await getApiUser();
    const formData = await request.formData();
    const photoFile = formData.get('photo');

    if (!(photoFile instanceof File)) {
      return NextResponse.json({ error: 'Debes adjuntar un archivo de imagen.' }, { status: 400 });
    }

    if (!photoFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten archivos de imagen.' }, { status: 400 });
    }

    if (photoFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'La imagen no puede superar 5 MB.' }, { status: 400 });
    }

    const supabase = await ensureAvatarBucket();
    const extension = getFileExtension(photoFile.name, photoFile.type);
    const filePath = `${userData.dbUser.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, photoFile, {
        contentType: photoFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading tutor avatar:', uploadError);
      return NextResponse.json({ error: 'No se pudo subir la foto de perfil.' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    const avatarUrl = publicUrlData.publicUrl;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userData.dbUser.id)
      .select('avatar_url')
      .single();

    if (updateError || !updatedUser) {
      console.error('Error updating avatar_url in users:', updateError);
      return NextResponse.json({ error: 'No se pudo actualizar la foto en tu perfil.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatar_url,
      message: 'Foto de perfil actualizada correctamente.',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('Unexpected error in POST /api/tutor/photo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
