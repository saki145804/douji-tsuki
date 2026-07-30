import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://ialdnuubdlhmpgivyvua.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_S71xUm58zRGJtapCF20Gmw_wGHrOgks'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
