import {validateMission,MAX_FILE_BYTES} from './missionStorage.js';
const same=(a,b)=>JSON.stringify(Object.entries(a||{}).sort())===JSON.stringify(Object.entries(b||{}).sort());
export function canSaveEvaluatedMission(scenario,result){return Boolean(result?.request&&same(scenario,result.request));}
function requireAccount(client,user){if(!client||!user?.id)throw new Error('Sign in with Google to save a mission to your account.');}
function checkedDocument(document,context){
 const checked=validateMission(document,context);
 if(new TextEncoder().encode(JSON.stringify(checked)).length>MAX_FILE_BYTES)throw new Error('Mission is too large to save. Export a JSON backup instead.');
 return checked;
}
function failure(error){
 if(error?.code==='42P01'||error?.code==='PGRST205')return new Error('Cloud mission storage is not set up yet. Run the Supabase migration, then try again.');
 return new Error('Cloud save or load failed. Your current mission is still open; you can export JSON and retry.');
}
export async function listCloudMissions(client,user){
 requireAccount(client,user);
 const {data,error}=await client.from('missions').select('id,document,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(100);
 if(error)throw failure(error);
 return data||[];
}
export async function saveCloudMission(client,user,document,context,id=null){
 requireAccount(client,user);const checked=checkedDocument(document,context);
 const values={user_id:user.id,document:checked,updated_at:new Date().toISOString()};
 const query=id?client.from('missions').update(values).eq('id',id).eq('user_id',user.id):client.from('missions').insert(values);
 const {data,error}=await query.select('id,document,updated_at').single();
 if(error||!data)throw failure(error);
 return {...data,document:checkedDocument(data.document,context)};
}
export async function deleteCloudMission(client,user,id){
 requireAccount(client,user);
 const {data,error}=await client.from('missions').delete().eq('id',id).eq('user_id',user.id).select('id').single();
 if(error||!data)throw failure(error);
}
