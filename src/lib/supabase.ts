import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 如果在客戶端環境（瀏覽器）且沒有變數，印出警告
if (typeof window !== 'undefined' && (!supabaseUrl || supabaseUrl.includes('placeholder'))) {
  console.error("🚨 航電連線中斷：偵測到無效的 Supabase URL。請檢查 Vercel 環境變數設定！");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
