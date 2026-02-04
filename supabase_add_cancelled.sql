-- Añadir 'cancelled' al enum task_status

-- En PostgreSQL no puedes añadir valores a un enum fácilmente, 
-- pero sí con ALTER TYPE ... ADD VALUE
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'cancelled';
