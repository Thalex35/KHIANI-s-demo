-- Le catalogue public est lisible par les visiteurs : la policy des produits
-- appelle has_role(), l'exécution doit donc être autorisée aux rôles anon et authenticated.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;