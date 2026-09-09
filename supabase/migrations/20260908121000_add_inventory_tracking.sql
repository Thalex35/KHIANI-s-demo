-- Create inventory history table to track all stock changes
CREATE TABLE public.inventory_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  quantity_change integer NOT NULL,
  reason text NOT NULL,
  notes text,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.inventory_history TO authenticated;
GRANT INSERT ON public.inventory_history TO authenticated;
GRANT ALL ON public.inventory_history TO service_role;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_history_read_admin" ON public.inventory_history FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "inventory_history_insert_admin" ON public.inventory_history FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Create indexes for efficient queries
CREATE INDEX inventory_history_product_variant_idx ON public.inventory_history(product_variant_id);
CREATE INDEX inventory_history_product_idx ON public.inventory_history(product_id);
CREATE INDEX inventory_history_admin_idx ON public.inventory_history(admin_id);
CREATE INDEX inventory_history_created_at_idx ON public.inventory_history(created_at DESC);
CREATE INDEX inventory_history_reason_idx ON public.inventory_history(reason);

-- Create stock adjustments table for tracking admin adjustments
CREATE TABLE public.stock_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_stock integer NOT NULL,
  new_stock integer NOT NULL,
  quantity_change integer NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('increase', 'decrease', 'set')),
  reason text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stock_adjustments TO authenticated;
GRANT INSERT ON public.stock_adjustments TO authenticated;
GRANT ALL ON public.stock_adjustments TO service_role;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_adjustments_read_admin" ON public.stock_adjustments FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "stock_adjustments_insert_admin" ON public.stock_adjustments FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Create indexes
CREATE INDEX stock_adjustments_product_variant_idx ON public.stock_adjustments(product_variant_id);
CREATE INDEX stock_adjustments_product_idx ON public.stock_adjustments(product_id);
CREATE INDEX stock_adjustments_admin_idx ON public.stock_adjustments(admin_id);
CREATE INDEX stock_adjustments_created_at_idx ON public.stock_adjustments(created_at DESC);
