ALTER TABLE public.orders
  ADD COLUMN payment_status text NOT NULL DEFAULT 'en_attente',
  ADD COLUMN delivery_option text NOT NULL DEFAULT 'standard',
  ADD COLUMN estimated_delivery text;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('en_attente', 'reussi', 'echoue'));
