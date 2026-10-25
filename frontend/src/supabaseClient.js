import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Missing cloud configuration must never prevent a guest simulation.
export const supabase=url&&key?createClient(url,key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}}):null;

export async function ensureGoogleEnabled(){
 const response=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key}});
 if(!response.ok)throw new Error('auth-unavailable');
 const settings=await response.json();
 if(settings.external?.google!==true)throw new Error('google-not-enabled');
}
