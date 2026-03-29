// Para implementar supabase no projeto , comecamos instalando a biblioteca do supabase
// npm install @supabase/supabase-js
import { createClient } from "@supabase/supabase-js";
// Criamos uma instancia do supabase passando a url e a chave anonima
// Essas variaveis de ambiente estao definidas no arquivo .env.local
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
