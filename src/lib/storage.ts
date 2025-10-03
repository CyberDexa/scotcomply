/**
 * File Storage Utilities
 * 
 * Uses Cloudflare R2 (S3-compatible) for file storage
 * Falls back to local storage for development if R2 credentials are not configured
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'

// Initialize R2 client (S3-compatible)
const r2Client = env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    })
  : null

/**
 * Upload a file to R2 storage
 * @param file - The file to upload
 * @param folder - Optional folder path (e.g., 'certificates', 'documents')
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File, folder: string = 'certificates'): Promise<string> {
  const timestamp = Date.now()
  const sanitizedName = sanitizeFileName(file.name)
  const key = `${folder}/${timestamp}-${sanitizedName}`
  
  // If R2 is configured, upload to R2
  if (r2Client && env.R2_BUCKET_NAME) {
    try {
      // Convert File to Buffer for upload
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Upload to R2
      await r2Client.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ContentLength: file.size,
        })
      )
      
      console.log('✓ File uploaded to R2:', key)
      
      // Return public URL if configured, otherwise return key
      if (env.R2_PUBLIC_URL) {
        return `${env.R2_PUBLIC_URL}/${key}`
      }
      
      // If no public URL, store the key and use signed URLs for access
      return key
    } catch (error) {
      console.error('Failed to upload file to R2:', error)
      throw new Error('File upload failed')
    }
  }
  
  // Fallback for development without R2 configured
  console.log('⚠️  R2 not configured - file upload simulated:', {
    name: file.name,
    size: file.size,
    type: file.type,
    destination: key,
  })
  
  return `/uploads/${key}`
}

/**
 * Delete a file from R2 storage
 * @param fileUrl - The URL or key of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  // Extract key from URL
  const key = fileUrl.startsWith('http') 
    ? fileUrl.split('/').slice(3).join('/') // Remove domain
    : fileUrl
  
  if (r2Client && env.R2_BUCKET_NAME) {
    try {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
        })
      )
      console.log('✓ File deleted from R2:', key)
    } catch (error) {
      console.error('Failed to delete file from R2:', error)
      throw new Error('File deletion failed')
    }
  } else {
    console.log('⚠️  R2 not configured - file deletion simulated:', fileUrl)
  }
}

/**
 * Generate a signed URL for secure file access
 * @param fileUrl - The URL or key of the file
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns Signed URL that expires after the specified time
 */
export async function getSignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
  // Extract key from URL
  const key = fileUrl.startsWith('http') 
    ? fileUrl.split('/').slice(3).join('/') // Remove domain
    : fileUrl
  
  if (r2Client && env.R2_BUCKET_NAME) {
    try {
      const command = new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      })
      
      const signedUrl = await getS3SignedUrl(r2Client, command, { expiresIn })
      return signedUrl
    } catch (error) {
      console.error('Failed to generate signed URL:', error)
      throw new Error('Failed to generate secure file URL')
    }
  }
  
  // Fallback for development without R2
  return fileUrl
}

/**
 * Sanitize file name to remove unsafe characters
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9.-]/g, '') // Remove special characters
    .replace(/\.+/g, '.') // Remove multiple dots
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: {
  maxSize?: number // in bytes
  allowedTypes?: string[]
} = {}): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  } = options

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Convert file to base64 (useful for previews)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
