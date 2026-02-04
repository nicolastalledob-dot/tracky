
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { ClipboardCheck, LogOut } from 'lucide-react'

interface PersonalHeaderProps {
  user: User
  profile: Profile | null
  pendingCount: number
  completedCount: number
  onSignOut: () => void
}

export default function PersonalHeader({ user, profile, pendingCount, completedCount, onSignOut }: PersonalHeaderProps) {
  return (
    <header className="bg-[#1a1a1a] border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">TRACKY</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded">{pendingCount} pendientes</span>
              <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded">{completedCount} completadas</span>
            </div>
            <a
              href="/profile"
              className="w-8 h-8 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-white text-sm font-medium hover:ring-2 hover:ring-violet-500 transition-all"
            >
              {(profile?.custom_avatar_url || profile?.avatar_url) ? (
                <img
                  src={profile.custom_avatar_url || profile.avatar_url!}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()
              )}
            </a>
            <button
              onClick={onSignOut}
              className="text-gray-500 active:text-white p-2"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
