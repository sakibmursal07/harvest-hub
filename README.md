# Harvest Hub — Starter Project

A working farmer-to-consumer marketplace: real login, real database, real orders.
Built with **Next.js** (frontend + simple backend in one) and **Supabase** (database + auth, hosted for free).

This guide assumes you've never done this before. Follow it top to bottom, in order.

---

## What you're about to do

1. Install the tools you need on your computer
2. Create a free Supabase project (this is your database)
3. Open this project in VS Code
4. Connect the project to your Supabase database
5. Run it locally and test it
6. Put it live on the internet

---

## Step 1 — Install the required tools

**A. Install Node.js** (lets you run JavaScript projects on your computer)
- Go to https://nodejs.org
- Download the **LTS** version and install it (keep clicking Next with defaults)
- To check it worked: open a terminal and type `node -v` — you should see a version number

**B. Install VS Code**
- Go to https://code.visualstudio.com and install it

**C. Install Git** (not strictly required, but useful later for deployment)
- Go to https://git-scm.com/downloads and install it

---

## Step 2 — Create your free Supabase project (your database)

1. Go to https://supabase.com and click **Start your project** → sign up (free, no card needed)
2. Click **New Project**
   - Name: `harvest-hub`
   - Set a database password (write it down somewhere safe)
   - Choose the region closest to you
   - Click **Create new project** (takes about a minute)
3. Once it's ready, in the left sidebar click **SQL Editor** → **New query**
4. Open the file `supabase/schema.sql` from this project (in VS Code, in the next step), copy **all of it**, paste it into the Supabase SQL editor, and click **Run**.
   - This creates all your tables (profiles, products, orders) automatically.
5. In the left sidebar, click **Project Settings → API**. You'll see:
   - **Project URL** — copy this
   - **anon public** key — copy this
   - Keep this tab open, you'll need these two values in Step 4.

---

## Step 3 — Open the project in VS Code

1. Unzip the `harvest-hub` folder you downloaded from this chat, anywhere on your computer (e.g. Desktop).
2. Open **VS Code** → **File → Open Folder** → select the `harvest-hub` folder.
3. Open a terminal inside VS Code: menu **Terminal → New Terminal**.
4. In that terminal, type:
   ```
   npm install
   ```
   This downloads all the code libraries the project needs (Next.js, Supabase, Tailwind). It'll take a minute or two.

---

## Step 4 — Connect the project to your Supabase database

1. In VS Code's file explorer (left side), find the file `.env.local.example`.
2. Make a copy of it and rename the copy to exactly `.env.local` (still in the project's root folder).
3. Open `.env.local` and paste in the two values you copied from Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-real-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-real-anon-key
   ```
4. Save the file (Ctrl+S / Cmd+S).

**Important:** Never share your `.env.local` file publicly or commit it to GitHub — treat it like a password.

---

## Step 5 — Run it locally

In the VS Code terminal:
```
npm run dev
```

You should see something like `ready - started server on http://localhost:3000`.

Open that link in your browser. You now have a working site with:
- A home page listing products (empty at first — that's expected)
- Sign up / Log in
- A farmer dashboard to add products
- An orders page

**Try this test flow:**
1. Go to `/signup`, create an account, choose **Farmer**, give it a farm name.
2. You'll land on the home page — click **Farmer Dashboard** → **+ Add Product** → fill it in → **List Product**.
3. Click **Browse** (home page) — your product should now appear.
4. Log out, sign up again as a **Consumer** (different email).
5. Click your product → choose a quantity → **Place Order**.
6. Go to **My Orders** — you'll see it as the consumer. Log back in as the farmer to confirm/deliver it.

If something doesn't show up, check the browser console (F12) and the VS Code terminal for red error text — it usually tells you exactly what's wrong (most common: a typo in `.env.local`).

---

## Step 6 — Put it live on the internet

1. Push this project to GitHub (VS Code has a built-in **Source Control** tab that walks you through this — or search "how to push a project to GitHub from VS Code" if it's your first time).
2. Go to https://vercel.com → sign up with GitHub → **Add New Project** → select your `harvest-hub` repo.
3. Before deploying, click **Environment Variables** and add the same two values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. In about a minute you'll get a real live URL like `harvest-hub.vercel.app`.

Your Supabase database is already live in the cloud (it always was) — so your deployed site and your local `localhost:3000` are both talking to the *same real database*.

---

## What's already working vs. what to build next

**Already working:**
- Real signup/login (Supabase Auth)
- Farmers can list, activate/deactivate, and delete products
- Consumers can browse and place orders
- Order status flow: pending → confirmed → delivered (or cancelled)
- Database-level security rules so users can only edit their own data

**Good next additions** (ask me for the code for any of these when you're ready):
- Product images (Supabase Storage)
- Admin dashboard to verify farmers
- Payment integration (Razorpay/Stripe)
- Shopping cart for multiple products in one order
- Email notifications on order status change
- Search & filter by category/distance on the home page

---

## Project structure

```
harvest-hub/
  pages/
    index.js              -> home page (browse products)
    login.js
    signup.js
    orders.js              -> order list + status updates
    product/[id].js         -> single product + place order
    farmer/dashboard.js     -> farmer's own listings
    farmer/add-product.js   -> add-product form
  components/
    Navbar.js
  lib/
    supabaseClient.js       -> connects the app to your database
  supabase/
    schema.sql              -> run this once in Supabase to create your tables
  .env.local               -> your real secret keys (you create this, never share it)
```
