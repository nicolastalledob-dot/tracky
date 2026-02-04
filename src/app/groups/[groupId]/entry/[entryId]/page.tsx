import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EntryDetail from './EntryDetail'

interface Props {
    params: Promise<{ groupId: string; entryId: string }>
}

export default async function EntryPage({ params }: Props) {
    const { groupId, entryId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is member of this group
    const { data: membership } = await supabase
        .from('group_members')
        .select('*, group:groups(*)')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        notFound()
    }

    // Get the entry with all related data
    const { data: entry } = await supabase
        .from('entries')
        .select(`
            *,
            author:profiles!entries_author_id_fkey(*),
            debtor:profiles!entries_debtor_id_fkey(*),
            creditor:profiles!entries_creditor_id_fkey(*),
            attachments(*),
            list_items(*)
        `)
        .eq('id', entryId)
        .eq('group_id', groupId)
        .single()

    if (!entry) {
        notFound()
    }

    // Get all group members for assignment
    const { data: members } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId)

    return (
        <EntryDetail
            user={user}
            entry={entry}
            group={membership.group}
            members={members || []}
        />
    )
}
