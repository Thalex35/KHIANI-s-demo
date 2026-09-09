ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS delivery_longitude numeric(9,6);

CREATE OR REPLACE FUNCTION public.toggle_review_helpfulness(
  p_review_id uuid,
  p_user_id uuid,
  p_is_helpful boolean
)
RETURNS TABLE (
  review_id uuid,
  helpful_count integer,
  unhelpful_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  current_vote boolean;
  review_found boolean := false;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized review vote';
  end if;

  select true into review_found
  from public.product_reviews
  where id = p_review_id
  limit 1;

  if not review_found then
    raise exception 'Review not found';
  end if;

  select is_helpful into current_vote
  from public.review_helpfulness
  where review_id = p_review_id and user_id = p_user_id
  limit 1;

  if current_vote is null then
    insert into public.review_helpfulness(review_id, user_id, is_helpful)
    values (p_review_id, p_user_id, p_is_helpful)
    on conflict (review_id, user_id)
    do update set is_helpful = excluded.is_helpful;

    if p_is_helpful then
      update public.product_reviews
      set helpful_count = helpful_count + 1
      where id = p_review_id;
    else
      update public.product_reviews
      set unhelpful_count = unhelpful_count + 1
      where id = p_review_id;
    end if;
  elsif current_vote = p_is_helpful then
    delete from public.review_helpfulness
    where review_id = p_review_id and user_id = p_user_id;

    if p_is_helpful then
      update public.product_reviews
      set helpful_count = greatest(helpful_count - 1, 0)
      where id = p_review_id;
    else
      update public.product_reviews
      set unhelpful_count = greatest(unhelpful_count - 1, 0)
      where id = p_review_id;
    end if;
  else
    update public.review_helpfulness
    set is_helpful = p_is_helpful
    where review_id = p_review_id and user_id = p_user_id;

    if p_is_helpful then
      update public.product_reviews
      set helpful_count = helpful_count + 1,
          unhelpful_count = greatest(unhelpful_count - 1, 0)
      where id = p_review_id;
    else
      update public.product_reviews
      set unhelpful_count = unhelpful_count + 1,
          helpful_count = greatest(helpful_count - 1, 0)
      where id = p_review_id;
    end if;
  end if;

  return query
    select p_review_id,
           pr.helpful_count,
           pr.unhelpful_count
    from public.product_reviews pr
    where pr.id = p_review_id;
end;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_review_helpfulness(uuid, uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_user_id uuid,
  p_full_name text,
  p_phone text,
  p_address text,
  p_city text,
  p_country text,
  p_notes text,
  p_delivery_option text,
  p_payment_method text,
  p_discount numeric default 0,
  p_shipping numeric default 0,
  p_subtotal numeric default 0,
  p_total numeric default 0,
  p_delivery_latitude numeric default null,
  p_delivery_longitude numeric default null,
  p_items jsonb default '[]'::jsonb
)
RETURNS TABLE(id uuid, order_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  item jsonb;
  v_product_id uuid;
  v_size text;
  v_color text;
  v_quantity integer;
  v_product record;
  v_variant record;
  v_effective_price numeric;
  v_subtotal_value numeric := 0;
  v_shipping_value numeric := 0;
  v_discount_value numeric := coalesce(p_discount, 0);
  v_total_value numeric := 0;
  v_order_id uuid;
  v_order_number text;
  v_variant_id uuid;
  v_variant_stock integer;
  v_stock_after_order integer;
  v_order_item_count integer := 0;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized order creation';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid cart payload';
  end if;

  if coalesce(jsonb_array_length(p_items), 0) = 0 then
    raise exception 'Cart is empty';
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := item->>'product_id';
    v_size := item->>'size';
    v_color := item->>'color';
    v_quantity := coalesce((item->>'quantity')::integer, 0);

    if v_quantity <= 0 then
      raise exception 'Invalid quantity';
    end if;

    select id, name, price, sale_price, is_active
      into v_product
      from public.products
      where id = v_product_id;

    if not found or v_product.is_active = false then
      raise exception 'Product unavailable';
    end if;

    select id, stock
      into v_variant
      from public.product_variants
      where product_id = v_product_id
        and size = v_size
        and color = v_color
      limit 1;

    if not found then
      raise exception 'Variant unavailable';
    end if;

    if v_variant.stock < v_quantity then
      raise exception 'Not enough stock for selected variant';
    end if;

    v_effective_price := coalesce(v_product.sale_price, v_product.price);
    v_subtotal_value := v_subtotal_value + (v_effective_price * v_quantity);
    v_order_item_count := v_order_item_count + 1;
  end loop;

  if p_subtotal <> 0 and abs(p_subtotal - v_subtotal_value) > 0.01 then
    raise exception 'Cart subtotal mismatch';
  end if;

  v_shipping_value := case
    when p_delivery_option = 'pickup' then 0
    when p_delivery_option = 'express' then 12.90
    when v_subtotal_value >= 80 then 0
    else 5.90
  end case;

  v_total_value := v_subtotal_value + v_shipping_value - v_discount_value;

  if abs(p_total - v_total_value) > 0.01 then
    raise exception 'Order total mismatch';
  end if;

  if abs(p_shipping - v_shipping_value) > 0.01 then
    raise exception 'Shipping mismatch';
  end if;

  v_order_number := 'MN-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 6);

  insert into public.orders (
    user_id,
    order_number,
    status,
    payment_status,
    delivery_option,
    estimated_delivery,
    subtotal,
    discount,
    shipping,
    total,
    payment_method,
    full_name,
    phone,
    address,
    city,
    country,
    notes,
    delivery_latitude,
    delivery_longitude
  ) values (
    p_user_id,
    v_order_number,
    'en_attente',
    'reussi',
    p_delivery_option,
    case
      when p_delivery_option = 'express' then '1 à 2 jours ouvrés'
      when p_delivery_option = 'pickup' then 'Sous 24 heures'
      else '2 à 5 jours ouvrés'
    end,
    v_subtotal_value,
    v_discount_value,
    v_shipping_value,
    v_total_value,
    p_payment_method,
    p_full_name,
    p_phone,
    p_address,
    p_city,
    p_country,
    p_notes,
    p_delivery_latitude,
    p_delivery_longitude
  ) returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := item->>'product_id';
    v_size := item->>'size';
    v_color := item->>'color';
    v_quantity := coalesce((item->>'quantity')::integer, 0);

    select id, stock
      into v_variant
      from public.product_variants
      where product_id = v_product_id
        and size = v_size
        and color = v_color
      limit 1;

    select name, cover_url, price, sale_price
      into v_product
      from public.products
      where id = v_product_id;

    insert into public.order_items (
      order_id,
      product_id,
      name,
      image_url,
      size,
      color,
      unit_price,
      quantity
    ) values (
      v_order_id,
      v_product_id,
      v_product.name,
      v_product.cover_url,
      v_size,
      v_color,
      coalesce(v_product.sale_price, v_product.price),
      v_quantity
    );

    update public.product_variants
      set stock = stock - v_quantity
      where id = v_variant.id;
  end loop;

  return query
    select v_order_id, v_order_number;
end;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_secure(
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  numeric,
  jsonb
) TO authenticated;
