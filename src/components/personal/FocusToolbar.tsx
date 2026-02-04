
import { Clock, CheckCircle2, ArchiveX } from 'lucide-react'

interface FocusToolbarProps {
  filters: {
    showFuture: boolean
    showCompleted: boolean
    showCancelled: boolean
  }
  stats: {
    totalFuture: number
    totalCompleted: number
    totalCancelled: number
  }
  onToggleFilter: (key: 'showFuture' | 'showCompleted' | 'showCancelled') => void
}

export default function FocusToolbar({ filters, stats, onToggleFilter }: FocusToolbarProps) {
  return (
    <div className="flex gap-2 min-w-0 overflow-x-auto pb-2 hide-scrollbar">
      {stats.totalFuture > 0 && (
        <button
          onClick={() => onToggleFilter('showFuture')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.showFuture
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
            : 'bg-[#1a1a1a] text-gray-500 border-white/5 hover:border-white/10'
            }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Más tarde ({stats.totalFuture})</span>
        </button>
      )}

      {stats.totalCompleted > 0 && (
        <button
          onClick={() => onToggleFilter('showCompleted')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.showCompleted
            ? 'bg-green-500/20 text-green-400 border-green-500/50'
            : 'bg-[#1a1a1a] text-gray-500 border-white/5 hover:border-white/10'
            }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completadas ({stats.totalCompleted})</span>
        </button>
      )}

      {stats.totalCancelled > 0 && (
        <button
          onClick={() => onToggleFilter('showCancelled')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.showCancelled
            ? 'bg-red-500/20 text-red-400 border-red-500/50'
            : 'bg-[#1a1a1a] text-gray-500 border-white/5 hover:border-white/10'
            }`}
        >
          <ArchiveX className="w-3.5 h-3.5" />
          <span>Canceladas ({stats.totalCancelled})</span>
        </button>
      )}
    </div>
  )
}
