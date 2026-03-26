import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xwhstezzheoaxxegbajd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3aHN0ZXp6aGVvYXh4ZWdiYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTMyMTIsImV4cCI6MjA4ODM2OTIxMn0.en_av8K9vAU7tzHbAIWGQP9BdIYRtyPw2m3mLMndsG4";

export const supabase = createClient(supabaseUrl, supabaseKey);