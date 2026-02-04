-- 1. Crear función segura para verificar membresía
-- Usamos 'OR REPLACE' para evitar errores si ya existe
CREATE OR REPLACE FUNCTION is_group_member(input_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM group_members 
    WHERE group_id = input_group_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- 2. Limpiar TODAS las policies posibles (lista exhaustiva)
-- drop cascade no soportado en policies, hay que ir una por una
DO $$ 
BEGIN
    -- Borrar policies Viejas
    DROP POLICY IF EXISTS "Enable insert for group members" ON entries;
    DROP POLICY IF EXISTS "Enable select for group members" ON entries;
    DROP POLICY IF EXISTS "Enable update for group members" ON entries;
    DROP POLICY IF EXISTS "Enable delete for group members" ON entries;
    
    -- Borrar policies Personales (intento 1)
    DROP POLICY IF EXISTS "Users can create personal entries" ON entries;
    DROP POLICY IF EXISTS "Users can view own personal entries" ON entries;
    DROP POLICY IF EXISTS "Users can update own personal entries" ON entries;
    DROP POLICY IF EXISTS "Users can delete own personal entries" ON entries;
    
    -- Borrar policies del intento 2 (las que dan error de "already exists")
    DROP POLICY IF EXISTS "View group entries" ON entries;
    DROP POLICY IF EXISTS "Create group entries" ON entries;
    DROP POLICY IF EXISTS "Update group entries" ON entries;
    DROP POLICY IF EXISTS "Delete group entries" ON entries;
    DROP POLICY IF EXISTS "View personal entries" ON entries;
    DROP POLICY IF EXISTS "Create personal entries" ON entries;
    DROP POLICY IF EXISTS "Update personal entries" ON entries;
    DROP POLICY IF EXISTS "Delete personal entries" ON entries;

    -- Borrar policies nuevas si se corre el script de nuevo
    DROP POLICY IF EXISTS "Select Group Entries" ON entries;
    DROP POLICY IF EXISTS "Insert Group Entries" ON entries;
    DROP POLICY IF EXISTS "Update Group Entries" ON entries;
    DROP POLICY IF EXISTS "Delete Group Entries" ON entries;
    DROP POLICY IF EXISTS "Select Personal Entries" ON entries;
    DROP POLICY IF EXISTS "Insert Personal Entries" ON entries;
    DROP POLICY IF EXISTS "Update Personal Entries" ON entries;
    DROP POLICY IF EXISTS "Delete Personal Entries" ON entries;
END $$;

-- 3. Crear policies usando la función segura

-- GRUPOS
CREATE POLICY "Select Group Entries" ON entries FOR SELECT
USING (
  (group_id IS NOT NULL AND is_group_member(group_id))
);

CREATE POLICY "Insert Group Entries" ON entries FOR INSERT
WITH CHECK (
  (group_id IS NOT NULL AND is_group_member(group_id))
);

CREATE POLICY "Update Group Entries" ON entries FOR UPDATE
USING (
  (group_id IS NOT NULL AND auth.uid() = author_id)
);

CREATE POLICY "Delete Group Entries" ON entries FOR DELETE
USING (
  (group_id IS NOT NULL AND auth.uid() = author_id)
);


-- PERSONAL
CREATE POLICY "Select Personal Entries" ON entries FOR SELECT
USING (
  group_id IS NULL AND author_id = auth.uid()
);

CREATE POLICY "Insert Personal Entries" ON entries FOR INSERT
WITH CHECK (
  group_id IS NULL AND author_id = auth.uid()
);

CREATE POLICY "Update Personal Entries" ON entries FOR UPDATE
USING (
  group_id IS NULL AND author_id = auth.uid()
);

CREATE POLICY "Delete Personal Entries" ON entries FOR DELETE
USING (
  group_id IS NULL AND author_id = auth.uid()
);
