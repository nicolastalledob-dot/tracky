
import type { Entry, EntryType, ListItem } from '@/lib/types'
import { FileText, ListTodo, Wallet, Camera, ChevronRight, Clock, AlertCircle } from 'lucide-react'

interface TaskListProps {
  tasks: Entry[]
  title: string
  className?: string
  emptyMessage?: string
}

export default function TaskList({ tasks, title, className = '', emptyMessage }: TaskListProps) {
  return (
    <div className={className}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">{title}</h3>

      {tasks.length === 0 ? (
        emptyMessage && (
          <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-gray-600 text-sm">{emptyMessage}</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCardMinimal key={task.id} entry={task} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskCardMinimal({ entry }: { entry: Entry }) {
  const typeIcons: Record<EntryType, any> = {
    note: FileText,
    list: ListTodo,
    debt: Wallet
  }
  const Icon = typeIcons[entry.entry_type]

  const isUrgent = entry.priority === 'urgent'
  const isOverdue = entry.due_date && new Date(entry.due_date) < new Date() && entry.task_status !== 'completed'

  return (
    <a
      href={`/personal/entry/${entry.id}`}
      className="group block bg-[#1a1a1a] border border-white/5 rounded-xl p-3 hover:border-violet-500/30 hover:bg-[#1f1f1f] transition-all relative overflow-hidden"
    >
      {/* Left accent bar for status */}
      {isUrgent ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
      ) : isOverdue ? (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
      ) : null}

      <div className={`flex items-center gap-3 ${isUrgent || isOverdue ? 'pl-2' : ''}`}>

        {/* Checkbox / Icon Area */}
        <div className="w-8 h-8 flex-shrink-0 bg-[#252525] rounded-lg flex items-center justify-center text-gray-400 group-hover:text-violet-400 transition-colors">
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${entry.task_status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
              {entry.title || 'Sin título'}
            </p>
            {entry.attachments && entry.attachments.length > 0 && (
              <Camera className="w-3 h-3 text-gray-500" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-1">
            {/* Metadata Row */}
            {entry.entry_type === 'list' && entry.list_items && (
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <ListTodo className="w-3 h-3" />
                {entry.list_items.filter((i: ListItem) => i.is_completed).length}/{entry.list_items.length}
              </span>
            )}

            {entry.due_date && (
              <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-orange-400' : 'text-gray-500'
                }`}>
                <Clock className="w-3 h-3" />
                {new Date(entry.due_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
              </span>
            )}

            {isUrgent && (
              <span className="text-[10px] text-red-400 flex items-center gap-1 font-medium bg-red-500/10 px-1.5 py-0.5 rounded">
                <AlertCircle className="w-3 h-3" /> Urgente
              </span>
            )}
          </div>
        </div>

        {/* Right Arrow (visible on hover or always?) */}
        <div className="text-gray-600 group-hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </a>
  )
}
