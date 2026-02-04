
import { useState, useMemo } from 'react'
import type { Entry } from '@/lib/types'

type FilterState = {
  showCompleted: boolean
  showCancelled: boolean
  showFuture: boolean
}

export function useTaskFilters(entries: Entry[]) {
  const [filters, setFilters] = useState<FilterState>({
    showCompleted: false,
    showCancelled: false,
    showFuture: false
  })

  const toggleFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const { focusTasks, futureTasks, completedTasks, cancelledTasks } = useMemo(() => {
    const now = new Date()
    // Reset hours to compare dates properly
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const focus: Entry[] = []
    const future: Entry[] = []
    const completed: Entry[] = []
    const cancelled: Entry[] = []

    entries.forEach(entry => {
      // Handle statuses
      if (entry.task_status === 'completed') {
        completed.push(entry)
        return
      }
      if (entry.task_status === 'cancelled') {
        cancelled.push(entry)
        return
      }

      // If it's a debt/note without specific task status, usually keep in focus or separate?
      // Assuming default active tasks are 'pending' or null

      // Check priority/dates for Pending tasks
      if (entry.priority === 'urgent') {
        focus.push(entry)
        return
      }

      if (entry.due_date) {
        const dueDate = new Date(entry.due_date)
        const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

        // If Overdue or Due Today -> Focus
        if (dueDay <= today) {
          focus.push(entry)
        } else {
          // Due in Future -> Future
          future.push(entry)
        }
      } else {
        // No due date? 
        // Put indefinite tasks in Focus to ensure visibility
        focus.push(entry)
      }
    })

    // Sort Focus: Urgent first, then by Due Date asc
    focus.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      return 0
    })

    return { focusTasks: focus, futureTasks: future, completedTasks: completed, cancelledTasks: cancelled }
  }, [entries])

  const stats = {
    totalFocus: focusTasks.length,
    totalFuture: futureTasks.length,
    totalCompleted: completedTasks.length,
    totalCancelled: cancelledTasks.length
  }

  return {
    filters,
    toggleFilter,
    filteredTasks: {
      focusTasks,
      futureTasks,
      completedTasks,
      cancelledTasks
    },
    stats
  }
}
