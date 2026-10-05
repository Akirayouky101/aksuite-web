BEGIN;

-- Keep the original text for existing products and older clients.
ALTER TABLE public.shopping_items
  ADD COLUMN quantity_value numeric,
  ADD COLUMN quantity_unit text,
  ADD CONSTRAINT shopping_quantity_valid CHECK (
    (quantity_value IS NULL AND quantity_unit IS NULL)
    OR (
      quantity_value IS NOT NULL AND quantity_unit IS NOT NULL
      AND quantity_value > 0 AND quantity_value <= 999999999
      AND quantity_value = round(quantity_value, 3)
      AND quantity_unit IN ('pezzi', 'g', 'kg', 'ml', 'l')
    )
  );

COMMIT;
