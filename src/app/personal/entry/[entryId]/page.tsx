import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PersonalEntryDetail from './PersonalEntryDetail'

interface Props {
    params: Promise<{ entryId: string }>
}

export default async function PersonalEntryPage({ params }: Props) {
    const { entryId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get the entry with related data
    const { data: entry } = await supabase
        .from('entries')
        .select(`
            *,
            attachments(*),
            list_items(*)
        `)
        .eq('id', entryId)
        .eq('author_id', user.id) // Ensure it belongs to user
        .single()

    if (!entry) {
        notFound()
    }

    return (
        <PersonalEntryDetail
            user={user}
            entry={entry}
        />
    )
}
