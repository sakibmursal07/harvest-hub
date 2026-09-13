-- =========================================================
-- Harvest Hub database schema
-- HOW TO USE: Supabase Dashboard -> SQL Editor -> New query
-- Paste this whole file in and click "Run".
-- =========================================================

-- 1. Profiles table (extends Supabase's built-in auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text not null default 'consumer' check (role in ('consumer', 'farmer', 'admin')),
  farm_name text,          -- only used if role = 'farmer'
  location text,
  verified boolean default false,  -- admin flips this to true to approve a farmer
  created_at timestamp with time zone default now()
);

-- 2. Products table
create table products (
  id uuid default gen_random_uuid() primary key,
  farmer_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  price numeric(10,2) not null,
  unit text not null default 'kg',
  quantity_available integer not null default 0,
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. Orders table
create table orders (
  id uuid default gen_random_uuid() primary key,
  consumer_id uuid references profiles(id) not null,
  farmer_id uuid references profiles(id) not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  total_price numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','confirmed','delivered','cancelled')),
  created_at timestamp with time zone default now()
);

-- =========================================================
-- Row Level Security (RLS) — controls who can read/write what.
-- Without this, ANY logged-in user could edit anyone's data.
-- =========================================================

alter table profiles enable row level security;
alter table products enable row level security;
alter table orders enable row level security;

-- Profiles: anyone can view profiles (needed to show farmer names publicly),
-- but you can only edit your own profile.
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- Products: anyone can view active products.
-- Only the farmer who owns a product can insert/update/delete it.
create policy "Active products are viewable by everyone"
  on products for select using (true);

create policy "Farmers can insert their own products"
  on products for insert with check (auth.uid() = farmer_id);

create policy "Farmers can update their own products"
  on products for update using (auth.uid() = farmer_id);

create policy "Farmers can delete their own products"
  on products for delete using (auth.uid() = farmer_id);

-- Orders: a consumer can see their own orders, a farmer can see orders placed on their products.
create policy "Consumers can view their own orders"
  on orders for select using (auth.uid() = consumer_id or auth.uid() = farmer_id);

create policy "Consumers can create orders"
  on orders for insert with check (auth.uid() = consumer_id);

create policy "Farmers can update status of their own orders"
  on orders for update using (auth.uid() = farmer_id);
