'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploaderProps {
    entryId?: string
    userId: string
    groupId: string
    onUpload?: (urls: string[]) => void
    maxFiles?: number
}

export default function ImageUploader({
    entryId,
    userId,
    groupId,
    onUpload,
    maxFiles = 5
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false)
    const [previews, setPreviews] = useState<string[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])

        if (selectedFiles.length + files.length > maxFiles) {
            setError(`Máximo ${maxFiles} archivos`)
            return
        }

        // Validate file types
        const validFiles = selectedFiles.filter(file => {
            if (!file.type.startsWith('image/')) {
                setError('Solo se permiten imágenes')
                return false
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Las imágenes deben ser menores a 5MB')
                return false
            }
            return true
        })

        setError(null)
        setFiles(prev => [...prev, ...validFiles])

        // Generate previews
        validFiles.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const uploadFiles = async (): Promise<string[]> => {
        if (files.length === 0) return []

        setUploading(true)
        const uploadedUrls: string[] = []

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${groupId}/${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('family-photos')
                    .upload(fileName, file)

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('family-photos')
                    .getPublicUrl(fileName)

                uploadedUrls.push(publicUrl)
            }

            if (onUpload) {
                onUpload(uploadedUrls)
            }

            // Clear after successful upload
            setFiles([])
            setPreviews([])

            return uploadedUrls
        } catch (err) {
            console.error('Upload failed:', err)
            setError('Error al subir las imágenes')
            return []
        } finally {
            setUploading(false)
        }
    }

    // Expose upload function
    const triggerUpload = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-3">
            {/* Upload Button */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            <button
                type="button"
                onClick={triggerUpload}
                disabled={uploading || files.length >= maxFiles}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors disabled:opacity-50"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Adjuntar fotos ({files.length}/{maxFiles})</span>
            </button>

            {/* Error Message */}
            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white/10">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="flex items-center gap-2 text-purple-400">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Subiendo...</span>
                </div>
            )}
        </div>
    )
}

// Export the upload function for parent components
export function useImageUploader() {
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    const addFiles = (newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles])
        newFiles.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result as string])
            }
            reader.readAsDataURL(file)
        })
    }

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
        setPreviews(prev => prev.filter((_, i) => i !== index))
    }

    const clearFiles = () => {
        setFiles([])
        setPreviews([])
    }

    return { files, previews, addFiles, removeFile, clearFiles }
}
