
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Entry } from '@/lib/types'
import TaskList from '@/components/personal/TaskList'

interface CalendarGridProps {
    entries: Entry[]
}

export default function CalendarGrid({ entries }: CalendarGridProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Navigation
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

    // Grid Generation
    const { days, eventsByDate } = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()

        const firstDayOfMonth = new Date(year, month, 1)
        const lastDayOfMonth = new Date(year, month + 1, 0)

        const daysInMonth = lastDayOfMonth.getDate()
        const startDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday

        // Days array
        const daysArr = []

        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate()
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            daysArr.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            })
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            daysArr.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            })
        }

        // Next month padding (to fill 6 rows = 42 cells, or just 35)
        const remainingCells = 42 - daysArr.length
        for (let i = 1; i <= remainingCells; i++) {
            daysArr.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            })
        }

        // Map events
        const map: Record<string, { created: Entry[], due: Entry[], completed: Entry[], cancelled: Entry[] }> = {}


        const addToMap = (date: Date, type: 'created' | 'due' | 'completed' | 'cancelled', entry: Entry) => {
            const key = date.toDateString()
            if (!map[key]) map[key] = { created: [], due: [], completed: [], cancelled: [] }
            map[key][type].push(entry)
        }

        entries.forEach(entry => {
            // Created
            addToMap(new Date(entry.created_at), 'created', entry)

            // Due
            if (entry.due_date) {
                addToMap(new Date(entry.due_date), 'due', entry)
            }

            // Completed (if we had completed_at, relying on task_status for now, ideally we need the date)
            // Using updated_at as proxy if status is completed
            if (entry.task_status === 'completed') {
                addToMap(new Date(entry.updated_at), 'completed', entry)
            }

            if (entry.task_status === 'cancelled') {
                addToMap(new Date(entry.updated_at), 'cancelled', entry)
            }
        })

        return { days: daysArr, eventsByDate: map }

    }, [currentDate, entries])

    // Selected Day Data
    const selectedDayEvents = selectedDate ? transformEventsForList(eventsByDate[selectedDate.toDateString()], selectedDate) : []

    return (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
            <div className="flex-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white capitalize">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden mb-2">
                    {/* Weekdays */}
                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                        <div key={i} className="bg-[#1a1a1a] py-3 text-center text-xs font-medium text-gray-500">
                            {d}
                        </div>
                    ))}

                    {/* Days */}
                    {days.map((day, idx) => {
                        const dateKey = day.date.toDateString()
                        const events = eventsByDate[dateKey]
                        const isSelected = selectedDate?.toDateString() === dateKey
                        const isToday = new Date().toDateString() === dateKey

                        const hasDue = events?.due.length > 0
                        const hasCompleted = events?.completed.length > 0
                        const hasCreated = events?.created.length > 0

                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedDate(day.date)}
                                className={`
                                    min-h-[80px] sm:min-h-[100px] p-2 bg-[#121212] hover:bg-[#1a1a1a] transition-colors cursor-pointer relative group
                                    ${!day.isCurrentMonth ? 'opacity-30' : ''}
                                    ${isSelected ? 'bg-[#1f1f1f] ring-1 ring-inset ring-violet-500' : ''}
                                `}
                            >
                                <span className={`
                                    text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1
                                    ${isToday ? 'bg-violet-600 text-white' : 'text-gray-400'}
                                `}>
                                    {day.date.getDate()}
                                </span>

                                {/* Indicators */}
                                <div className="flex flex-wrap content-start gap-1 mt-1">
                                    {hasDue && <div className="w-2 h-2 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                                    {hasCompleted && <div className="w-2 h-2 rounded-full bg-green-500/80" />}
                                    {hasCreated && <div className="w-2 h-2 rounded-full bg-blue-500/50" />}
                                </div>

                                {/* Hover Peek (Desktop only ideally, or hidden) - Simplified for now */}
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-xs text-gray-500 px-2 justify-end">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500/50" /> Creado</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/80" /> Vence</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500/80" /> Completado</div>
                </div>
            </div>

            {/* Side Panel (Desktop) or Bottom Sheet (Mobile - logic handled by layout, here just a block) */}
            {selectedDate && (
                <div className="w-full lg:w-80 bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 h-fit lg:sticky lg:top-24 animate-slide-in-right">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">
                            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {selectedDayEvents.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Sin actividad este día</p>
                        ) : (
                            <>
                                {selectedDayEvents.filter(e => e.type === 'due').length > 0 && (
                                    <TaskList tasks={selectedDayEvents.filter(e => e.type === 'due').map(e => e.entry)} title="Vencimientos" />
                                )}
                                {selectedDayEvents.filter(e => e.type === 'created').length > 0 && (
                                    <TaskList tasks={selectedDayEvents.filter(e => e.type === 'created').map(e => e.entry)} title="Creadas" />
                                )}
                                {selectedDayEvents.filter(e => e.type === 'completed').length > 0 && (
                                    <TaskList tasks={selectedDayEvents.filter(e => e.type === 'completed').map(e => e.entry)} title="Completadas" />
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function transformEventsForList(events: { created: Entry[], due: Entry[], completed: Entry[], cancelled: Entry[] } | undefined, date: Date) {
    if (!events) return []

    // We flatten to show in list, flagging the reason for showing
    const list: { entry: Entry, type: 'created' | 'due' | 'completed' | 'cancelled' }[] = []

    // Logic: If it's Due, that's high priority to show
    events.due.forEach(e => list.push({ entry: e, type: 'due' }))
    events.completed.forEach(e => list.push({ entry: e, type: 'completed' }))
    events.created.forEach(e => list.push({ entry: e, type: 'created' }))

    // Remove duplicates if same entry appears in multiple categories (unlikely for created vs completed same day, but possible)
    // Actually duplication is fine, shows the journey: "Created today AND Completed today"

    return list
}
