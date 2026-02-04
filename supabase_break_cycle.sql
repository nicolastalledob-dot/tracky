-- SOLUCIÓN DEFINITIVA: Romper el ciclo de recursión entre groups y group_members
-- Ninguna tabla debe consultar a la otra en sus policies.

-- ==========================================
-- PASO 1: Limpiar policies de group_members
-- ==========================================
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'group_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON group_members', pol.policyname);
    END LOOP;
END $$;

-- Policies simples que NO consultan otras tablas
CREATE POLICY "View own memberships" ON group_members FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Insert own membership" ON group_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own membership" ON group_members FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Update own membership" ON group_members FOR UPDATE
USING (user_id = auth.uid());


-- ==========================================
-- PASO 2: Limpiar policies de groups
-- ==========================================
DO $$
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'groups'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON groups', pol.policyname);
    END LOOP;
END $$;

-- Policies que consultan group_members PERO group_members ya no consulta groups, así que no hay ciclo
CREATE POLICY "View groups" ON groups FOR SELECT
USING (
    created_by = auth.uid()
    OR
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Create groups" ON groups FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Update groups" ON groups FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Delete groups" ON groups FOR DELETE
USING (created_by = auth.uid());
