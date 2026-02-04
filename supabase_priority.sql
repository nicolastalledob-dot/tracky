-- Añadir prioridad a las tareas

-- Crear enum de prioridad
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM ('urgent', 'normal', 'low');
    END IF;
END$$;

-- Añadir columna de prioridad a entries
ALTER TABLE entries ADD COLUMN IF NOT EXISTS priority task_priority DEFAULT 'normal';

-- Crear índice para búsquedas por prioridad
CREATE INDEX IF NOT EXISTS idx_entries_priority ON entries(priority);
