-- Staff access roles and restricted audit trail for Shree Gauri.
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check CHECK (role = ANY (ARRAY['admin','manager','orders','support','catalog']::text[]));

CREATE OR REPLACE FUNCTION private.has_staff_role(p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = ANY (p_roles)
  );
$function$;
REVOKE ALL ON FUNCTION private.has_staff_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_staff_role(text[]) TO authenticated;

DROP POLICY IF EXISTS staff_read_own_role ON public.admin_users;
CREATE POLICY staff_read_own_role ON public.admin_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS staff_catalog_read_products ON public.products;
CREATE POLICY staff_catalog_read_products ON public.products
  FOR SELECT TO authenticated USING (private.has_staff_role(ARRAY['manager','catalog']));
DROP POLICY IF EXISTS staff_catalog_insert_products ON public.products;
CREATE POLICY staff_catalog_insert_products ON public.products
  FOR INSERT TO authenticated WITH CHECK (private.has_staff_role(ARRAY['manager','catalog']));
DROP POLICY IF EXISTS staff_catalog_update_products ON public.products;
CREATE POLICY staff_catalog_update_products ON public.products
  FOR UPDATE TO authenticated USING (private.has_staff_role(ARRAY['manager','catalog']))
  WITH CHECK (private.has_staff_role(ARRAY['manager','catalog']));

DROP POLICY IF EXISTS staff_catalog_read_categories ON public.categories;
CREATE POLICY staff_catalog_read_categories ON public.categories
  FOR SELECT TO authenticated USING (private.has_staff_role(ARRAY['manager','catalog']));
DROP POLICY IF EXISTS staff_catalog_insert_categories ON public.categories;
CREATE POLICY staff_catalog_insert_categories ON public.categories
  FOR INSERT TO authenticated WITH CHECK (private.has_staff_role(ARRAY['manager','catalog']));
DROP POLICY IF EXISTS staff_catalog_update_categories ON public.categories;
CREATE POLICY staff_catalog_update_categories ON public.categories
  FOR UPDATE TO authenticated USING (private.has_staff_role(ARRAY['manager','catalog']))
  WITH CHECK (private.has_staff_role(ARRAY['manager','catalog']));

DROP POLICY IF EXISTS staff_catalog_read_variants ON public.product_variants;
CREATE POLICY staff_catalog_read_variants ON public.product_variants
  FOR SELECT TO authenticated USING (private.has_staff_role(ARRAY['manager','catalog']));
DROP POLICY IF EXISTS staff_catalog_insert_variants ON public.product_variants;
CREATE POLICY staff_catalog_insert_variants ON public.product_variants
  FOR INSERT TO authenticated WITH CHECK (private.has_staff_role(ARRAY['manager','catalog']));
DROP POLICY IF EXISTS staff_catalog_update_variants ON public.product_variants;
CREATE POLICY staff_catalog_update_variants ON public.product_variants
  FOR UPDATE TO authenticated USING (private.has_staff_role(ARRAY['manager','catalog']))
  WITH CHECK (private.has_staff_role(ARRAY['manager','catalog']));

DROP POLICY IF EXISTS staff_read_orders ON public.orders;
CREATE POLICY staff_read_orders ON public.orders
  FOR SELECT TO authenticated USING (private.has_staff_role(ARRAY['manager','orders','support']));
DROP POLICY IF EXISTS staff_update_orders ON public.orders;
CREATE POLICY staff_update_orders ON public.orders
  FOR UPDATE TO authenticated USING (private.has_staff_role(ARRAY['manager','orders']))
  WITH CHECK (private.has_staff_role(ARRAY['manager','orders']));

DROP POLICY IF EXISTS staff_read_order_items ON public.order_items;
CREATE POLICY staff_read_order_items ON public.order_items
  FOR SELECT TO authenticated USING (private.has_staff_role(ARRAY['manager','orders','support']));

DROP POLICY IF EXISTS staff_read_customers ON public.customers;
CREATE POLICY staff_read_customers ON public.customers
  FOR SELECT TO authenticated USING (private.has_staff_role(ARRAY['manager','orders','support']));

DROP POLICY IF EXISTS staff_read_reviews ON public.product_reviews;
CREATE POLICY staff_read_reviews ON public.product_reviews
  FOR SELECT TO authenticated USING (private.has_staff_role(ARRAY['manager']));
DROP POLICY IF EXISTS staff_update_reviews ON public.product_reviews;
CREATE POLICY staff_update_reviews ON public.product_reviews
  FOR UPDATE TO authenticated USING (private.has_staff_role(ARRAY['manager']))
  WITH CHECK (private.has_staff_role(ARRAY['manager']));

CREATE TABLE IF NOT EXISTS private.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE private.admin_audit_log FROM PUBLIC, anon, authenticated;
