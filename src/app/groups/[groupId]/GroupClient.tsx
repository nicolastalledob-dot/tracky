'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Group, GroupMember, Entry, MemberRole, EntryType, Profile } from '@/lib/types'
import FinanceDashboard from '@/components/finance/FinanceDashboard'
import {
    ChevronLeft, ChevronRight, UserPlus, Plus,
    FileText, ListTodo, Wallet, LayoutGrid, Camera, X
} from 'lucide-react'

interface GroupClientProps {
    user: User
    group: Group
    role: MemberRole
    members: GroupMember[]
    entries: Entry[]
}

export default function GroupClient({ user, group, role, members, entries }: GroupClientProps) {
    const [activeCategory, setActiveCategory] = useState<EntryType | 'all'>('all')
    const [showInvite, setShowInvite] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [showCreateEntry, setShowCreateEntry] = useState(false)
    const [newEntryType, setNewEntryType] = useState<EntryType>('note')
    const router = useRouter()
    const supabase = createClient()

    const filteredEntries = activeCategory === 'all'
        ? entries
        : entries.filter(e => e.entry_type === activeCategory)

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return

        await supabase.from('invitations').insert({
            group_id: group.id,
            invited_by: user.id,
            email: inviteEmail.trim(),
            role: 'member'
        })

        setInviteEmail('')
        setShowInvite(false)
    }

    const categories = [
        { id: 'all', name: 'Todo', icon: LayoutGrid },
        { id: 'note', name: 'Notas', icon: FileText },
        { id: 'list', name: 'Listas', icon: ListTodo },
        { id: 'debt', name: 'Deudas', icon: Wallet },
    ]

    const typeIcons: Record<EntryType, typeof FileText> = {
        note: FileText,
        list: ListTodo,
        debt: Wallet
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            {/* Header */}
            <header className="bg-[#1a1a1a] border-b border-white/5 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-3">
                            <a href="/dashboard" className="text-gray-500 active:text-white p-1">
                                <ChevronLeft className="w-5 h-5" />
                            </a>
                            <div>
                                <h1 className="text-white font-semibold">{group.name}</h1>
                                <p className="text-gray-500 text-xs">{members.length} miembros</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {(role === 'admin' || role === 'orchestrator') && (
                                <button
                                    onClick={() => setShowInvite(true)}
                                    className="p-2 text-gray-500 active:text-white"
                                >
                                    <UserPlus className="w-5 h-5" />
                                </button>
                            )}
                            <div className="flex -space-x-1.5">
                                {members.slice(0, 3).map((member) => (
                                    <div
                                        key={member.id}
                                        className="w-7 h-7 rounded-full bg-violet-600 border-2 border-[#1a1a1a] flex items-center justify-center text-white text-xs"
                                    >
                                        {member.profile?.display_name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Categories */}
            <div className="max-w-3xl mx-auto px-4 mt-4">
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {categories.map((cat) => {
                        const Icon = cat.icon
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id as EntryType | 'all')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${activeCategory === cat.id
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-[#1a1a1a] text-gray-400 active:bg-[#252525]'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{cat.name}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="max-w-3xl mx-auto px-4 mt-4">
                <div className="grid grid-cols-3 gap-2">
                    {categories.slice(1).map((cat) => {
                        const Icon = cat.icon
                        return (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setNewEntryType(cat.id as EntryType)
                                    setShowCreateEntry(true)
                                }}
                                className="bg-[#1a1a1a] border border-white/5 rounded-xl p-3 text-center active:bg-[#252525] transition-colors"
                            >
                                <Icon className="w-5 h-5 text-violet-400 mx-auto" />
                                <p className="text-white text-xs mt-1.5">+ {cat.name.slice(0, -1)}</p>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                <h2 className="text-white font-medium mb-3">
                    {activeCategory === 'all' ? 'Reciente' : categories.find(c => c.id === activeCategory)?.name}
                </h2>

                {activeCategory === 'debt' ? (
                    <FinanceDashboard
                        debts={entries.filter(e => e.entry_type === 'debt')}
                        members={members.map(m => m.profile).filter(Boolean) as Profile[]}
                        currentUserId={user.id}
                    />
                ) : filteredEntries.length === 0 ? (
                    <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-8 text-center">
                        <p className="text-gray-500 text-sm">No hay contenido</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredEntries.map((entry) => {
                            const Icon = typeIcons[entry.entry_type]
                            return (
                                <EntryCard key={entry.id} entry={entry} groupId={group.id} Icon={Icon} />
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Create Entry Modal */}
            {showCreateEntry && (
                <CreateEntryModal
                    groupId={group.id}
                    userId={user.id}
                    entryType={newEntryType}
                    members={members}
                    onClose={() => setShowCreateEntry(false)}
                    onCreated={() => {
                        setShowCreateEntry(false)
                        router.refresh()
                    }}
                />
            )}

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-sm border border-white/5 animate-slide-up">
                        <h2 className="text-lg font-semibold text-white mb-4">Invitar</h2>
                        <form onSubmit={handleInvite}>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Email"
                                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                                autoFocus
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInvite(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 active:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium active:scale-[0.98] transition-transform"
                                >
                                    Enviar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function EntryCard({ entry, groupId, Icon }: { entry: Entry; groupId: string; Icon: typeof FileText }) {
    const hasAttachments = entry.attachments && entry.attachments.length > 0

    return (
        <a
            href={`/groups/${groupId}/entry/${entry.id}`}
            className="block bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:bg-[#252525] transition-colors"
        >
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate text-sm">{entry.title || 'Sin título'}</h3>
                        {hasAttachments && (
                            <Camera className="w-3.5 h-3.5 text-gray-500" />
                        )}
                    </div>

                    {entry.entry_type === 'debt' && entry.amount && (
                        <p className={`text-base font-semibold ${entry.is_paid ? 'text-green-500' : 'text-yellow-500'}`}>
                            {entry.currency === 'USD' ? '$' : 'S/.'}{entry.amount.toLocaleString()}
                        </p>
                    )}

                    {entry.entry_type === 'list' && entry.list_items && entry.list_items.length > 0 && (
                        <p className="text-gray-500 text-xs">
                            {entry.list_items.filter(i => i.is_completed).length}/{entry.list_items.length}
                        </p>
                    )}

                    {hasAttachments && (
                        <div className="flex gap-1.5 mt-2">
                            {entry.attachments!.slice(0, 3).map((a) => (
                                <img
                                    key={a.id}
                                    src={a.file_url}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            ))}
                        </div>
                    )}

                    <p className="text-gray-600 text-xs mt-2">
                        {entry.author?.display_name} · {new Date(entry.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            </div>
        </a>
    )
}

interface CreateEntryModalProps {
    groupId: string
    userId: string
    entryType: EntryType
    members: GroupMember[]
    onClose: () => void
    onCreated: () => void
}

function CreateEntryModal({ groupId, userId, entryType, members, onClose, onCreated }: CreateEntryModalProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN')
    const [debtorId, setDebtorId] = useState('')
    const [creating, setCreating] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const supabase = createClient()

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        const validFiles = selectedFiles.filter(file =>
            file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
        ).slice(0, 5 - files.length)

        setFiles(prev => [...prev, ...validFiles])

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        const entryData: Record<string, unknown> = {
            group_id: groupId,
            author_id: userId,
            entry_type: entryType,
            scope: 'shared',
            status: 'approved',
            title: title.trim() || null,
            content: entryType === 'note' ? { text: content } : {},
        }

        if (entryType === 'debt') {
            entryData.amount = parseFloat(amount) || 0
            entryData.currency = currency
            entryData.debtor_id = debtorId || null
            entryData.creditor_id = userId
            entryData.is_paid = false
        }

        const { data: entry, error } = await supabase
            .from('entries')
            .insert(entryData)
            .select()
            .single()

        if (error) {
            console.error('Error:', error)
            setCreating(false)
            return
        }

        // Upload images
        if (files.length > 0 && entry) {
            for (const file of files) {
                const ext = file.name.split('.').pop()
                const name = `${groupId}/${userId}/${Date.now()}.${ext}`

                const { error: uploadError } = await supabase.storage
                    .from('family-photos')
                    .upload(name, file)

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('family-photos')
                        .getPublicUrl(name)

                    await supabase.from('attachments').insert({
                        entry_id: entry.id,
                        uploaded_by: userId,
                        file_url: publicUrl,
                        file_name: file.name,
                        file_type: file.type,
                        file_size: file.size
                    })
                }
            }
        }

        setCreating(false)
        onCreated()
    }

    const typeLabels: Record<EntryType, string> = {
        note: 'Nota',
        list: 'Lista',
        debt: 'Deuda'
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-sm border border-white/5 max-h-[85vh] overflow-y-auto animate-slide-up">
                <h2 className="text-lg font-semibold text-white mb-4">Nueva {typeLabels[entryType]}</h2>
                <form onSubmit={handleCreate} className="space-y-3">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Título"
                        className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                        autoFocus
                    />

                    {entryType === 'note' && (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Contenido..."
                            rows={3}
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                        />
                    )}

                    {entryType === 'debt' && (
                        <>
                            <div className="flex gap-2">
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as 'PEN' | 'USD')}
                                    className="bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                                >
                                    <option value="PEN">S/.</option>
                                    <option value="USD">$</option>
                                </select>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Monto"
                                    className="flex-1 bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                                />
                            </div>
                            <select
                                value={debtorId}
                                onChange={(e) => setDebtorId(e.target.value)}
                                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                            >
                                <option value="">¿Quién debe?</option>
                                {members.map((m) => (
                                    <option key={m.user_id} value={m.user_id}>
                                        {m.profile?.display_name || 'Usuario'}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    {/* Photo Upload */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="photos"
                        />
                        <label
                            htmlFor="photos"
                            className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 active:border-violet-500 active:text-violet-500 cursor-pointer"
                        >
                            <Camera className="w-4 h-4" />
                            <span className="text-sm">Fotos ({files.length}/5)</span>
                        </label>

                        {previews.length > 0 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto">
                                {previews.map((p, i) => (
                                    <div key={i} className="relative flex-shrink-0">
                                        <img src={p} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 active:bg-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                        >
                            {creating ? 'Creando...' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
