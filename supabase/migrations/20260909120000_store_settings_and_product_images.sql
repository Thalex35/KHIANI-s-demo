-- Store settings table for shop, currency, delivery and payment configuration.
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_settings_read_public" ON public.store_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "store_settings_manage_admin" ON public.store_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER store_settings_touch
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS store_settings_key_idx ON public.store_settings(key);

-- Supabase Storage bucket for product cover and gallery uploads.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_public_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(),'admin')
  ) WITH CHECK (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'product-images'
    AND public.has_role(auth.uid(),'admin')
  );
