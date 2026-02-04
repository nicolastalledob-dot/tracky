'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import {
    ArrowLeft, Camera, User as UserIcon, Mail, Phone, Globe,
    FileText, Save, Loader2, Check
} from 'lucide-react'
import ImageCropModal from '@/components/ImageCropModal'

interface ProfileClientProps {
    user: User
    profile: Profile | null
}

const TIMEZONES = [
    { value: 'America/Lima', label: 'Lima (GMT-5)' },
    { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
    { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
    { value: 'Europe/London', label: 'Londres (GMT+0)' },
]

export default function ProfileClient({ user, profile }: ProfileClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [displayName, setDisplayName] = useState(profile?.display_name || '')
    const [bio, setBio] = useState(profile?.bio || '')
    const [phone, setPhone] = useState(profile?.phone || '')
    const [timezone, setTimezone] = useState(profile?.timezone || 'America/Lima')
    const [customAvatar, setCustomAvatar] = useState(profile?.custom_avatar_url || '')

    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Crop modal state
    const [cropFile, setCropFile] = useState<File | null>(null)

    // Use custom avatar if available, otherwise Google avatar
    const avatarUrl = customAvatar || profile?.avatar_url || null

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten imágenes')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen debe ser menor a 5MB')
            return
        }

        // Open crop modal
        setCropFile(file)
        setError(null)

        // Reset input so same file can be selected again
        e.target.value = ''
    }

    const handleCroppedImage = async (croppedBlob: Blob) => {
        setCropFile(null)
        setUploading(true)
        setError(null)

        try {
            const fileName = `${user.id}/avatar.jpg`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, croppedBlob, {
                    upsert: true,
                    contentType: 'image/jpeg'
                })

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    setError('El storage de avatares no está configurado. Ejecuta supabase_avatars_storage.sql')
                } else {
                    setError(uploadError.message)
                }
                setUploading(false)
                return
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Add timestamp to bust cache
            setCustomAvatar(`${publicUrl}?t=${Date.now()}`)
        } catch (err) {
            setError('Error al subir imagen')
        }

        setUploading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSaved(false)

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                display_name: displayName.trim() || null,
                bio: bio.trim() || null,
                phone: phone.trim() || null,
                timezone: timezone,
                custom_avatar_url: customAvatar || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            setError(updateError.message)
            setSaving(false)
            return
        }

        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            {/* Header */}
            <header className="bg-[#1a1a1a] border-b border-white/5 sticky top-0 z-40">
                <div className="max-w-lg mx-auto px-4">
                    <div className="flex items-center h-14 gap-3">
                        <button
                            onClick={() => router.back()}
                            className="text-gray-400 hover:text-white p-1"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="font-semibold text-white">Mi Perfil</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div
                        onClick={handleAvatarClick}
                        className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-violet-600 flex items-center justify-center text-white text-3xl font-bold">
                                {displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {uploading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <Camera className="w-6 h-6 text-white" />
                            )}
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <p className="text-gray-500 text-xs mt-2">Toca para cambiar</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Form */}
                <div className="space-y-5">
                    {/* Email (read-only) */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            Email
                        </label>
                        <input
                            type="email"
                            value={user.email || ''}
                            disabled
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5" />
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Tu nombre"
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Cuéntanos algo sobre ti..."
                            rows={3}
                            maxLength={160}
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                        />
                        <p className="text-xs text-gray-600 text-right mt-1">{bio.length}/160</p>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            Teléfono (opcional)
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+51 999 999 999"
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    {/* Timezone */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Zona horaria
                        </label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                        >
                            {TIMEZONES.map(tz => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full mt-8 py-3.5 rounded-xl bg-violet-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Guardando...</span>
                        </>
                    ) : saved ? (
                        <>
                            <Check className="w-5 h-5" />
                            <span>¡Guardado!</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            <span>Guardar Cambios</span>
                        </>
                    )}
                </button>

                {/* Account Info */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-xs text-gray-600 text-center">
                        Cuenta creada el {new Date(user.created_at).toLocaleDateString('es', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
            </main>

            {/* Image Crop Modal */}
            {cropFile && (
                <ImageCropModal
                    imageFile={cropFile}
                    onCrop={handleCroppedImage}
                    onClose={() => setCropFile(null)}
                />
            )}
        </div>
    )
}
