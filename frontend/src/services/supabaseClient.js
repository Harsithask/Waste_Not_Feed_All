import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Project URL and Anon Key from Supabase Settings
const supabaseUrl = 'https://xwhstezzheoaxxegbajd.supabase.co';
const supabaseAnonKey = 'sb_publishable_burzQKxGhLCFshJQ29sUsw_3OR-qzCP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
