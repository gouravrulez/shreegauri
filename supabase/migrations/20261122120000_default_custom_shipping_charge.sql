-- Optional per-product shipping override: an omitted value means no extra charge.
-- Backfill existing rows before enforcing the NOT NULL invariant.
UPDATE public.products
SET custom_shipping_charge_inr = 0
WHERE custom_shipping_charge_inr IS NULL;

ALTER TABLE public.products
  ALTER COLUMN custom_shipping_charge_inr SET DEFAULT 0,
  ALTER COLUMN custom_shipping_charge_inr SET NOT NULL;
