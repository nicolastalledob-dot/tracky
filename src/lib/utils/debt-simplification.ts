
import type { Entry } from '@/lib/types'

interface DebtNode {
    id: string
    balance: number // + means is owed money, - means owes money
}

interface Transaction {
    from: string
    to: string
    amount: number
    currency: string
}

/**
 * Simplifies debts within a group.
 * Strategy:
 * 1. Calculate net balance for each user.
 * 2. Separate into debtors (owe money) and creditors (owed money).
 * 3. Match debtors to creditors to minimize transactions (Greedy approach).
 */
export function simplifyDebts(debts: Entry[], userIds: string[]): Transaction[] {
    // We handle simplifications per currency
    const debtsByCurrency: Record<string, Entry[]> = {}

    debts.forEach(d => {
        if (d.is_paid) return // Ignore paid debts
        const currency = d.currency || 'PEN'
        if (!debtsByCurrency[currency]) debtsByCurrency[currency] = []
        debtsByCurrency[currency].push(d)
    })

    const allTransactions: Transaction[] = []

    Object.keys(debtsByCurrency).forEach(currency => {
        const currencyDebts = debtsByCurrency[currency]
        const balances: Record<string, number> = {}

        // Initialize 0 balances
        userIds.forEach(uid => balances[uid] = 0)

        // Calculate Net Balances
        currencyDebts.forEach(d => {
            if (!d.amount || !d.debtor_id || !d.creditor_id) return
            balances[d.debtor_id] -= d.amount
            balances[d.creditor_id] += d.amount
        })

        // Separate lists
        const debtors: { id: string, amount: number }[] = []
        const creditors: { id: string, amount: number }[] = []

        Object.entries(balances).forEach(([uid, amount]) => {
            // Fix floating point precision
            const val = Math.round(amount * 100) / 100
            if (val < -0.01) debtors.push({ id: uid, amount: -val }) // Store positive magnitude of debt
            if (val > 0.01) creditors.push({ id: uid, amount: val })
        })

        // Sort descending to settle largest debts first (helps reduce count)
        debtors.sort((a, b) => b.amount - a.amount)
        creditors.sort((a, b) => b.amount - a.amount)

        let i = 0 // debtor index
        let j = 0 // creditor index

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i]
            const creditor = creditors[j]

            // Min of what debtor owes vs what creditor is owed
            const amount = Math.min(debtor.amount, creditor.amount)

            if (amount > 0) {
                allTransactions.push({
                    from: debtor.id,
                    to: creditor.id,
                    amount: Math.round(amount * 100) / 100,
                    currency
                })
            }

            // Adjust remaining balances
            debtor.amount -= amount
            creditor.amount -= amount

            // Advance indices if settled (allow small float margin)
            if (debtor.amount < 0.01) i++
            if (creditor.amount < 0.01) j++
        }
    })

    return allTransactions
}
