import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Get user's groups
    const { data: memberships } = await supabase
        .from('group_members')
        .select(`
      *,
      group:groups(*)
    `)
        .eq('user_id', user.id)

    const groups = memberships?.map(m => ({
        ...m.group,
        role: m.role
    })) || []

    return <DashboardClient user={user} profile={profile} groups={groups} />
}
