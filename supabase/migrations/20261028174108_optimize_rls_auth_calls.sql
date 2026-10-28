-- Optimize RLS auth.uid() evaluation as recommended by Supabase.
-- Policy roles, commands, USING expressions, and WITH CHECK expressions are preserved.
-- Only direct auth.uid() calls are wrapped in scalar SELECTs; access semantics remain unchanged.
DO $optimize_policies$
DECLARE
  r record;
  v_roles_sql text;
  v_using text;
  v_check text;
  v_create_sql text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual, '') LIKE '%auth.uid()%'
        OR coalesce(with_check, '') LIKE '%auth.uid()%')
  LOOP
    IF 'public' = ANY (r.roles) THEN
      v_roles_sql := 'PUBLIC';
    ELSE
      SELECT string_agg(quote_ident(role_name::text), ', ')
        INTO v_roles_sql
      FROM unnest(r.roles) AS role_name;
    END IF;

    v_using := CASE
      WHEN r.qual IS NULL THEN NULL
      ELSE replace(r.qual, 'auth.uid()', '(select auth.uid())')
    END;
    v_check := CASE
      WHEN r.with_check IS NULL THEN NULL
      ELSE replace(r.with_check, 'auth.uid()', '(select auth.uid())')
    END;

    EXECUTE format('DROP POLICY %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);

    v_create_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      r.policyname, r.schemaname, r.tablename,
      r.permissive, r.cmd, v_roles_sql
    );

    IF v_using IS NOT NULL THEN
      v_create_sql := v_create_sql || ' USING (' || v_using || ')';
    END IF;
    IF v_check IS NOT NULL THEN
      v_create_sql := v_create_sql || ' WITH CHECK (' || v_check || ')';
    END IF;

    EXECUTE v_create_sql;
  END LOOP;
END
$optimize_policies$;
