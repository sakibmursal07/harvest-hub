-- =========================================================
-- Harvest Hub Migration v2: Order Delivery Details & Stock Management
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =========================================================

-- 1. Add delivery and payment columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod';

-- 2. Allow consumers to read customer profiles on orders they placed,
-- and allow farmers to read consumer profiles on orders placed with them
CREATE OR REPLACE VIEW order_details AS
SELECT 
  o.id AS order_id,
  o.created_at,
  o.quantity,
  o.total_price,
  o.status,
  o.delivery_address,
  o.phone,
  o.delivery_notes,
  o.payment_method,
  o.consumer_id,
  o.farmer_id,
  p.name AS product_name,
  p.unit AS product_unit,
  p.price AS product_price,
  p.image_url AS product_image,
  farmer.farm_name,
  farmer.location AS farm_location,
  consumer.full_name AS customer_name
FROM orders o
JOIN products p ON o.product_id = p.id
LEFT JOIN profiles farmer ON o.farmer_id = farmer.id
LEFT JOIN profiles consumer ON o.consumer_id = consumer.id;

-- 3. Trigger to automatically decrement product inventory when an order is placed
CREATE OR REPLACE FUNCTION deduct_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET quantity_available = GREATEST(0, quantity_available - NEW.quantity)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deduct_inventory ON orders;
CREATE TRIGGER trg_deduct_inventory
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_order();

-- 4. Trigger to restore product inventory if an order is cancelled
CREATE OR REPLACE FUNCTION restore_inventory_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE products
    SET quantity_available = quantity_available + OLD.quantity
    WHERE id = OLD.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_restore_inventory ON orders;
CREATE TRIGGER trg_restore_inventory
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION restore_inventory_on_cancel();
