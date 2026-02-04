'use client'

import { FileText, ListTodo, Wallet, Camera, Calendar, AlertCircle } from 'lucide-react'
import type { Entry, EntryType, ListItem } from '@/lib/types'

interface TaskCardMinimalProps {
  entry: Entry
  showActions?: boolean
}

export default function TaskCardMinimal({ entry, showActions = true }: TaskCardMinimalProps) {
  const typeIcons: Record<EntryType, any> = {
    note: FileText,
    list: ListTodo,
    debt: Wallet
  }
  const Icon = typeIcons[entry.entry_type]

  // Priority styling
  const priorityStyles = {
    urgent: 'border-red-500/30 bg-red-500/5',
    normal: 'border-white/5 bg-[#1a1a1a]',
    low: 'border-white/5 bg-[#1a1a1a] opacity-80'
  }

  const priorityDot = {
    urgent: 'bg-red-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-500'
  }

  // Check if task is overdue
  const isOverdue = entry.due_date && new Date(entry.due_date) < new Date() && entry.task_status === 'pending'

  // Format due date
  const formatDueDate = (date: string) => {
    const dueDate = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    // Normalize to compare only dates
    const dueDateDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const tomorrowDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

    if (dueDateDay.getTime() === todayDay.getTime()) return 'Hoy'
    if (dueDateDay.getTime() === tomorrowDay.getTime()) return 'Mañana'
    if (dueDateDay < todayDay) return 'Vencida'

    return dueDate.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }

  return (
    <a
      href={`/personal/entry/${entry.id}`}
      className={`group block border rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-violet-600/10 hover:border-violet-600/30 ${priorityStyles[entry.priority]}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon & Priority Indicator */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 bg-[#252525] rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-violet-400" />
          </div>
          {/* Priority Dot */}
          <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${priorityDot[entry.priority]} ring-2 ring-[#1a1a1a]`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title & Category */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium truncate text-sm">
              {entry.title || 'Sin título'}
            </h3>
            {entry.category && (
              <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                {entry.category}
              </span>
            )}
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {/* Due Date */}
            {entry.due_date && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                {isOverdue && <AlertCircle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                <span>{formatDueDate(entry.due_date)}</span>
              </div>
            )}

            {/* List Progress */}
            {entry.entry_type === 'list' && entry.list_items && (
              <span className="flex items-center gap-1">
                <ListTodo className="w-3 h-3" />
                {entry.list_items.filter((i: ListItem) => i.is_completed).length}/{entry.list_items.length}
              </span>
            )}

            {/* Attachments */}
            {entry.attachments && entry.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {entry.attachments.length}
              </span>
            )}
          </div>

          {/* Description Preview (only for notes, shown on hover) */}
          {entry.entry_type === 'note' && (entry.content as any).text && (
            <p className="text-gray-600 text-xs mt-2 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {(entry.content as any).text}
            </p>
          )}
        </div>

        {/* Quick Actions (shown on hover) */}
        {showActions && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-violet-400 text-xs">
              →
            </div>
          </div>
        )}
      </div>
    </a>
  )
}
