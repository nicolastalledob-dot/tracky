'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Profile, Group, MemberRole } from '@/lib/types'
import {
    ClipboardCheck, LogOut, Plus, ChevronRight, Users,
    FileText, ListTodo, Wallet
} from 'lucide-react'

interface GroupWithRole extends Group {
    role: MemberRole
}

interface DashboardClientProps {
    user: User
    profile: Profile | null
    groups: GroupWithRole[]
}

export default function DashboardClient({ user, profile, groups }: DashboardClientProps) {
    const [showCreateGroup, setShowCreateGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [creating, setCreating] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupName.trim()) return

        setCreating(true)

        const { data: group, error: groupError } = await supabase
            .from('groups')
            .insert({ name: newGroupName.trim(), created_by: user.id })
            .select()
            .single()

        if (groupError) {
            console.error('Error creating group:', groupError)
            setCreating(false)
            return
        }

        await supabase
            .from('group_members')
            .insert({
                group_id: group.id,
                user_id: user.id,
                role: 'admin'
            })

        setNewGroupName('')
        setShowCreateGroup(false)
        setCreating(false)
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            {/* Header */}
            <header className="bg-[#1a1a1a] border-b border-white/5 sticky top-0 z-40">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                                <ClipboardCheck className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-white">TRACKY</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-medium">
                                {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-gray-500 active:text-white p-2"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="max-w-3xl mx-auto px-4 mt-4">
                <div className="flex gap-1 p-1 bg-[#1a1a1a] rounded-xl">
                    <a
                        href="/personal"
                        className="flex-1 py-2.5 rounded-lg text-center text-sm font-medium text-gray-500 transition-colors active:bg-[#252525]"
                    >
                        Personal
                    </a>
                    <button
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#252525] text-white transition-colors"
                    >
                        Grupos
                    </button>
                </div>
            </div>

            {/* Content */}
            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-6">
                <GroupsView
                    groups={groups}
                    onCreateGroup={() => setShowCreateGroup(true)}
                />
            </main>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-[#1a1a1a] rounded-2xl p-5 w-full max-w-sm border border-white/5 animate-slide-up">
                        <h2 className="text-lg font-semibold text-white mb-4">Crear grupo</h2>
                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Nombre del grupo"
                                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                                autoFocus
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateGroup(false)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 active:bg-white/5"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newGroupName.trim()}
                                    className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium active:scale-[0.98] transition-transform disabled:opacity-50"
                                >
                                    {creating ? 'Creando...' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function PersonalView() {
    return (
        <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4">Mi espacio</h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <a href="/personal" className="bg-[#1a1a1a] border border-white/5 rounded-xl p-6 text-center active:bg-[#252525] transition-colors col-span-2">
                    <div className="w-12 h-12 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-violet-400" />
                    </div>
                    <h3 className="text-white font-medium">Ir a mi Espacio Personal</h3>
                    <p className="text-gray-500 text-sm mt-1">Notas, Listas y Deudas Globales</p>
                </a>
            </div>
        </div>
    )
}

function GroupsView({ groups, onCreateGroup }: { groups: GroupWithRole[], onCreateGroup: () => void }) {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Mis grupos</h2>
                <button
                    onClick={onCreateGroup}
                    className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm rounded-lg active:scale-[0.98] transition-transform"
                >
                    <Plus className="w-4 h-4" />
                    Crear
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 mx-auto bg-[#252525] rounded-xl flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-white font-medium">No tienes grupos</p>
                    <p className="text-gray-500 text-sm mt-1">Crea uno para empezar</p>
                    <button
                        onClick={onCreateGroup}
                        className="mt-4 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg active:scale-[0.98] transition-transform"
                    >
                        Crear grupo
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {groups.map((group) => (
                        <a
                            key={group.id}
                            href={`/groups/${group.id}`}
                            className="block bg-[#1a1a1a] border border-white/5 rounded-xl p-4 active:bg-[#252525] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-violet-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-medium truncate">{group.name}</h3>
                                    <p className="text-gray-500 text-sm">
                                        {group.role === 'admin' ? 'Admin' : 'Miembro'}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

function CategoryCard({ title, icon, href }: { title: string, icon: React.ReactNode, href: string }) {
    return (
        <a
            href={href}
            className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 text-center active:bg-[#252525] transition-colors"
        >
            <div className="flex justify-center">{icon}</div>
            <p className="text-white text-sm font-medium mt-2">{title}</p>
        </a>
    )
}
