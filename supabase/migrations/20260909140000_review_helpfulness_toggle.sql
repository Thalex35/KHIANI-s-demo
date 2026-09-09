create or replace function public.toggle_review_helpfulness(
  p_review_id uuid,
  p_user_id uuid,
  p_is_helpful boolean
)
returns table(
  review_id uuid,
  helpful_count integer,
  unhelpful_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_vote boolean;
  helpful_delta integer := 0;
  unhelpful_delta integer := 0;
  review record;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized review vote';
  end if;

  select * into review from public.product_reviews where id = p_review_id for update;
  if not found then
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
      update public.product_reviews set helpful_count = helpful_count + 1 where id = p_review_id;
    else
      update public.product_reviews set unhelpful_count = unhelpful_count + 1 where id = p_review_id;
    end if;

  elsif current_vote = p_is_helpful then
    delete from public.review_helpfulness
    where review_id = p_review_id and user_id = p_user_id;

    if p_is_helpful then
      update public.product_reviews set helpful_count = greatest(helpful_count - 1, 0) where id = p_review_id;
    else
      update public.product_reviews set unhelpful_count = greatest(unhelpful_count - 1, 0) where id = p_review_id;
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
         (select helpful_count from public.product_reviews where id = p_review_id),
         (select unhelpful_count from public.product_reviews where id = p_review_id);
end;
$$;

grant execute on function public.toggle_review_helpfulness(uuid, uuid, boolean) to authenticated;
