-- Relajar la política de lectura para asegurar que el usuario vea TODAS sus propias entradas
-- independientemente de si el group_id es NULL o no. El filtro de frontend se encarga del resto.

DROP POLICY IF EXISTS "Select Personal Entries" ON entries;

CREATE POLICY "Select Personal Entries" ON entries FOR SELECT
USING (
  -- Permite ver cualquier entrada donde seas el autor.
  -- Esto cubre las personales (group_id null) y las de grupo (donde eres autor).
  -- Como en la página Personal filtrarmos por scope='personal', solo veremos las personales.
  author_id = auth.uid()
);

-- Asegurarnos de que las entradas personales viejas realmente tengan group_id NULL
-- Esto corrige datos corruptos de pruebas anteriores
UPDATE entries
SET group_id = NULL
WHERE scope = 'personal' AND group_id IS NOT NULL;
