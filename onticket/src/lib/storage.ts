import { supabase } from './supabase'

/**
 * Storage buckets configuration
 */
export const STORAGE_BUCKETS = {
  PRODUCTOS: 'productos-images',
  PROMOCIONES: 'promociones-images',
  COMBOS: 'combos-images',
} as const

/**
 * Validate image file type and size
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no soportado: ${file.type}. Usa JPG, PNG, GIF o WebP.`
    }
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `El archivo es demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: 5MB.`
    }
  }

  return { valid: true }
}

/**
 * Upload image to Supabase Storage
 * @param bucket - Storage bucket name
 * @param file - File to upload
 * @param clubId - Club ID for folder organization
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  bucket: string,
  file: File,
  clubId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `${clubId}/${timestamp}.${fileExt}`

    console.log('[Storage] Uploading image:', {
      bucket,
      fileName,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(2)}KB`
    })

    // Upload file to storage with explicit content type
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type, // Explicitly set content type
      })

    if (error) {
      console.error('[Storage] Upload error:', error)
      throw error
    }

    console.log('[Storage] Upload successful:', data.path)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('[Storage] Public URL:', publicUrl)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('[Storage] Error uploading image:', error)
    return { url: null, error: error as Error }
  }
}

/**
 * Delete image from Supabase Storage
 * @param bucket - Storage bucket name
 * @param imageUrl - Full URL of the image to delete
 * @returns Success status
 */
export async function deleteImage(
  bucket: string,
  imageUrl: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split(`${bucket}/`)
    if (urlParts.length < 2) {
      throw new Error('Invalid image URL')
    }
    const filePath = urlParts[1]

    // Delete file from storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      throw error
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting image:', error)
    return { success: false, error: error as Error }
  }
}

/**
 * Update image (delete old and upload new)
 * @param bucket - Storage bucket name
 * @param file - New file to upload
 * @param clubId - Club ID for folder organization
 * @param oldImageUrl - URL of the old image to delete (optional)
 * @returns Public URL of the new uploaded image
 */
export async function updateImage(
  bucket: string,
  file: File,
  clubId: string,
  oldImageUrl?: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Delete old image if exists
    if (oldImageUrl) {
      await deleteImage(bucket, oldImageUrl)
    }

    // Upload new image
    const result = await uploadImage(bucket, file, clubId)
    return result
  } catch (error) {
    console.error('Error updating image:', error)
    return { url: null, error: error as Error }
  }
}

/**
 * Get public URL for an image
 * @param bucket - Storage bucket name
 * @param filePath - File path in storage
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return data.publicUrl
}
