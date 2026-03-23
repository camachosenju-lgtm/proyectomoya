import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hwgrnzxkxnqijbpadzep.supabase.co'
const supabaseAnonKey = 'sb_publishable_0V_waOZpGkGcY-QGQsDIQQ_DBk10L1_'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)