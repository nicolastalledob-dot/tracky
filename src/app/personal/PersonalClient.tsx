'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Entry, EntryType, ListItem, Profile } from '@/lib/types'
import {
    FileText, ListTodo, Wallet, Camera,
    Plus, ArrowUpRight, ArrowDownLeft, X, Check,
    CheckSquare, Calendar
} from 'lucide-react'
import KanbanBoard from '@/components/KanbanBoard'
import PersonalHeader from '@/components/personal/PersonalHeader'
import FocusToolbar from '@/components/personal/FocusToolbar'
import TaskList from '@/components/personal/TaskList'
import { useTaskFilters } from '@/lib/hooks/useTaskFilters'
import CalendarGrid from '@/components/calendar/CalendarGrid'

interface PersonalClientProps {
    user: User
    profile: Profile | null
    entries: Entry[]
    globalDebts: Entry[]
    debugError?: string | null
}

export default function PersonalClient({ user, profile, entries, globalDebts, debugError }: PersonalClientProps) {
    const [activeView, setActiveView] = useState<'focus' | 'kanban' | 'timeline'>('focus')
    const [showCreateTask, setShowCreateTask] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Use the new task filters hook
    const { filters, toggleFilter, filteredTasks, stats } = useTaskFilters(entries)

    // Stats for header
    const pendingTasks = entries.filter(e => e.task_status === 'pending' || !e.task_status).length
    const completedTasks = entries.filter(e => e.task_status === 'completed').length

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            {/* Header */}
            <PersonalHeader
                user={user}
                profile={profile}
                pendingCount={pendingTasks}
                completedCount={completedTasks}
                onSignOut={handleSignOut}
            />

            {/* Global Tabs */}
            <div className="max-w-6xl mx-auto px-4 mt-4">
                <div className="flex gap-1 p-1 bg-[#1a1a1a] rounded-xl mb-4">
                    <button
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#252525] text-white transition-colors"
                    >
                        Personal
                    </button>
                    <a
                        href="/dashboard"
                        className="flex-1 py-2.5 rounded-lg text-center text-sm font-medium text-gray-500 transition-colors active:bg-[#252525]"
                    >
                        Grupos
                    </a>
                </div>
            </div>

            {/* View Tabs */}
            <div className="max-w-6xl mx-auto px-4 mt-4">
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    <TabButton
                        active={activeView === 'focus'}
                        onClick={() => setActiveView('focus')}
                        icon={CheckSquare}
                        label="Focus"
                    />
                    <TabButton
                        active={activeView === 'kanban'}
                        onClick={() => setActiveView('kanban')}
                        icon={CheckSquare}
                        label="Kanban"
                    />
                    <TabButton
                        active={activeView === 'timeline'}
                        onClick={() => setActiveView('timeline')}
                        icon={Calendar}
                        label="Calendario"
                    />
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {activeView === 'focus' ? (
                    <>
                        {/* New Task Button */}
                        <button
                            onClick={() => setShowCreateTask(true)}
                            className="w-full mb-6 py-3 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:border-violet-500 hover:text-violet-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nuevo Cumplimiento</span>
                        </button>

                        {/* Focus Toolbar */}
                        <div className="mb-6">
                            <FocusToolbar
                                filters={filters}
                                stats={stats}
                                onToggleFilter={toggleFilter}
                            />
                        </div>

                        {/* Focus Tasks */}
                        <TaskList
                            tasks={filteredTasks.focusTasks}
                            title="Tareas Prioritarias"
                            emptyMessage="No hay tareas urgentes o para hoy"
                            className="mb-6"
                        />

                        {/* Future Tasks (collapsible) */}
                        {filters.showFuture && filteredTasks.futureTasks.length > 0 && (
                            <TaskList
                                tasks={filteredTasks.futureTasks}
                                title="Más Tarde"
                                className="mb-6"
                            />
                        )}

                        {/* Completed Tasks (collapsible) */}
                        {filters.showCompleted && filteredTasks.completedTasks.length > 0 && (
                            <TaskList
                                tasks={filteredTasks.completedTasks}
                                title="Completadas"
                                className="mb-6"
                            />
                        )}

                        {/* Cancelled Tasks (collapsible) */}
                        {filters.showCancelled && filteredTasks.cancelledTasks.length > 0 && (
                            <TaskList
                                tasks={filteredTasks.cancelledTasks}
                                title="Canceladas"
                                className="mb-6"
                            />
                        )}
                    </>
                ) : activeView === 'kanban' ? (
                    <>
                        {/* New Task Button */}
                        <button
                            onClick={() => setShowCreateTask(true)}
                            className="w-full mb-6 py-3 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:border-violet-500 hover:text-violet-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nuevo Cumplimiento</span>
                        </button>

                        {/* Kanban Board */}
                        <KanbanBoard
                            entries={entries}
                            onUpdate={() => router.refresh()}
                            showAssignees={false}
                        />
                    </>
                ) : (
                    <>
                        {/* New View Toggle with Calendar Icon Logic */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-violet-500" />
                                Calendario
                            </h2>
                            <button
                                onClick={() => setShowCreateTask(true)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo
                            </button>
                        </div>

                        <CalendarGrid entries={entries} />
                    </>
                )}
            </main>

            {/* Create Task Modal */}
            {showCreateTask && (
                <CreateTaskModal
                    userId={user.id}
                    existingCategories={[...new Set(entries.map(e => e.category).filter(Boolean) as string[])]}
                    onClose={() => setShowCreateTask(false)}
                    onCreated={() => {
                        setShowCreateTask(false)
                        router.refresh()
                    }}
                />
            )}
        </div>
    )
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${active
                ? 'bg-violet-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 active:bg-[#252525]'
                }`}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    )
}

function ActionButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-center gap-2 bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:bg-[#252525] transition-colors"
        >
            <Icon className="w-5 h-5 text-violet-400" />
            <span className="text-white text-sm font-medium">{label}</span>
        </button>
    )
}



function DebtsView({ debts, summary, userId }: { debts: Entry[], summary: any, userId: string }) {
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(summary).map(([currency, amounts]: [string, any]) => (
                    <div key={currency} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-5">
                        <h3 className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider">
                            Balance ({currency === 'PEN' ? 'Soles' : 'Dólares'})
                        </h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-500 mb-1 flex items-center gap-1">
                                    <ArrowDownLeft className="w-3 h-3" /> Te deben
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {currency === 'PEN' ? 'S/.' : '$'}
                                    {amounts.owed.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-red-500 mb-1 flex items-center gap-1 justify-end">
                                    Debes <ArrowUpRight className="w-3 h-3" />
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {currency === 'PEN' ? 'S/.' : '$'}
                                    {amounts.owe.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Debts List */}
            <div>
                <h3 className="text-white font-medium mb-3">Historial de Deudas</h3>
                <div className="space-y-2">
                    {debts.map((debt) => {
                        const isDebtor = debt.debtor_id === userId
                        const currencySymbol = debt.currency === 'USD' ? '$' : 'S/.'

                        return (
                            <a
                                key={debt.id}
                                href={`/groups/${debt.group_id}/entry/${debt.id}`}
                                className="block bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:bg-[#252525] transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white text-sm font-medium">{debt.title || 'Deuda sin título'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                                                {(debt as any).group?.name}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {isDebtor ? `Le debes a ${(debt as any).creditor?.display_name}` : `Te debe ${(debt as any).debtor?.display_name}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${debt.is_paid ? 'text-green-500' : isDebtor ? 'text-red-400' : 'text-green-400'}`}>
                                            {currencySymbol}{debt.amount?.toLocaleString()}
                                        </p>
                                        {debt.is_paid && (
                                            <span className="text-[10px] text-green-500 flex items-center justify-end gap-1">
                                                <Check className="w-3 h-3" /> Pagado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </a>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function PersonalEntryCard({ entry }: { entry: Entry }) {
    const typeIcons: Record<EntryType, any> = {
        note: FileText,
        list: ListTodo,
        debt: Wallet
    }
    const Icon = typeIcons[entry.entry_type]

    return (
        <a href={`/personal/entry/${entry.id}`} className="block bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:bg-[#252525] transition-colors">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate text-sm">{entry.title || 'Sin título'}</h3>
                        {entry.attachments && entry.attachments.length > 0 && (
                            <Camera className="w-3.5 h-3.5 text-gray-500" />
                        )}
                    </div>

                    {entry.entry_type === 'note' && (entry.content as any).text && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {(entry.content as any).text}
                        </p>
                    )}

                    {entry.entry_type === 'list' && entry.list_items && (
                        <p className="text-gray-500 text-xs mt-1">
                            {entry.list_items.filter((i: ListItem) => i.is_completed).length}/{entry.list_items.length} items
                        </p>
                    )}

                    <p className="text-gray-600 text-xs mt-2">
                        {new Date(entry.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </p>
                </div>
            </div>
        </a>
    )
}

function CreatePersonalEntryModal({ userId, entryType, onClose, onCreated }: { userId: string, entryType: EntryType, onClose: () => void, onCreated: () => void }) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [creating, setCreating] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])

    // List Items State
    const [listItems, setListItems] = useState<string[]>([])
    const [newItemText, setNewItemText] = useState('')

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

    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        setErrorMsg(null)

        const { data: entry, error } = await supabase
            .from('entries')
            .insert({
                author_id: userId,
                entry_type: entryType,
                scope: 'personal',
                status: 'approved',
                title: title.trim() || null,
                content: entryType === 'note' ? { text: content } : {},
                group_id: null
            })
            .select()
            .single()

        if (error) {
            console.error('Error:', error)
            setErrorMsg(error.message || 'Error desconocido')
            setCreating(false)
            return
        }

        // Check for list items if type is list
        if (entryType === 'list' && listItems.length > 0 && entry) {
            const itemsToInsert = listItems.map((text, index) => ({
                entry_id: entry.id,
                text: text,
                position: index,
                is_completed: false
            }))

            const { error: listError } = await supabase
                .from('list_items')
                .insert(itemsToInsert)

            if (listError) console.error('Error adding list items:', listError)
        }

        // Upload images logic is same as before...
        // ... (skipping for brevity, identical to GroupClient) ...
        if (files.length > 0 && entry) {
            // ... upload logic ...
        }

        setCreating(false)
        onCreated()
    }

    const handleAddItem = () => {
        if (!newItemText.trim()) return
        setListItems(prev => [...prev, newItemText.trim()])
        setNewItemText('')
    }

    const removeListItem = (idx: number) => {
        setListItems(prev => prev.filter((_, i) => i !== idx))
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-sm border border-white/5 animate-slide-up">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Nueva {entryType === 'note' ? 'Nota Personal' : 'Lista Personal'}
                </h2>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4">
                        {errorMsg}
                    </div>
                )}

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

                    {entryType === 'list' && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    placeholder="Agregar item..."
                                    className="flex-1 bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddItem()
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="px-3 bg-[#252525] border border-white/10 rounded-xl text-violet-400 active:bg-[#333]"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* List Preview */}
                            {listItems.length > 0 && (
                                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                    {listItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-[#252525]/50 px-3 py-2 rounded-lg border border-white/5">
                                            <span className="text-sm text-gray-300 truncate">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeListItem(idx)}
                                                className="text-gray-500 hover:text-red-400"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Photo Upload UI (Simulated) */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="personal-photos"
                        />
                        <label
                            htmlFor="personal-photos"
                            className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/10 rounded-xl text-gray-500 active:border-violet-500 active:text-violet-500 cursor-pointer"
                        >
                            <Camera className="w-4 h-4" />
                            <span className="text-sm">Fotos ({files.length}/5)</span>
                        </label>
                        {/* Previews... */}
                    </div>
                </form>
            </div>
        </div>
    )
}

function CreateTaskModal({ userId, existingCategories = [], onClose, onCreated }: { userId: string, existingCategories?: string[], onClose: () => void, onCreated: () => void }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [expirationDate, setExpirationDate] = useState('')
    const [priority, setPriority] = useState<'urgent' | 'normal' | 'low'>('normal')
    const [category, setCategory] = useState('')
    const [showCategoryInput, setShowCategoryInput] = useState(false)
    const [isListMode, setIsListMode] = useState(false)
    const [checklist, setChecklist] = useState<{ id: string, text: string, done: boolean }[]>([])
    const [newItem, setNewItem] = useState('')
    const [creating, setCreating] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const supabase = createClient()

    const addChecklistItem = () => {
        if (!newItem.trim()) return
        setChecklist([...checklist, { id: crypto.randomUUID(), text: newItem.trim(), done: false }])
        setNewItem('')
    }

    const removeChecklistItem = (id: string) => {
        setChecklist(checklist.filter(item => item.id !== id))
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) {
            setErrorMsg('El título es requerido')
            return
        }

        if (isListMode && checklist.length === 0) {
            setErrorMsg('Agrega al menos un item a la lista')
            return
        }

        setCreating(true)
        setErrorMsg(null)

        const content = isListMode
            ? { text: description, checklist: checklist }
            : { text: description }

        const { error } = await supabase
            .from('entries')
            .insert({
                author_id: userId,
                entry_type: isListMode ? 'list' : 'note',
                scope: 'personal',
                status: 'approved',
                title: title.trim(),
                content: content,
                group_id: null,
                due_date: dueDate || null,
                expiration_date: expirationDate || null,
                task_status: 'pending',
                priority: priority,
                category: category.trim() || null
            })

        if (error) {
            console.error('Error:', error)
            setErrorMsg(error.message || 'Error desconocido')
            setCreating(false)
            return
        }

        setCreating(false)
        onCreated()
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-md border border-white/5 animate-slide-up max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-white mb-4">
                    Nuevo Cumplimiento
                </h2>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg mb-4">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Título *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="¿Qué necesitas cumplir?"
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                            autoFocus
                        />
                    </div>

                    {/* List Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-[#252525] rounded-xl border border-white/10">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white">📋 Modo Lista</span>
                            <span className="text-xs text-gray-500">(con items)</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsListMode(!isListMode)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isListMode ? 'bg-violet-600' : 'bg-gray-600'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isListMode ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Checklist Items */}
                    {isListMode && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 block">Items de la lista</label>
                            {checklist.map((item, idx) => (
                                <div key={item.id} className="flex items-center gap-2 bg-[#252525] rounded-lg px-3 py-2">
                                    <span className="text-gray-500 text-sm">{idx + 1}.</span>
                                    <span className="flex-1 text-white text-sm">{item.text}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeChecklistItem(item.id)}
                                        className="text-red-400 hover:text-red-300 text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newItem}
                                    onChange={(e) => setNewItem(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                    placeholder="+ Agregar item..."
                                    className="flex-1 bg-[#252525] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addChecklistItem}
                                    className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Descripción (opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles adicionales..."
                            rows={2}
                            className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Categoría</label>
                        {showCategoryInput ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Nueva categoría..."
                                    className="flex-1 bg-[#252525] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryInput(false)}
                                    className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {existingCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(category === cat ? '' : cat)}
                                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${category === cat
                                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                                            : 'bg-[#252525] border-white/10 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryInput(true)}
                                    className="px-3 py-1.5 rounded-lg border border-dashed border-white/20 text-gray-500 text-sm hover:border-violet-500 hover:text-violet-400 transition-colors"
                                >
                                    + Nueva
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Priority Selection */}
                    <div>
                        <label className="text-xs text-gray-400 mb-2 block">Prioridad</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPriority('urgent')}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${priority === 'urgent'
                                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                    : 'bg-[#252525] border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                🔥 Urgente
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority('normal')}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${priority === 'normal'
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                    : 'bg-[#252525] border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                Normal
                            </button>
                            <button
                                type="button"
                                onClick={() => setPriority('low')}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${priority === 'low'
                                    ? 'bg-gray-500/20 border-gray-500/50 text-gray-300'
                                    : 'bg-[#252525] border-white/10 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                Tranqui
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Fecha límite</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Expira</label>
                            <input
                                type="date"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                            />
                        </div>
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

