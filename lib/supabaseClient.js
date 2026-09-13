import { createClient } from "@supabase/supabase-js";

// These two values come from your .env.local file.
// Every page in this app imports "supabase" from here to talk to the database.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
