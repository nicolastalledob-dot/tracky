-- Este script BORRA TODAS las políticas de la tabla 'entries' sin importar su nombre.
-- Es la solución definitiva para limpiar reglas huerfanas recursivas.

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'entries'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON entries', pol.policyname);
    END LOOP;
END $$;

-- Ahora que está limpia, aplicamos SOLO las reglas seguras y definitivas.

-- 1. Función auxiliar (ya la tenemos, pero por si acaso)
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

-- 2. Reglas para GRUPOS
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

-- 3. Reglas para PERSONAL (Simples y directas)
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
