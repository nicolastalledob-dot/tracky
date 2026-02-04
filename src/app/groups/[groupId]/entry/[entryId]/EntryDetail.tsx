'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Group, GroupMember, Entry, ListItem } from '@/lib/types'
import { ChevronLeft, FileText, ListTodo, Wallet, Check, X, Camera, Plus, Trash2 } from 'lucide-react'

interface EntryDetailProps {
    user: User
    entry: Entry
    group: Group
    members: GroupMember[]
}

export default function EntryDetail({ user, entry, group, members }: EntryDetailProps) {
    const [localEntry, setLocalEntry] = useState(entry)
    const [listItems, setListItems] = useState<ListItem[]>(entry.list_items || [])
    const [newItem, setNewItem] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar esto?')) return

        setIsDeleting(true)
        const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', entry.id)

        if (!error) {
            router.push(`/groups/${group.id}`)
            router.refresh()
        } else {
            console.error(error)
            setIsDeleting(false)
        }
    }

    const handleMarkPaid = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('entries')
            .update({ is_paid: !localEntry.is_paid })
            .eq('id', entry.id)

        if (!error) {
            setLocalEntry({ ...localEntry, is_paid: !localEntry.is_paid })
        }
        setLoading(false)
    }

    const handleAddListItem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newItem.trim()) return

        setLoading(true)
        const { data, error } = await supabase
            .from('list_items')
            .insert({
                entry_id: entry.id,
                text: newItem.trim(),
                position: listItems.length
            })
            .select()
            .single()

        if (!error && data) {
            setListItems([...listItems, data])
            setNewItem('')
        }
        setLoading(false)
    }

    const handleToggleItem = async (item: ListItem) => {
        const { error } = await supabase
            .from('list_items')
            .update({
                is_completed: !item.is_completed,
                completed_by: !item.is_completed ? user.id : null,
                completed_at: !item.is_completed ? new Date().toISOString() : null
            })
            .eq('id', item.id)

        if (!error) {
            setListItems(listItems.map(i =>
                i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
            ))
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        const { error } = await supabase
            .from('list_items')
            .delete()
            .eq('id', itemId)

        if (!error) {
            setListItems(listItems.filter(i => i.id !== itemId))
        }
    }

    const typeLabels = { note: 'Nota', list: 'Lista', debt: 'Deuda' }
    const typeIcons = { note: FileText, list: ListTodo, debt: Wallet }
    const Icon = typeIcons[localEntry.entry_type]

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            {/* Header */}
            <header className="bg-[#1a1a1a] border-b border-white/5 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.back()}
                                className="text-gray-500 active:text-white p-1"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <p className="text-gray-500 text-xs">{group.name}</p>
                                <p className="text-white text-sm font-medium flex items-center gap-1.5">
                                    <Icon className="w-4 h-4 text-violet-400" />
                                    {typeLabels[localEntry.entry_type]}
                                </p>
                            </div>
                        </div>

                        {entry.author_id === user.id && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 text-gray-500 active:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
                {/* Title */}
                <h1 className="text-xl font-bold text-white mb-2">
                    {localEntry.title || 'Sin título'}
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                    {entry.author?.display_name} · {new Date(entry.created_at).toLocaleDateString('es', {
                        day: 'numeric', month: 'long'
                    })}
                </p>

                {/* Note Content */}
                {localEntry.entry_type === 'note' && localEntry.content && (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 mb-6">
                        <p className="text-gray-300 whitespace-pre-wrap text-sm">
                            {(localEntry.content as { text?: string }).text || 'Sin contenido'}
                        </p>
                    </div>
                )}

                {/* Debt */}
                {localEntry.entry_type === 'debt' && (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className={`text-3xl font-bold ${localEntry.is_paid ? 'text-green-500' : 'text-yellow-500'}`}>
                                {localEntry.currency === 'USD' ? '$' : 'S/.'}{localEntry.amount?.toLocaleString()}
                            </p>
                            <button
                                onClick={handleMarkPaid}
                                disabled={loading}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${localEntry.is_paid
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-yellow-500/10 text-yellow-500'
                                    }`}
                            >
                                {localEntry.is_paid ? '✓ Pagado' : 'Marcar pagado'}
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{localEntry.debtor?.display_name || '?'}</span>
                            <span>→</span>
                            <span>{localEntry.creditor?.display_name || entry.author?.display_name}</span>
                        </div>
                    </div>
                )}

                {/* List Items */}
                {localEntry.entry_type === 'list' && (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 mb-6">
                        <form onSubmit={handleAddListItem} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Agregar..."
                                className="flex-1 bg-[#252525] border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
                            />
                            <button
                                type="submit"
                                disabled={loading || !newItem.trim()}
                                className="px-3 py-2 bg-violet-600 text-white rounded-lg active:scale-[0.98] disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="space-y-1">
                            {listItems.length === 0 ? (
                                <p className="text-gray-600 text-sm text-center py-4">Sin items</p>
                            ) : (
                                listItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg ${item.is_completed ? 'bg-green-500/5' : 'bg-[#252525]'
                                            }`}
                                    >
                                        <button
                                            onClick={() => handleToggleItem(item)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.is_completed
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-600'
                                                }`}
                                        >
                                            {item.is_completed && <Check className="w-3 h-3" />}
                                        </button>
                                        <span className={`flex-1 text-sm ${item.is_completed ? 'text-gray-500 line-through' : 'text-white'
                                            }`}>
                                            {item.text}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="text-gray-600 active:text-red-500 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {listItems.length > 0 && (
                            <p className="text-gray-600 text-xs text-center mt-3">
                                {listItems.filter(i => i.is_completed).length}/{listItems.length}
                            </p>
                        )}
                    </div>
                )}

                {/* Photos */}
                {localEntry.attachments && localEntry.attachments.length > 0 && (
                    <div className="mb-6">
                        <p className="text-gray-500 text-sm mb-3 flex items-center gap-1.5">
                            <Camera className="w-4 h-4" />
                            Fotos ({localEntry.attachments.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {localEntry.attachments.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedImage(a.file_url)}
                                    className="aspect-square rounded-xl overflow-hidden bg-[#1a1a1a] active:opacity-80"
                                >
                                    <img src={a.file_url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedImage}
                        alt=""
                        className="max-w-full max-h-full rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
