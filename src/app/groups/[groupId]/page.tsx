import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupClient from './GroupClient'

interface Props {
    params: Promise<{ groupId: string }>
}

export default async function GroupPage({ params }: Props) {
    const { groupId } = await params
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

    // Get all group members
    const { data: members } = await supabase
        .from('group_members')
        .select('*, profile:profiles(*)')
        .eq('group_id', groupId)

    // Get recent entries for this group with attachments and list items
    const { data: entries } = await supabase
        .from('entries')
        .select('*, author:profiles!entries_author_id_fkey(*), attachments(*), list_items(*)')
        .eq('group_id', groupId)
        .eq('scope', 'shared')
        .order('created_at', { ascending: false })
        .limit(20)

    return (
        <GroupClient
            user={user}
            group={membership.group}
            role={membership.role}
            members={members || []}
            entries={entries || []}
        />
    )
}
