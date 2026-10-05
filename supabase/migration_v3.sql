-- =========================================================
-- Harvest Hub Migration v3: Dynamic UPI Payments & Buyer Reviews
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =========================================================

-- 1. Add UPI ID to profiles table so farmers can receive direct digital payments
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS upi_id text;

-- 2. Create Reviews table for customer ratings & social proof
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  consumer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_order_product_review UNIQUE (order_id, product_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read verified reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated consumers can create their own review
CREATE POLICY "Consumers can insert their own review"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = consumer_id);

-- Consumers can update their own review
CREATE POLICY "Consumers can update their own review"
  ON reviews FOR UPDATE
  USING (auth.uid() = consumer_id);
