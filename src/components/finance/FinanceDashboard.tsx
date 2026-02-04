
import { useMemo, useState } from 'react'
import { simplifyDebts } from '@/lib/utils/debt-simplification'
import type { Entry, Profile } from '@/lib/types'
import { ArrowRight, Wallet } from 'lucide-react'

interface FinanceDashboardProps {
    debts: Entry[] // All debt/loan entries for this group
    members: Profile[] // Group members to map IDs to Names
    currentUserId: string
}

export default function FinanceDashboard({ debts, members, currentUserId }: FinanceDashboardProps) {
    const [showSimplified, setShowSimplified] = useState(true)

    // Calculate Raw Balances (Direct Debts)
    // Who owes me? Who do I owe?
    const myStats = useMemo(() => {
        let owedToMe = 0
        let iOwe = 0
        const currency = 'PEN' // Defaulting to PEN for summary for now, multi-currency is complex to sum

        debts.forEach(d => {
            if (d.is_paid) return
            // Simple sum ignoring currency mix for a sec (or filtering to PEN)
            // ideally we separate. Let's assume most are PEN for the big number.
            if (d.currency !== 'PEN' && d.currency) return // Skip USD for the big sum for now or handle separate

            if (d.creditor_id === currentUserId) owedToMe += (d.amount || 0)
            if (d.debtor_id === currentUserId) iOwe += (d.amount || 0)
        })
        return { owedToMe, iOwe }
    }, [debts, currentUserId])

    // Calculate Simplified Transactions
    const simplified = useMemo(() => {
        const userIds = members.map(m => m.id)
        return simplifyDebts(debts, userIds)
    }, [debts, members])

    // Helper to get name
    const getName = (id: string) => {
        const m = members.find(m => m.id === id)
        return m?.display_name || 'Usuario'
    }



    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-white/5 p-5 rounded-2xl">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Te deben</p>
                    <p className="text-3xl font-bold text-green-500">S/. {myStats.owedToMe.toFixed(2)}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-white/5 p-5 rounded-2xl">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2">Debes</p>
                    <p className="text-3xl font-bold text-red-500">S/. {myStats.iOwe.toFixed(2)}</p>
                </div>
            </div>

            {/* Balances Matrix / List */}
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-violet-500" />
                        Ajuste de Cuentas
                    </h3>

                    <div className="flex bg-[#252525] rounded-lg p-1">
                        <button
                            onClick={() => setShowSimplified(false)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!showSimplified ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Detallado
                        </button>
                        <button
                            onClick={() => setShowSimplified(true)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${showSimplified ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Simplificado ✨
                        </button>
                    </div>
                </div>

                <div className="p-2">
                    {showSimplified ? (
                        <div className="space-y-2">
                            {simplified.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    ¡Todo está saldado! 🎉
                                </div>
                            ) : (
                                simplified.map((t, idx) => {
                                    const isMeFrom = t.from === currentUserId
                                    const isMeTo = t.to === currentUserId
                                    const highlight = isMeFrom || isMeTo

                                    return (
                                        <div
                                            key={`${t.from}-${t.to}-${idx}`}
                                            className={`flex items-center justify-between p-4 rounded-xl border ${highlight ? 'bg-violet-500/10 border-violet-500/30' : 'bg-[#1f1f1f] border-white/5'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar id={t.from} members={members} />
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs text-gray-500 mb-1">paga a</span>
                                                    <ArrowRight className={`w-4 h-4 ${highlight ? 'text-violet-400' : 'text-gray-600'}`} />
                                                </div>
                                                <Avatar id={t.to} members={members} />
                                            </div>

                                            <div className="text-right">
                                                <p className={`font-bold ${highlight ? 'text-white' : 'text-gray-400'}`}>
                                                    {t.currency === 'USD' ? '$' : 'S/.'} {t.amount.toFixed(2)}
                                                </p>
                                                {isMeFrom && (
                                                    <button className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded mt-1 hover:bg-green-500/30 transition-colors">
                                                        Marcar Pagado
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-center py-4 text-gray-500 text-xs">
                                Mostrando todas las deudas individuales sin procesar...
                            </div>
                            {/* Raw List (Fallback) */}
                            {debts.filter(d => !d.is_paid).map(d => (
                                <div key={d.id} className="flex items-center justify-between p-3 bg-[#1f1f1f] border border-white/5 rounded-xl text-sm">
                                    <span className="text-gray-400">
                                        {getName(d.debtor_id!)} debe a {getName(d.creditor_id!)}
                                    </span>
                                    <span className="text-white font-medium">
                                        {d.currency === 'USD' ? '$' : 'S/.'} {d.amount?.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function Avatar({ id, members }: { id: string, members: Profile[] }) {
    const m = members.find(u => u.id === id)
    const initial = m?.display_name?.[0]?.toUpperCase() || '?'

    return (
        <div className="flex items-center gap-2 min-w-[100px]">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                {m?.avatar_url ? (
                    <img src={m.avatar_url} alt={initial} className="w-full h-full object-cover" />
                ) : (
                    <span>{initial}</span>
                )}
            </div>
            <span className="text-sm text-gray-300 truncate max-w-[80px]">{m?.display_name || 'Usuario'}</span>
        </div>
    )
}
