import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {supabase,ensureGoogleEnabled} from './supabaseClient';
const Context=createContext(null);
export const AUTH_DRAFT_KEY='beyond-earth.oauth-draft.v1';
export function AuthProvider({children}) {
 const [user,setUser]=useState(null),[loading,setLoading]=useState(Boolean(supabase)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const beforeSignIn=useRef(null);
 const registerBeforeSignIn=useCallback(callback=>{beforeSignIn.current=callback;return()=>{if(beforeSignIn.current===callback)beforeSignIn.current=null;};},[]);
 useEffect(()=>{
  if(!supabase)return;
  let active=true,revision=0;
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{revision++;if(active){setUser(session?.user??null);setLoading(false);}});
  const started=revision;
  supabase.auth.getSession().then(({data,error})=>{if(!active||revision!==started)return;setUser(data?.session?.user??null);setLoading(false);if(error)setError('Sign-in could not finish. Try Google again or continue as a guest.');}).catch(()=>{if(active){setLoading(false);setError('Account connection unavailable. Guest mode still works.');}});
  if(new URLSearchParams(window.location.search).has('error'))setError('Google sign-in was cancelled or could not finish. You can continue as a guest.');
  return()=>{active=false;subscription.unsubscribe();};
 },[]);
 async function signIn(){
  if(!supabase||busy)return;
  setError('');setBusy(true);
  try{
   // OAuth redirects the page. Preserve only a temporary validated input draft.
   await ensureGoogleEnabled();
   try{beforeSignIn.current?.();}catch{throw new Error('draft-not-ready');}
   const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/simulation`}});
   if(error)throw error;
  }catch(error){setError(error.message==='google-not-enabled'?'Google sign-in is not enabled in Supabase yet. Guest mode still works.':error.message==='draft-not-ready'?'Finish the current mission fields before signing in so your settings can be restored.':'Google sign-in could not start. Check the Google provider setup, or continue as a guest.');}
  finally{setBusy(false);}
 }
 async function signOut(){
  if(!supabase||busy)return;
  setBusy(true);setError('');
  try{const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;setUser(null);}catch{setError('Could not sign out. Please try again.');}finally{setBusy(false);}
 }
 return <Context.Provider value={{client:supabase,user,loading,busy,error,signIn,signOut,configured:Boolean(supabase),registerBeforeSignIn}}>{children}</Context.Provider>;
}
export function useAuth(){return useContext(Context);}
export default function AccountControls(){
 const auth=useAuth();
 return <div className="account-controls">{auth.user?<><span>Signed in{auth.user.email?` · ${auth.user.email}`:''}</span><button type="button" onClick={auth.signOut} disabled={auth.busy}>Sign out</button></>:<button type="button" onClick={auth.signIn} disabled={!auth.configured||auth.loading||auth.busy}>{auth.loading?'Checking account…':auth.busy?'Opening Google…':'Sign in with Google'}</button>}{!auth.user&&<small>{auth.configured?'Optional · play as a guest with JSON files':'Guest mode · cloud sign-in is not configured'}</small>}{auth.error&&<p role="alert" className="alert">{auth.error}</p>}</div>;
}
