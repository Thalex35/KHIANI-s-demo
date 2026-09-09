-- Create promotions table
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_read_all" ON public.promotions FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "promotions_admin" ON public.promotions FOR INSERT, UPDATE, DELETE
  TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER promotions_touch
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX promotions_is_active_idx ON public.promotions(is_active);
CREATE INDEX promotions_start_date_idx ON public.promotions(start_date);
CREATE INDEX promotions_end_date_idx ON public.promotions(end_date);

-- Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  coupon_type text NOT NULL CHECK (coupon_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL,
  minimum_order_value numeric(10,2),
  maximum_discount numeric(10,2),
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  expiration_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_read_active" ON public.coupons FOR SELECT
  TO anon, authenticated USING (is_active = true AND (expiration_date IS NULL OR expiration_date > now()));
CREATE POLICY "coupons_admin" ON public.coupons FOR INSERT, UPDATE, DELETE
  TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER coupons_touch
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX coupons_code_idx ON public.coupons(code);
CREATE INDEX coupons_is_active_idx ON public.coupons(is_active);
CREATE INDEX coupons_expiration_date_idx ON public.coupons(expiration_date);
