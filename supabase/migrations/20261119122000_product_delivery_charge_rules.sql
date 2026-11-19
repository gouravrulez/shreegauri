-- Product-level delivery fee rules for Shree Gauri.
-- Existing products remain unchanged because custom_shipping_enabled is false for them.
CREATE OR REPLACE FUNCTION public.create_store_order(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_customer jsonb := coalesce(payload->'customer','{}'::jsonb);
  v_address jsonb := coalesce(payload->'address','{}'::jsonb);
  v_items jsonb := coalesce(payload->'items','[]'::jsonb);
  v_auth_user_id uuid := nullif(payload->>'authenticated_user_id','')::uuid;
  v_name text := nullif(trim(v_customer->>'name'),'');
  v_email text := nullif(trim(v_customer->>'email'),'');
  v_phone text := nullif(trim(v_customer->>'phone'),'');
  v_promo_code text := upper(trim(coalesce(payload->>'promo_code','')));
  v_promo public.promo_codes%rowtype;
  v_item jsonb;
  v_product products%rowtype;
  v_variant product_variants%rowtype;
  v_qty int;
  v_price numeric(12,2);
  v_subtotal numeric(12,2):=0;
  v_discount numeric(12,2):=0;
  v_total numeric(12,2):=0;
  v_shipping numeric(12,2):=0;
  v_default_shipping numeric(12,2):=0;
  v_free_shipping_enabled boolean:=false;
  v_free_shipping_threshold numeric(12,2):=null;
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_variant_id uuid;
  v_product_id uuid;
  v_reserved int;
  v_expires timestamptz:=now()+interval '15 minutes';
begin
  perform public.expire_inventory_reservations();
  if v_auth_user_id is null then raise exception 'Customer login is required'; end if;
  if v_name is null or v_phone is null then raise exception 'Name and phone are required'; end if;
  if jsonb_typeof(v_items)<>'array' or jsonb_array_length(v_items)<1 then raise exception 'Your bag is empty'; end if;
  if jsonb_array_length(v_items)>25 then raise exception 'Too many items'; end if;
  if coalesce(nullif(trim(v_address->>'line1'),''),'')='' or coalesce(nullif(trim(v_address->>'city'),''),'')='' or coalesce(nullif(trim(v_address->>'state'),''),'')='' or coalesce(nullif(trim(v_address->>'pincode'),''),'')='' then raise exception 'Complete shipping address is required'; end if;

  select coalesce(default_shipping_charge_inr,0), coalesce(free_shipping_enabled,false), free_shipping_threshold_inr
    into v_default_shipping, v_free_shipping_enabled, v_free_shipping_threshold
    from public.shipping_settings where id=1;

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_product_id:=nullif(v_item->>'product_id','')::uuid;
    v_variant_id:=nullif(v_item->>'variant_id','')::uuid;
    v_qty:=greatest(1,least(10,coalesce((v_item->>'quantity')::int,1)));
    select * into v_product from products where id=v_product_id and is_active=true for update;
    if not found then raise exception 'A product is unavailable'; end if;
    if v_variant_id is not null then
      select * into v_variant from product_variants where id=v_variant_id and product_id=v_product_id and is_active=true for update;
      if not found then raise exception 'A selected option is unavailable'; end if;
      select coalesce(sum(quantity),0)::int into v_reserved from inventory_reservations where variant_id=v_variant_id and status='active' and expires_at>now();
      if v_variant.stock_quantity-v_reserved < v_qty then raise exception 'Not enough stock for %',v_product.name; end if;
      v_price:=coalesce(v_variant.price_inr,v_product.price_inr);
    else
      if exists(select 1 from product_variants where product_id=v_product_id and is_active=true) then raise exception 'Please select a carat/ratti option for %',v_product.name; end if;
      select coalesce(sum(quantity),0)::int into v_reserved from inventory_reservations where product_id=v_product_id and variant_id is null and status='active' and expires_at>now();
      if v_product.stock_quantity-v_reserved < v_qty then raise exception 'Not enough stock for %',v_product.name; end if;
      v_price:=v_product.price_inr;
    end if;
    v_subtotal:=v_subtotal+(v_price*v_qty);
    if coalesce(v_product.custom_shipping_enabled,false) then
      v_shipping:=v_shipping+(coalesce(nullif(v_product.custom_shipping_charge_inr,0),v_default_shipping)*v_qty);
    end if;
  end loop;

  if v_promo_code<>'' then
    select * into v_promo from public.promo_codes where upper(code)=v_promo_code and is_active=true and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()) and (max_uses is null or usage_count<max_uses) for update;
    if not found then raise exception 'Promo code is not valid or has expired'; end if;
    if v_subtotal<v_promo.min_order_inr then raise exception 'Minimum order value for this promo code is ₹%',v_promo.min_order_inr; end if;
    if v_promo.discount_type='percentage' then
      v_discount:=round(v_subtotal*v_promo.discount_value/100,2);
      if v_promo.max_discount_inr is not null then v_discount:=least(v_discount,v_promo.max_discount_inr); end if;
    else
      v_discount:=least(v_promo.discount_value,v_subtotal);
    end if;
  end if;
  if v_free_shipping_enabled and v_free_shipping_threshold is not null and v_subtotal>=v_free_shipping_threshold then
    v_shipping:=0;
  end if;
  v_total:=greatest(0,v_subtotal-v_discount+v_shipping);

  select id into v_customer_id from public.customers where auth_user_id=v_auth_user_id limit 1 for update;
  if v_customer_id is null then
    insert into public.customers(auth_user_id,full_name,email,phone,updated_at)
    values(v_auth_user_id,v_name,v_email,v_phone,now()) returning id into v_customer_id;
  else
    update public.customers
    set full_name=coalesce(v_name,full_name), email=coalesce(v_email,email), phone=coalesce(v_phone,phone), updated_at=now()
    where id=v_customer_id;
  end if;

  v_order_number:='SG-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into orders(order_number,customer_id,customer_name,email,phone,shipping_address,subtotal_inr,shipping_inr,discount_inr,total_inr,currency,payment_status,order_status,notes,reservation_expires_at)
  values(v_order_number,v_customer_id,v_name,v_email,v_phone,v_address,v_subtotal,v_shipping,v_discount,v_total,'INR','pending','pending',case when v_promo_code<>'' then 'Website checkout received. Promo code '||v_promo_code||' applied. Payment confirmation pending.' else 'Website checkout received. Payment confirmation pending.' end,v_expires)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_product_id:=nullif(v_item->>'product_id','')::uuid;
    v_variant_id:=nullif(v_item->>'variant_id','')::uuid;
    v_qty:=greatest(1,least(10,coalesce((v_item->>'quantity')::int,1)));
    select * into v_product from products where id=v_product_id;
    if v_variant_id is not null then
      select * into v_variant from product_variants where id=v_variant_id and product_id=v_product_id;
      v_price:=coalesce(v_variant.price_inr,v_product.price_inr);
    else
      v_price:=v_product.price_inr;
    end if;
    insert into order_items(order_id,product_id,variant_id,product_name,variant_label,sku,quantity,unit_price_inr,line_total_inr)
    values(v_order_id,v_product_id,v_variant_id,v_product.name,case when v_variant_id is null then null else v_variant.label end,coalesce(case when v_variant_id is null then v_product.sku else v_variant.sku end,v_product.sku),v_qty,v_price,v_price*v_qty);
    insert into inventory_reservations(order_id,product_id,variant_id,quantity,status,expires_at)
    values(v_order_id,v_product_id,v_variant_id,v_qty,'active',v_expires);
  end loop;

  if v_promo_code<>'' then update public.promo_codes set usage_count=usage_count+1,updated_at=now() where id=v_promo.id; end if;
  return jsonb_build_object('order_id',v_order_id,'order_number',v_order_number,'subtotal_inr',v_subtotal,'discount_inr',v_discount,'shipping_inr',v_shipping,'total_inr',v_total,'promo_code',nullif(v_promo_code,''),'status','pending','reservation_expires_at',v_expires);
end;
$function$
