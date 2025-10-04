import { useState } from 'react'
import { uploadImage, deleteImage, updateImage } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'

interface UseImageUploadReturn {
  uploading: boolean
  preview: string | null
  uploadedUrl: string | null
  error: string | null
  handleFileSelect: (file: File | null) => Promise<void>
  handleUpload: (bucket: string) => Promise<string | null>
  handleUpdate: (bucket: string, oldUrl?: string) => Promise<string | null>
  handleDelete: (bucket: string, imageUrl: string) => Promise<boolean>
  clearPreview: () => void
  clearError: () => void
}

/**
 * Custom hook for image upload functionality
 * Provides state management and handlers for image upload, update, and delete
 */
export function useImageUpload(): UseImageUploadReturn {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Validate file
  const validateFile = (file: File): string | null => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (file.size > MAX_FILE_SIZE) {
      return 'La imagen no debe superar 5MB'
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Solo se permiten imágenes JPG, PNG, WebP o GIF'
    }

    return null
  }

  // Handle file selection and preview
  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setPreview(null)
      setSelectedFile(null)
      setError(null)
      return
    }

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setPreview(null)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Generate preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.onerror = () => {
      setError('Error al generar vista previa')
    }
    reader.readAsDataURL(file)
  }

  // Upload image
  const handleUpload = async (bucket: string): Promise<string | null> => {
    if (!selectedFile) {
      setError('No hay archivo seleccionado')
      return null
    }

    if (!user) {
      setError('Usuario no autenticado')
      return null
    }

    setUploading(true)
    setError(null)

    const { url, error: uploadError } = await uploadImage(
      bucket,
      selectedFile,
      user.club.id
    )

    setUploading(false)

    if (uploadError) {
      setError(uploadError.message || 'Error al subir imagen')
      return null
    }

    setUploadedUrl(url)
    return url
  }

  // Update image (delete old, upload new)
  const handleUpdate = async (
    bucket: string,
    oldUrl?: string
  ): Promise<string | null> => {
    if (!selectedFile) {
      setError('No hay archivo seleccionado')
      return null
    }

    if (!user) {
      setError('Usuario no autenticado')
      return null
    }

    setUploading(true)
    setError(null)

    const { url, error: updateError } = await updateImage(
      bucket,
      selectedFile,
      user.club.id,
      oldUrl
    )

    setUploading(false)

    if (updateError) {
      setError(updateError.message || 'Error al actualizar imagen')
      return null
    }

    setUploadedUrl(url)
    return url
  }

  // Delete image
  const handleDelete = async (
    bucket: string,
    imageUrl: string
  ): Promise<boolean> => {
    setUploading(true)
    setError(null)

    const { success, error: deleteError } = await deleteImage(bucket, imageUrl)

    setUploading(false)

    if (deleteError) {
      setError(deleteError.message || 'Error al eliminar imagen')
      return false
    }

    setUploadedUrl(null)
    setPreview(null)
    return success
  }

  // Clear preview
  const clearPreview = () => {
    setPreview(null)
    setSelectedFile(null)
    setUploadedUrl(null)
  }

  // Clear error
  const clearError = () => {
    setError(null)
  }

  return {
    uploading,
    preview,
    uploadedUrl,
    error,
    handleFileSelect,
    handleUpload,
    handleUpdate,
    handleDelete,
    clearPreview,
    clearError,
  }
}
