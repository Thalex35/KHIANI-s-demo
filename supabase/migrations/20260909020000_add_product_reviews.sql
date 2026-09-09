-- Create product reviews table
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  helpful_count integer NOT NULL DEFAULT 0,
  unhelpful_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_reviews TO anon, authenticated;
GRANT INSERT ON public.product_reviews TO authenticated;
GRANT UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public users can see approved reviews
CREATE POLICY "reviews_read_approved" ON public.product_reviews FOR SELECT
  TO anon, authenticated USING (is_approved = true AND is_hidden = false);

-- Admins can see all reviews
CREATE POLICY "reviews_read_admin" ON public.product_reviews FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Users can insert their own reviews
CREATE POLICY "reviews_insert_own" ON public.product_reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "reviews_update_own" ON public.product_reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "reviews_delete_own" ON public.product_reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Admins can approve/hide reviews
CREATE POLICY "reviews_approve_admin" ON public.product_reviews FOR UPDATE
  TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Admins can delete reviews
CREATE POLICY "reviews_delete_admin" ON public.product_reviews FOR DELETE
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER reviews_touch
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX reviews_product_idx ON public.product_reviews(product_id);
CREATE INDEX reviews_user_idx ON public.product_reviews(user_id);
CREATE INDEX reviews_approved_idx ON public.product_reviews(is_approved);
CREATE INDEX reviews_hidden_idx ON public.product_reviews(is_hidden);
CREATE INDEX reviews_rating_idx ON public.product_reviews(rating);
CREATE INDEX reviews_created_at_idx ON public.product_reviews(created_at DESC);

-- Create review helpfulness table (track user ratings of reviews)
CREATE TABLE public.review_helpfulness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

GRANT SELECT, INSERT ON public.review_helpfulness TO authenticated;
GRANT ALL ON public.review_helpfulness TO service_role;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "helpfulness_read" ON public.review_helpfulness FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "helpfulness_insert" ON public.review_helpfulness FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX helpfulness_review_idx ON public.review_helpfulness(review_id);
CREATE INDEX helpfulness_user_idx ON public.review_helpfulness(user_id);
