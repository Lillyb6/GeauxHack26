// Versioned input snapshots only. This module has no network or Gemini dependency.
export const STORAGE_KEY='beyond-earth.missions.v1';
export const MAX_MISSIONS=50;
export const MAX_FILE_BYTES=64*1024;
const FORMAT='beyond-earth-mission';
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
function fail(message){throw new Error(message);}
function exactKeys(value,keys,label){
 if(!plain(value))fail(`${label} must be an object.`);
 if(Object.keys(value).some(key=>!keys.includes(key))||keys.some(key=>!own(value,key)))fail(`${label} has missing or unsupported fields.`);
}
export function missionName(value){
 if(typeof value!=='string'||!value.trim()||value.trim().length>80)fail('Use a mission name between 1 and 80 characters.');
 return value.trim();
}
function validateValue(value,schema,label,schemas){
 if(!plain(schema))fail('The backend input schema is unavailable. Refresh the app.');
 if(schema.$ref){const key=schema.$ref.split('/').at(-1);if(!schemas[key])fail('The backend input schema is unavailable. Refresh the app.');return validateValue(value,schemas[key],label,schemas);}
 if(schema.anyOf){
  for(const choice of schema.anyOf){try{validateValue(value,choice,label,schemas);return;}catch{ /* Try another declared type. */ }}
  fail(`${label} has an invalid value or type.`);
 }
 if(schema.enum&&!schema.enum.includes(value))fail(`${label} is not a supported choice.`);
 if(own(schema,'const')&&value!==schema.const)fail(`${label} has an invalid value.`);
 const type=schema.type;
 if(!['null','boolean','string','number','integer','object'].includes(type))fail('This mission field uses an unsupported schema type. Update the app before loading it.');
 if(type==='null'&&value!==null)fail(`${label} must be null.`);
 if(type==='boolean'&&typeof value!=='boolean')fail(`${label} must be true or false.`);
 if(type==='string'&&typeof value!=='string')fail(`${label} must be text.`);
 if(type==='number'||type==='integer'){
  if(typeof value!=='number'||!Number.isFinite(value)||(type==='integer'&&!Number.isInteger(value)))fail(`${label} must be a finite ${type}.`);
  if((own(schema,'minimum')&&value<schema.minimum)||(own(schema,'maximum')&&value>schema.maximum)||(own(schema,'exclusiveMinimum')&&value<=schema.exclusiveMinimum)||(own(schema,'exclusiveMaximum')&&value>=schema.exclusiveMaximum))fail(`${label} is outside the allowed input range.`);
 }
 if(type==='object'){
  if(!plain(value))fail(`${label} must be an object.`);
  for(const [key,item] of Object.entries(value)){
   if(!own(schema.properties||{},key))fail(`${label} contains unsupported fields.`);
   validateValue(item,schema.properties[key],`${label}.${key}`,schemas);
  }
 }
}
function checkConfig(config,context){
 exactKeys(config,['scenario','search'],'Mission configuration');
 const {defaults,searchDefaults,schemas,equipment}=context;
 if(!schemas?.HabitatRequest?.properties||!schemas?.OptimizationRequest?.properties)fail('Mission input schemas are unavailable. Refresh the app.');
 exactKeys(config.scenario,Object.keys(defaults),'Mission scenario');
 exactKeys(config.search,Object.keys(searchDefaults),'Search settings');
 validateValue(config.scenario,schemas.HabitatRequest,'Mission scenario',schemas);
 for(const [key,value] of Object.entries(config.search))validateValue(value,schemas.OptimizationRequest.properties[key],`Search ${key}`,schemas);
 for(const [key,category] of [['oxygen_equipment_id','oxygen_generation'],['water_equipment_id','water_recovery'],['co2_equipment_id','co2_removal']]){
  const id=config.scenario[key];
  if(id!==null&&!equipment.some(item=>item.id===id&&item.category===category))fail(`The selected ${category.replaceAll('_',' ')} design is not in the current catalog.`);
 }
 return {scenario:Object.fromEntries(Object.keys(defaults).map(key=>[key,config.scenario[key]])),search:Object.fromEntries(Object.keys(searchDefaults).map(key=>[key,config.search[key]]))};
}
function envelope(document){
 exactKeys(document,['format','format_version','model_version','name','saved_at','configuration'],'Mission file');
 if(document.format!==FORMAT||document.format_version!==1)fail('Unsupported mission file format or version.');
 missionName(document.name);
 if(typeof document.model_version!=='string'||!document.model_version||document.model_version.length>40)fail('The mission model version is invalid.');
 if(typeof document.saved_at!=='string'||document.saved_at.length>40||!Number.isFinite(Date.parse(document.saved_at)))fail('The mission save date is invalid.');
 if(!plain(document.configuration))fail('Mission configuration must be an object.');
 return document;
}
export function validateMission(document,context){
 envelope(document);
 if(document.model_version==='0.5.0' && context.modelVersion==='0.6.0'){
  const previous=clone(document);
  for(const key of ['thermal_capacity_enabled','heating_capacity_kw','cooling_capacity_kw']){
   if(own(previous.configuration?.scenario || {},key))fail('Legacy mission contains unexpected thermal fields.');
  }
  exactKeys(previous.configuration.scenario,Object.keys(context.defaults).filter(key=>!['thermal_capacity_enabled','heating_capacity_kw','cooling_capacity_kw'].includes(key)),'Legacy mission scenario');
  previous.configuration.scenario={...previous.configuration.scenario,thermal_capacity_enabled:false,heating_capacity_kw:0,cooling_capacity_kw:0};
  previous.model_version=context.modelVersion;
  return validateMission(previous,context);
 }
 if(document.model_version!==context.modelVersion)fail(`This mission uses model ${document.model_version}; the app uses ${context.modelVersion}. Automatic migration is not supported.`);
 return {...clone(document),name:missionName(document.name),configuration:checkConfig(document.configuration,context)};
}
export function createMission(name,scenario,search,context,now=new Date().toISOString()){
 // Clone only after validation: JSON serialization must not turn NaN/Infinity into null.
 const config=checkConfig({scenario,search},context);
 return validateMission({format:FORMAT,format_version:1,model_version:context.modelVersion,name:missionName(name),saved_at:now,configuration:config},context);
}
export function parseMission(text,context){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_FILE_BYTES)fail('Mission files must be no larger than 64 KB.');
 let parsed;try{parsed=JSON.parse(text);}catch{fail('This is not valid JSON. Choose an exported Beyond Earth mission file.');}
 return validateMission(parsed,context);
}
export function serializeMission(document,context){return JSON.stringify(validateMission(document,context),null,2);}
export function readLibrary(storage){
 let raw;try{raw=storage.getItem(STORAGE_KEY);}catch{fail('Browser storage is unavailable. Enable site storage or use JSON export/import without saving.');}
 if(raw===null)return [];
 try{
  const data=JSON.parse(raw);exactKeys(data,['format_version','missions'],'Saved mission library');
  if(data.format_version!==1||!Array.isArray(data.missions)||data.missions.length>MAX_MISSIONS)fail('Invalid library.');
  const ids=new Set();
  for(const item of data.missions){exactKeys(item,['id','document'],'Saved mission');if(typeof item.id!=='string'||!item.id||item.id.length>100||ids.has(item.id))fail('Invalid saved mission ID.');ids.add(item.id);envelope(item.document);}
  return data.missions;
 }catch{fail('Saved mission data is unreadable or unsupported. Existing browser data has not been changed.');}
}
function writeLibrary(storage,items){
 try{storage.setItem(STORAGE_KEY,JSON.stringify({format_version:1,missions:items}));}
 catch{fail('Could not save changes in this browser. Storage may be full or blocked; existing saves have not been replaced.');}
}
export function uniqueName(name,items){
 const base=missionName(name);let candidate=base;let n=2;
 while(items.some(item=>item.document.name.toLocaleLowerCase()===candidate.toLocaleLowerCase())){const suffix=` (${n++})`;candidate=base.slice(0,80-suffix.length)+suffix;}
 return candidate;
}
export function addMission(storage,document,context,id=crypto.randomUUID()){
 const validated=validateMission(document,context);
 // Re-read before each mutation so a stale tab does not blindly replace a newer list.
 const items=readLibrary(storage);
 if(items.length>=MAX_MISSIONS)fail(`This browser already has ${MAX_MISSIONS} missions. Export or delete one before adding another.`);
 const item={id,document:{...validated,name:uniqueName(validated.name,items)}};
 if(items.some(existing=>existing.id===id))fail('A mission with that ID already exists.');
 const next=[item,...items];writeLibrary(storage,next);return {item,items:next};
}
export function removeMission(storage,id){const items=readLibrary(storage);const next=items.filter(item=>item.id!==id);writeLibrary(storage,next);return next;}
export function filenameFor(name){return `${missionName(name).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'mission'}.json`;}
