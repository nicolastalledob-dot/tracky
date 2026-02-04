import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PersonalClient from './PersonalClient'

export default async function PersonalPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get personal entries
    const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select(`
            *,
            attachments(*),
            list_items(*)
        `)
        .eq('author_id', user.id)
        .eq('scope', 'personal')
        .order('created_at', { ascending: false })

    if (entriesError) {
        console.error('Entries Query Error:', entriesError)
    }
    console.log('Entries fetched:', entries?.length, 'for user:', user.id)

    // Get global debts (where user is involved)
    // We fetch two sets: where user is debtor and where user is creditor
    const { data: globalDebts } = await supabase
        .from('entries')
        .select(`
            *,
            debtor:profiles!entries_debtor_id_fkey(*),
            creditor:profiles!entries_creditor_id_fkey(*),
            group:groups(*)
        `)
        .eq('entry_type', 'debt')
        .or(`debtor_id.eq.${user.id},creditor_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

    // Get User Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <PersonalClient
            user={user}
            profile={profile}
            entries={entries || []}
            globalDebts={globalDebts || []}
            debugError={entriesError?.message || null}
        />
    )
}
