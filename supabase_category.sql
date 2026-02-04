-- Añadir categorías a las tareas/cumplimientos

-- Añadir columna de categoría (texto libre para flexibilidad)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Crear índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);

-- Categorías sugeridas (solo para referencia, no es una constraint):
-- 'trabajo', 'personal', 'hogar', 'salud', 'finanzas', 'social', 'estudio', 'proyecto'
