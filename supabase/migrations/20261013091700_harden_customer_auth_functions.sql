-- Pin security-definer search paths and prevent direct execution of the auth trigger.
CREATE OR REPLACE FUNCTION public.set_default_customer_address(p_address_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT ca.user_id INTO v_user_id
  FROM public.customer_addresses ca
  WHERE ca.id = p_address_id AND ca.user_id = auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Address not found'; END IF;
  UPDATE public.customer_addresses SET is_default = false WHERE user_id = v_user_id;
  UPDATE public.customer_addresses SET is_default = true WHERE id = p_address_id AND user_id = v_user_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_customer_auth_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_default_customer_address(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_default_customer_address(uuid) TO authenticated;
