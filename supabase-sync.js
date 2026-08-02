/* Kapachim Project v8 — Supabase sync + Storage API deletion */
const SUPABASE_URL='https://bvseqstpqdzferqzbsgf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_XsRZNuMARbmE4UROxzvuaQ_hfOv8nPS';
const STORAGE_BUCKET='manual-media';
const CLOUD_STATE_ID='main';
const APP_VERSION='v8';
const diagnostics={projectUrl:SUPABASE_URL,schemaVersion:'Schema v5',apiLabel:'Έλεγχος…',realtimeLabel:'Αναμονή',lastSyncLabel:localStorage.getItem('kapachim.lastSync.v8')||'Δεν έχει γίνει',loadState:'Εκκίνηση',lastMessage:'',latencyLabel:'—'};
window.getSupabaseDiagnostics=()=>({...diagnostics});window.isAdminMode=()=>true;window.showAdminDialog=()=>{};
function setSyncStatus(mode,text){diagnostics.loadState=mode;diagnostics.lastMessage=text;document.querySelectorAll('#syncStatus,#syncStatusMobile').forEach(el=>{el.className=`sync-status ${el.id==='syncStatusMobile'?'mobile-sync ':''}${mode}`;el.textContent=text})}
window.setKapachimSyncStatus=setSyncStatus;
function markSynced(message='Online · Συγχρονισμένο'){diagnostics.apiLabel='🟢 Συνδεδεμένο';diagnostics.lastSyncLabel=new Date().toLocaleString('el-GR');diagnostics.lastMessage=message;localStorage.setItem('kapachim.lastSync.v8',diagnostics.lastSyncLabel);setSyncStatus('online','● Online · Συγχρονισμένο')}
if(!window.supabase){setSyncStatus('error','● Δεν φορτώθηκε το Supabase');throw new Error('Supabase library missing')}
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:5}}});window.kapachimSupabase=supabaseClient;
function apiHeaders(extra={}){return{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${SUPABASE_PUBLISHABLE_KEY}`,Accept:'application/json',...extra}}
async function request(path,{timeout=25000,...options}={}){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),timeout);try{const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{cache:'no-store',...options,headers:apiHeaders(options.headers||{}),signal:ctrl.signal});const raw=await r.text();if(!r.ok)throw new Error(`Supabase ${r.status}: ${raw.slice(0,400)}`);if(!raw)return null;try{return JSON.parse(raw)}catch{return raw}}finally{clearTimeout(timer)}}
async function rpc(name,args={}){return request(`rpc/${name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)})}
async function healthCheck(update=true){const t=performance.now();if(!navigator.onLine){if(update)setSyncStatus('error','● Χωρίς Internet');return false}if(update)setSyncStatus('syncing','● Σύνδεση με Supabase…');try{await rpc('kapachim_ping');diagnostics.latencyLabel=`${Math.round(performance.now()-t)} ms`;markSynced();return true}catch(e){diagnostics.apiLabel='🟠 Επανασύνδεση';diagnostics.lastMessage=e.message;if(update)setSyncStatus('syncing','● Αυτόματη επανασύνδεση…');return false}}
window.runSupabaseHealthCheck=healthCheck;
function dataUrlToBlob(dataUrl){const [h,p]=String(dataUrl).split(',');const mime=(h.match(/data:([^;]+)/)||[])[1]||'image/jpeg';return new Blob([Uint8Array.from(atob(p||''),c=>c.charCodeAt(0))],{type:mime})}
function safeName(n='photo.jpg'){return String(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'photo.jpg'}
function photoUrl(path,id){const u=supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;return `${u}?id=${encodeURIComponent(id)}&t=${Date.now()}`}
let writeQueue=Promise.resolve();function queued(task){const r=writeQueue.then(task,task);writeQueue=r.catch(()=>{});return r}
async function addNote(v){const rows=await request('manual_notes?select=id',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify({section:String(v.section||'general'),title:String(v.title||'Σημείωση'),body:String(v.body||'')})});return rows?.[0]?.id}
async function addPhoto(v){if(!v?.data)throw new Error('Δεν βρέθηκε εικόνα.');const blob=dataUrlToBlob(v.data),section=String(v.section||'general'),category=String(v.category||'external'),name=safeName(v.name||`photo-${Date.now()}.jpg`),uid=crypto.randomUUID?.()||Math.random().toString(36).slice(2),path=`${section}/${category}/${Date.now()}-${uid}-${name}`;const {error}=await supabaseClient.storage.from(STORAGE_BUCKET).upload(path,blob,{contentType:blob.type,cacheControl:'0',upsert:false});if(error)throw error;try{const rows=await request('manual_photos?select=id',{method:'POST',headers:{'Content-Type':'application/json','Prefer':'return=representation'},body:JSON.stringify({section,category,storage_path:path,name})});return rows?.[0]?.id}catch(e){await supabaseClient.storage.from(STORAGE_BUCKET).remove([path]);throw e}}
async function cloudGet(store,section){if(store==='notes'){const r=await request(`manual_notes?select=*&section=eq.${encodeURIComponent(section)}&order=created_at.asc`);return(r||[]).map(x=>({...x,createdAt:new Date(x.created_at).getTime()}))}if(store==='photos'){const r=await request(`manual_photos?select=*&section=eq.${encodeURIComponent(section)}&order=created_at.asc`);return(r||[]).map(x=>({...x,data:photoUrl(x.storage_path,x.id),createdAt:new Date(x.created_at).getTime()}))}return[]}
async function deletePhoto(id){
 // Η βάση διαγράφεται από SECURITY DEFINER RPC ώστε να μην εξαρτάται από browser RLS quirks.
 const result=await rpc('kapachim_delete_photo',{p_id:String(id)});
 const path=Array.isArray(result)?result[0]:result;
 const verify=await request(`manual_photos?select=id&id=eq.${encodeURIComponent(id)}&limit=1`);
 if(verify?.length)throw new Error('Η εγγραφή της φωτογραφίας παραμένει στη βάση.');
 // Το πραγματικό αρχείο διαγράφεται αποκλειστικά μέσω Storage API (όχι με SQL).
 if(path){
   const {error}=await supabaseClient.storage.from(STORAGE_BUCKET).remove([String(path)]);
   if(error)throw new Error(`Η εγγραφή διαγράφηκε, αλλά το αρχείο Storage όχι: ${error.message}`);
 }
 return true;
}
async function deleteNote(id){await rpc('kapachim_delete_note',{p_id:String(id)});const verify=await request(`manual_notes?select=id&id=eq.${encodeURIComponent(id)}&limit=1`);if(verify?.length)throw new Error('Το κείμενο δεν διαγράφηκε από τη βάση.')}
dbAdd=(store,v)=>queued(async()=>{setSyncStatus('syncing',store==='photos'?'● Ανέβασμα φωτογραφίας…':'● Αποθήκευση online…');try{const id=store==='photos'?await addPhoto(v):await addNote(v);markSynced();return id}catch(e){setSyncStatus('error','● Σφάλμα αποθήκευσης');alert(`Η αλλαγή δεν αποθηκεύτηκε online.\n${e.message}`);throw e}});
dbGetBySection=async(store,section)=>cloudGet(store,section);dbGetNotes=s=>cloudGet('notes',s);dbGetPhotos=s=>cloudGet('photos',s);
dbDelete=(store,id)=>queued(async()=>{setSyncStatus('syncing','● Διαγραφή online…');try{store==='photos'?await deletePhoto(id):await deleteNote(id);markSynced('Η διαγραφή ολοκληρώθηκε.');return true}catch(e){setSyncStatus('error','● Σφάλμα διαγραφής');alert(`Η διαγραφή δεν ολοκληρώθηκε.\n${e.message}`);throw e}});
const localSaveSections=saveSections,localSaveDocs=saveDocs;let loading=false,writing=false,stateTimer=null;
async function pushState(){if(loading)return;writing=true;try{await rpc('kapachim_save_state',{p_sections:sections,p_docs:docs});markSynced('Οι αλλαγές αποθηκεύτηκαν online.')}finally{writing=false}}
function schedulePush(){clearTimeout(stateTimer);stateTimer=setTimeout(()=>queued(pushState).catch(e=>{setSyncStatus('error','● Σφάλμα αποθήκευσης');alert(`Δεν αποθηκεύτηκαν οι αλλαγές.\n${e.message}`)}),350)}
saveSections=function(){localSaveSections();schedulePush()};saveDocs=function(){localSaveDocs();schedulePush()};window.flushKapachimSync=()=>queued(pushState);
async function loadState({keepSection=true}={}){if(loading||writing)return false;loading=true;const sid=currentSection?.id,did=currentDoc?.id;setSyncStatus('syncing','● Φόρτωση online…');try{const result=await rpc('kapachim_get_state');const data=Array.isArray(result)?result[0]:result;if(data?.sections?.length||data?.docs?.length){if(data.sections?.length)sections=data.sections;if(data.docs?.length)docs=data.docs;currentDoc=docs.find(d=>d.id===did)||docs[0];localSaveSections();localSaveDocs()}else await pushState();buildNav(document.querySelector('#searchInput')?.value||'');if(keepSection&&sid)selectSection(sections.find(s=>s.id===sid)||homeSection);markSynced('Online δεδομένα φορτώθηκαν.');return true}finally{loading=false}}
window.reloadKapachimCloudState=loadState;
let retryTimer=null,retries=0,lastOk=0;function retry(){clearTimeout(retryTimer);retryTimer=setTimeout(()=>connect(true),Math.min(20000,1000*Math.pow(1.45,retries++)))}
async function connect(reload=true){if(!navigator.onLine){setSyncStatus('error','● Χωρίς Internet');retry();return false}try{reload?await loadState({keepSection:true}):await healthCheck(false);retries=0;lastOk=Date.now();markSynced();return true}catch(e){diagnostics.lastMessage=e.message;setSyncStatus('syncing','● Αυτόματη επανασύνδεση…');retry();return false}}
window.automaticKapachimConnect=({reload=true}={})=>connect(reload);
function realtime(){supabaseClient.channel('kapachim-v8').on('postgres_changes',{event:'*',schema:'public',table:'manual_app_state'},()=>{if(!writing)setTimeout(()=>loadState({keepSection:true}),250)}).on('postgres_changes',{event:'*',schema:'public',table:'manual_notes'},()=>renderContent()).on('postgres_changes',{event:'*',schema:'public',table:'manual_photos'},()=>renderContent()).subscribe(s=>diagnostics.realtimeLabel=s==='SUBSCRIBED'?'🟢 Ενεργό':s)}
async function boot(){
 try{
  if('serviceWorker'in navigator){const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister()))}
  if('caches'in window){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}
 }catch(e){}
 realtime();
 // Πρώτη φόρτωση αμέσως και επανάληψη χωρίς χειροκίνητο κουμπί.
 await connect(true);
 setTimeout(()=>connect(true),1500);
 setInterval(()=>connect(false),15000);
 setInterval(()=>{if(!document.hidden&&!writing&&!loading)loadState({keepSection:true}).catch(()=>{})},60000);
}
window.addEventListener('online',()=>connect(true));window.addEventListener('offline',()=>setSyncStatus('error','● Χωρίς Internet'));window.addEventListener('pageshow',()=>connect(true));window.addEventListener('focus',()=>{if(Date.now()-lastOk>10000)connect(true)});document.addEventListener('visibilitychange',()=>{if(!document.hidden)connect(true)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
