-- Make newly submitted product reviews visible by default, matching the UX request.
ALTER TABLE public.product_reviews
  ALTER COLUMN is_approved SET DEFAULT true;

ALTER TABLE public.product_reviews
  ALTER COLUMN is_hidden SET DEFAULT false;
