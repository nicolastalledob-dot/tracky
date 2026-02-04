-- Primero veamos qué policies tiene group_members
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'group_members';

-- Borrar TODAS las policies de group_members dinámicamente
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'group_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON group_members', pol.policyname);
    END LOOP;
END $$;

-- Crear policies SIMPLES y SIN RECURSIÓN para group_members

-- SELECT: Puedo ver los miembros de grupos donde yo soy miembro
-- PERO esto causaría recursión (SELECT from group_members needs SELECT policy on group_members)
-- La solución es usar una policy que NO consulte la misma tabla.

-- Opción segura: Puedo ver group_members si:
-- 1. Soy el miembro en cuestión (user_id = auth.uid())
-- 2. O soy el creador del grupo (consultando groups, no group_members)

CREATE POLICY "View own memberships" ON group_members FOR SELECT
USING (
    user_id = auth.uid()
);

-- Ver membresías de otros en mis grupos (necesita consultar groups, no group_members)
CREATE POLICY "View group memberships" ON group_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_members.group_id 
        AND groups.created_by = auth.uid()
    )
    OR
    -- Soy miembro del mismo grupo (PERO CUIDADO, esto puede causar recursión)
    -- Lo evitamos usando la lógica de "ya tengo una row en group_members con mi user_id"
    -- Si mi user_id está en group_members para el mismo group_id, puedo ver otros miembros
    -- Esto es seguro porque la primera condición (user_id = auth.uid()) ya cubre mi propia fila
    -- y esta consulta solo se evalúa si la primera policy no aplica.
    -- PERO Postgres evalúa todas las policies en paralelo, así que esto SÍ causa recursión.
    -- Vamos a evitarlo completamente.
    FALSE
);

-- INSERT: Puedo agregar miembros si soy admin del grupo
-- Esto requiere consultar group_members para verificar mi rol...
-- Lo cual causa recursión. Alternativa: Solo el creador puede agregar.
CREATE POLICY "Add members to owned groups" ON group_members FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_members.group_id 
        AND groups.created_by = auth.uid()
    )
);

-- DELETE: Puedo eliminar miembros si soy el creador del grupo o si me elimino a mí mismo
CREATE POLICY "Remove members" ON group_members FOR DELETE
USING (
    user_id = auth.uid() -- Me puedo salir yo mismo
    OR
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_members.group_id 
        AND groups.created_by = auth.uid()
    )
);

-- UPDATE: Cambiar rol, solo el creador del grupo
CREATE POLICY "Update member roles" ON group_members FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_members.group_id 
        AND groups.created_by = auth.uid()
    )
);
