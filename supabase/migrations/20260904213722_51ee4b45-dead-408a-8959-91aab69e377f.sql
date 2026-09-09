
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.decrement_variant_stock(uuid, text, text, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, text, text, integer) TO authenticated;
