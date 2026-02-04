'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Entry, TaskStatus } from '@/lib/types'
import { Calendar, Clock, CheckCircle2, XCircle, Circle, GripVertical, X, Image as ImageIcon } from 'lucide-react'

interface KanbanBoardProps {
    entries: Entry[]
    onUpdate: () => void
    showAssignees?: boolean
}

type ColumnId = 'dropped' | 'pending' | 'completed'

type Column = {
    id: ColumnId
    title: string
    icon: any
    color: string
    bgColor: string
}

const columns: Column[] = [
    {
        id: 'dropped',
        title: 'Canceladas',
        icon: XCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/20'
    },
    {
        id: 'pending',
        title: 'Activas',
        icon: Circle,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
        id: 'completed',
        title: 'Completadas',
        icon: CheckCircle2,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10 border-green-500/20'
    },
]

export default function KanbanBoard({ entries: initialEntries, onUpdate, showAssignees = false }: KanbanBoardProps) {
    // Local state for optimistic updates
    const [entries, setEntries] = useState(initialEntries)
    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null)
    const [selectedTask, setSelectedTask] = useState<Entry | null>(null)
    const supabase = createClient()

    // Sync with props when they change from server
    useEffect(() => {
        setEntries(initialEntries)
    }, [initialEntries])

    // Calculate actual status based on expiration date and task_status
    const getEffectiveStatus = (entry: Entry): ColumnId => {
        if (entry.task_status === 'completed') return 'completed'
        if (entry.task_status === 'cancelled') return 'dropped'
        if (entry.task_status === 'expired') return 'dropped'
        if (entry.expiration_date && new Date(entry.expiration_date) < new Date()) {
            return 'dropped'
        }
        return 'pending'
    }

    const getEntriesForColumn = (status: ColumnId) => {
        return entries.filter(e => getEffectiveStatus(e) === status)
    }

    const handleDragStart = (e: React.DragEvent, entryId: string) => {
        setDraggingId(entryId)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', entryId)
    }

    const handleDragOver = (e: React.DragEvent, columnId: ColumnId) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverColumn(columnId)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, newColumnId: ColumnId) => {
        e.preventDefault()
        const entryId = e.dataTransfer.getData('text/plain')
        setDraggingId(null)
        setDragOverColumn(null)

        if (!entryId) return

        // Map column to task_status
        const statusMap: Record<ColumnId, TaskStatus> = {
            'dropped': 'cancelled',
            'pending': 'pending',
            'completed': 'completed'
        }

        const newStatus = statusMap[newColumnId]

        // OPTIMISTIC UPDATE: Update local state immediately
        setEntries(prev => prev.map(entry =>
            entry.id === entryId
                ? { ...entry, task_status: newStatus }
                : entry
        ))

        // Then save to database in background
        const { error } = await supabase
            .from('entries')
            .update({ task_status: newStatus })
            .eq('id', entryId)

        if (error) {
            console.error('Error updating status:', error)
            // Revert on error - refetch from server
            onUpdate()
            return
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null
        const date = new Date(dateStr)
        const now = new Date()
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'Hoy'
        if (diffDays === 1) return 'Mañana'
        if (diffDays === -1) return 'Ayer'
        if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`
        if (diffDays <= 7) return `En ${diffDays} días`

        return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map(column => {
                    const columnEntries = getEntriesForColumn(column.id)
                    const Icon = column.icon
                    const isDropTarget = dragOverColumn === column.id

                    return (
                        <div
                            key={column.id}
                            className={`rounded-xl border transition-all ${column.bgColor} ${isDropTarget ? 'ring-2 ring-violet-500 scale-[1.02]' : ''
                                }`}
                            onDragOver={(e) => handleDragOver(e, column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.id)}
                        >
                            {/* Column Header */}
                            <div className="p-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-5 h-5 ${column.color}`} />
                                    <h3 className="font-semibold text-white">{column.title}</h3>
                                    <span className="ml-auto text-sm text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                        {columnEntries.length}
                                    </span>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
                                {columnEntries.length === 0 ? (
                                    <div className="text-center py-8 text-gray-600 text-sm">
                                        {column.id === 'dropped' ? 'Sin tareas canceladas' :
                                            column.id === 'pending' ? 'Sin tareas activas' :
                                                'Sin tareas completadas'}
                                    </div>
                                ) : (
                                    columnEntries.map(entry => (
                                        <TaskCard
                                            key={entry.id}
                                            entry={entry}
                                            isDragging={draggingId === entry.id}
                                            onDragStart={(e) => handleDragStart(e, entry.id)}
                                            onClick={() => setSelectedTask(entry)}
                                            formatDate={formatDate}
                                            showAssignees={showAssignees}
                                            isDropped={column.id === 'dropped'}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    formatDate={formatDate}
                    onEntryUpdate={(updatedEntry) => {
                        setEntries(entries.map(e => e.id === updatedEntry.id ? updatedEntry : e))
                        setSelectedTask(updatedEntry)
                    }}
                />
            )}
        </>
    )
}

interface TaskCardProps {
    entry: Entry
    isDragging: boolean
    onDragStart: (e: React.DragEvent) => void
    onClick: () => void
    formatDate: (date: string | null) => string | null
    showAssignees: boolean
    isDropped: boolean
}

function TaskCard({ entry, isDragging, onDragStart, onClick, formatDate, showAssignees, isDropped }: TaskCardProps) {
    const dueLabel = formatDate(entry.due_date)
    const expirationLabel = formatDate(entry.expiration_date)
    const hasAttachments = entry.attachments && entry.attachments.length > 0

    // Get author avatar - prefer custom, then google's
    const authorAvatar = entry.author?.custom_avatar_url || entry.author?.avatar_url
    const authorInitial = entry.author?.display_name?.[0]?.toUpperCase() || '?'

    // Priority styles
    const priorityStyles = {
        urgent: { label: '🔥', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        normal: { label: '•', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        low: { label: '~', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    }
    const priority = priorityStyles[entry.priority] || priorityStyles.normal

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className={`bg-[#1a1a1a] border border-white/10 rounded-lg p-3 cursor-pointer transition-all min-h-[80px] ${isDragging ? 'opacity-50 scale-95' : 'hover:border-violet-500/50 hover:bg-[#222]'
                } ${isDropped ? 'opacity-70' : ''}`}
        >
            <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {/* Author Avatar */}
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-violet-600 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-medium">
                            {authorAvatar ? (
                                <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                authorInitial
                            )}
                        </div>
                        <h4 className="text-white text-sm font-medium truncate flex-1">
                            {entry.title || 'Sin título'}
                        </h4>
                        {/* List Type Badge */}
                        {entry.entry_type === 'list' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                📋 LISTA
                            </span>
                        )}
                        {/* Priority Badge */}
                        {entry.priority === 'urgent' && (
                            <span className="text-xs px-1.5 py-0.5 rounded border bg-red-500/20 text-red-400 border-red-500/30">
                                🔥
                            </span>
                        )}
                    </div>

                    {/* Checklist Progress for List type */}
                    {entry.entry_type === 'list' && (entry.content as any)?.checklist && (
                        <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-500 transition-all"
                                    style={{
                                        width: `${((entry.content as any).checklist.filter((i: any) => i.done).length / (entry.content as any).checklist.length) * 100}%`
                                    }}
                                />
                            </div>
                            <span className="text-[10px] text-gray-500">
                                {(entry.content as any).checklist.filter((i: any) => i.done).length}/{(entry.content as any).checklist.length}
                            </span>
                        </div>
                    )}

                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                        {(entry.content as any)?.text || '[Sin desc.]'}
                    </p>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {dueLabel && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {dueLabel}
                            </span>
                        )}
                        {expirationLabel && (
                            <span className={`flex items-center gap-1 text-xs ${isDropped ? 'text-red-400' : 'text-gray-400'}`}>
                                <Clock className="w-3 h-3" />
                                {expirationLabel}
                            </span>
                        )}
                        {hasAttachments && (
                            <span className="flex items-center gap-1 text-xs text-violet-400">
                                <ImageIcon className="w-3 h-3" />
                                {entry.attachments!.length}
                            </span>
                        )}
                    </div>

                    {/* Assignees - show in group view */}
                    {showAssignees && entry.assignees && entry.assignees.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                            {entry.assignees.slice(0, 3).map(a => {
                                const avatar = a.user?.custom_avatar_url || a.user?.avatar_url
                                return (
                                    <div
                                        key={a.id}
                                        className="w-6 h-6 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-[10px] text-white font-medium"
                                        title={a.user?.display_name || 'Usuario'}
                                    >
                                        {avatar ? (
                                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            a.user?.display_name?.[0]?.toUpperCase() || '?'
                                        )}
                                    </div>
                                )
                            })}
                            {entry.assignees.length > 3 && (
                                <span className="text-xs text-gray-500">+{entry.assignees.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface TaskDetailModalProps {
    task: Entry
    onClose: () => void
    formatDate: (date: string | null) => string | null
    onEntryUpdate: (entry: Entry) => void
}

function TaskDetailModal({ task, onClose, formatDate, onEntryUpdate }: TaskDetailModalProps) {
    const supabase = createClient()
    const [checklist, setChecklist] = useState<{ id: string, text: string, done: boolean }[]>(
        (task.content as any)?.checklist || []
    )
    const [saving, setSaving] = useState(false)

    const toggleChecklistItem = async (itemId: string) => {
        const newChecklist = checklist.map(item =>
            item.id === itemId ? { ...item, done: !item.done } : item
        )
        setChecklist(newChecklist)

        // Update local state immediately for parent
        const updatedContent = { ...(task.content as any), checklist: newChecklist }
        onEntryUpdate({ ...task, content: updatedContent })

        // Save to database
        setSaving(true)
        await supabase
            .from('entries')
            .update({
                content: updatedContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', task.id)
        setSaving(false)
    }

    const allItemsDone = checklist.length > 0 && checklist.every(item => item.done)
    const canComplete = task.entry_type !== 'list' || allItemsDone

    const statusLabels: Record<string, { label: string, color: string }> = {
        pending: { label: 'Activa', color: 'bg-yellow-500/10 text-yellow-400' },
        completed: { label: 'Completada', color: 'bg-green-500/10 text-green-400' },
        cancelled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-400' },
        expired: { label: 'Expirada', color: 'bg-red-500/10 text-red-400' },
    }

    const status = statusLabels[task.task_status] || statusLabels.pending

    return (
        <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1a1a] rounded-2xl w-full max-w-lg border border-white/10 animate-slide-up overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-semibold text-white">
                                    {task.title || 'Sin título'}
                                </h2>
                                {task.entry_type === 'list' && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                        📋 LISTA
                                    </span>
                                )}
                            </div>
                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                                {status.label}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Checklist Items */}
                    {task.entry_type === 'list' && checklist.length > 0 && (
                        <div>
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                Items de la lista
                                {saving && <span className="text-violet-400">guardando...</span>}
                            </h3>
                            <div className="space-y-2">
                                {checklist.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleChecklistItem(item.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${item.done
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-[#252525] border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${item.done
                                            ? 'bg-green-500 border-green-500'
                                            : 'border-gray-500'
                                            }`}>
                                            {item.done && <span className="text-white text-xs">✓</span>}
                                        </div>
                                        <span className={`flex-1 text-sm ${item.done ? 'text-gray-400 line-through' : 'text-white'}`}>
                                            {item.text}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {!canComplete && task.task_status === 'pending' && (
                                <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                                    ⚠️ Completa todos los items para marcar como completado
                                </p>
                            )}
                        </div>
                    )}

                    {/* Description */}
                    {(task.content as any)?.text && (
                        <div>
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Descripción</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">
                                {(task.content as any).text}
                            </p>
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        {task.due_date && (
                            <div>
                                <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Fecha límite</h3>
                                <p className="text-white text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-violet-400" />
                                    {formatDate(task.due_date)}
                                </p>
                            </div>
                        )}
                        {task.expiration_date && (
                            <div>
                                <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Expira</h3>
                                <p className="text-white text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-red-400" />
                                    {formatDate(task.expiration_date)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Attachments */}
                    {task.attachments && task.attachments.length > 0 && (
                        <div>
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Adjuntos</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {task.attachments.map(att => (
                                    <a
                                        key={att.id}
                                        href={att.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-lg overflow-hidden border border-white/10 hover:border-violet-500/50 transition-colors"
                                    >
                                        <img
                                            src={att.file_url}
                                            alt={att.file_name || 'Adjunto'}
                                            className="w-full h-32 object-cover"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Created info */}
                    <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-gray-500">
                            Creada {new Date(task.created_at).toLocaleDateString('es', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
