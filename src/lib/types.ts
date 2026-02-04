// Database types for TRACKY
export type MemberRole = 'admin' | 'orchestrator' | 'member' | 'viewer'
export type EntryType = 'note' | 'list' | 'debt' | 'loan'
export type EntryStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected'
export type EntryScope = 'personal' | 'shared'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type TaskStatus = 'pending' | 'completed' | 'expired' | 'cancelled'
export type TaskPriority = 'urgent' | 'normal' | 'low'

export interface Attachment {
    id: string
    entry_id: string
    uploaded_by: string
    file_url: string
    file_name: string | null
    file_type: string | null
    file_size: number | null
    caption: string | null
    created_at: string
}

export interface Profile {
    id: string
    email: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
    bio: string | null
    phone: string | null
    timezone: string | null
    created_at: string
    updated_at: string
}

export interface Group {
    id: string
    name: string
    description: string | null
    created_by: string
    created_at: string
    updated_at: string
}

export interface GroupMember {
    id: string
    group_id: string
    user_id: string
    role: MemberRole
    joined_at: string
    // Joined data
    profile?: Profile
}

export interface Entry {
    id: string
    group_id: string | null
    author_id: string
    entry_type: EntryType
    scope: EntryScope
    status: EntryStatus
    title: string | null
    content: Record<string, unknown>
    amount: number | null
    currency?: 'PEN' | 'USD'
    debtor_id: string | null
    creditor_id: string | null
    is_paid: boolean
    paid_at: string | null
    due_date: string | null
    expiration_date: string | null
    task_status: TaskStatus
    priority: TaskPriority
    category: string | null
    created_at: string
    updated_at: string
    // Joined data
    author?: Profile
    debtor?: Profile
    creditor?: Profile
    list_items?: ListItem[]
    attachments?: Attachment[]
    assignees?: TaskAssignee[]
}

export interface TaskAssignee {
    id: string
    entry_id: string
    user_id: string
    assigned_at: string
    completed_at: string | null
    // Joined data
    user?: Profile
}

export interface ListItem {
    id: string
    entry_id: string
    text: string
    is_completed: boolean
    assigned_to: string | null
    completed_by: string | null
    completed_at: string | null
    position: number
    created_at: string
    // Joined data
    assigned_to_profile?: Profile
}

export interface EntryVersion {
    id: string
    entry_id: string
    changed_by: string
    old_data: Record<string, unknown> | null
    new_data: Record<string, unknown> | null
    change_type: string
    created_at: string
    // Joined data
    changed_by_profile?: Profile
}

export interface Approval {
    id: string
    entry_id: string
    requested_by: string
    reviewed_by: string | null
    status: ApprovalStatus
    comment: string | null
    created_at: string
    reviewed_at: string | null
}

export interface ActivityLog {
    id: string
    group_id: string
    user_id: string
    action: string
    entity_type: string | null
    entity_id: string | null
    metadata: Record<string, unknown>
    created_at: string
    // Joined data
    user?: Profile
}

export interface Invitation {
    id: string
    group_id: string
    invited_by: string
    email: string
    role: MemberRole
    status: InvitationStatus
    token: string
    expires_at: string
    created_at: string
}
