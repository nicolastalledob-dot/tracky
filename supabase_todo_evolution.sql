-- Evolución de Entries hacia To-Dos
-- Añadir campos para fechas y estado

-- Añadir columnas de fechas
ALTER TABLE entries ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;

-- Añadir estado explícito de la tarea
-- pending: activa, en progreso
-- completed: realizada
-- expired: venció sin completarse (se puede calcular automáticamente también)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('pending', 'completed', 'expired');
    END IF;
END $$;

ALTER TABLE entries ADD COLUMN IF NOT EXISTS task_status task_status DEFAULT 'pending';

-- Tabla para asignar responsables en tareas de grupo
CREATE TABLE IF NOT EXISTS task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(entry_id, user_id)
);

-- RLS para task_assignees
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- Policies simples: puedo ver asignaciones de tareas donde soy responsable o soy autor de la tarea
CREATE POLICY "View own assignments" ON task_assignees FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "View task assignments as author" ON task_assignees FOR SELECT
USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = task_assignees.entry_id AND entries.author_id = auth.uid())
);

CREATE POLICY "Insert assignments" ON task_assignees FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = task_assignees.entry_id AND entries.author_id = auth.uid())
);

CREATE POLICY "Update own assignment" ON task_assignees FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Delete assignments as author" ON task_assignees FOR DELETE
USING (
    EXISTS (SELECT 1 FROM entries WHERE entries.id = task_assignees.entry_id AND entries.author_id = auth.uid())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_entries_due_date ON entries(due_date);
CREATE INDEX IF NOT EXISTS idx_entries_task_status ON entries(task_status);
CREATE INDEX IF NOT EXISTS idx_task_assignees_entry ON task_assignees(entry_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);
