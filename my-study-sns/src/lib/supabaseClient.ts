// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// .env.local 파일에 키를 보관하는 것이 정석이지만,
// 일단은 테스트를 위해 직접 넣음.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);