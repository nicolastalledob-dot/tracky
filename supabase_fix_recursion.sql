-- Primero, deshabilitamos RLS temporalmente para limpiar policies sin problemas (opcional, pero seguro)
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;

-- Borramos TODAS las políticas existentes en 'entries' para evitar conflictos y recursiones viejas
DROP POLICY IF EXISTS "Enable insert for group members" ON entries;
DROP POLICY IF EXISTS "Enable select for group members" ON entries;
DROP POLICY IF EXISTS "Enable update for group members" ON entries;
DROP POLICY IF EXISTS "Enable delete for group members" ON entries;
DROP POLICY IF EXISTS "Users can create personal entries" ON entries;
DROP POLICY IF EXISTS "Users can view own personal entries" ON entries;
DROP POLICY IF EXISTS "Users can update own personal entries" ON entries;
DROP POLICY IF EXISTS "Users can delete own personal entries" ON entries;
-- Borramos también policies genéricas que puedan haber creado la recursión
DROP POLICY IF EXISTS "Public entries access" ON entries;
DROP POLICY IF EXISTS "Authenticated users access" ON entries;

-- Volvemos a habilitar RLS
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 1. Políticas para ENTRADAS DE GRUPO (solo miembros)
-- -----------------------------------------------------

-- Ver: Permitir si soy miembro del grupo
CREATE POLICY "View group entries" ON entries FOR SELECT
USING (
    group_id IS NOT NULL 
    AND 
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_members.group_id = entries.group_id 
        AND group_members.user_id = auth.uid()
    )
);

-- Crear: Permitir si soy miembro del grupo
CREATE POLICY "Create group entries" ON entries FOR INSERT
WITH CHECK (
    group_id IS NOT NULL 
    AND 
    EXISTS (
        SELECT 1 FROM group_members 
        WHERE group_members.group_id = entries.group_id 
        AND group_members.user_id = auth.uid()
    )
);

-- Editar: Permitir si soy el autor O si soy admin del grupo (simplificado a autor por ahora)
CREATE POLICY "Update group entries" ON entries FOR UPDATE
USING (
    group_id IS NOT NULL AND auth.uid() = author_id
);

-- Borrar: Permitir si soy el autor
CREATE POLICY "Delete group entries" ON entries FOR DELETE
USING (
    group_id IS NOT NULL AND auth.uid() = author_id
);


-- -----------------------------------------------------
-- 2. Políticas para ENTRADAS PERSONALES (sin grupo)
-- -----------------------------------------------------

-- Ver: Solo mis propias entradas personales
CREATE POLICY "View personal entries" ON entries FOR SELECT
USING (
    (group_id IS NULL OR scope = 'personal') 
    AND author_id = auth.uid()
);

-- Crear: Solo mis propias entradas personales
CREATE POLICY "Create personal entries" ON entries FOR INSERT
WITH CHECK (
    -- Importante: asegurarnos que group_id sea NULL para evitar colar entradas a grupos
    group_id IS NULL 
    AND author_id = auth.uid()
    AND scope = 'personal'
);

-- Editar: Mis propias entradas
CREATE POLICY "Update personal entries" ON entries FOR UPDATE
USING (
    (group_id IS NULL OR scope = 'personal') 
    AND author_id = auth.uid()
);

-- Borrar: Mis propias entradas
CREATE POLICY "Delete personal entries" ON entries FOR DELETE
USING (
    (group_id IS NULL OR scope = 'personal') 
    AND author_id = auth.uid()
);
