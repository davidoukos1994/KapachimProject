/* Kapachim Project v9 — απλή κοινή online αποθήκη Supabase
   Χωρίς Realtime, polling ή συνεχείς ελέγχους.
   Φόρτωση μία φορά στην εκκίνηση και χειροκίνητα με «Ανανέωση».
   Κάθε αποθήκευση/φωτογραφία γράφεται άμεσα online. */
const SUPABASE_URL='https://bvseqstpqdzferqzbsgf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_XsRZNuMARbmE4UROxzvuaQ_hfOv8nPS';
const STORAGE_BUCKET='manual-media';
const APP_VERSION='v11';

const diagnostics={
  projectUrl:SUPABASE_URL,
  schemaVersion:'Schema v5',
  apiLabel:'Αναμονή',
  realtimeLabel:'Απενεργοποιημένο (απλή online αποθήκη)',
  lastSyncLabel:localStorage.getItem('kapachim.lastSave.v11')||'Δεν έχει γίνει',
  loadState:'Αναμονή',
  lastMessage:'',
  latencyLabel:'—'
};
window.getSupabaseDiagnostics=()=>({...diagnostics});
window.isAdminMode=()=>true;
window.showAdminDialog=()=>{};

function setSyncStatus(mode,text){
  diagnostics.loadState=mode;
  diagnostics.lastMessage=text;
  document.querySelectorAll('#syncStatus,#syncStatusMobile').forEach(el=>{
    el.className=`sync-status ${el.id==='syncStatusMobile'?'mobile-sync ':''}${mode}`;
    el.textContent=text;
  });
}
window.setKapachimSyncStatus=setSyncStatus;

function markSaved(message='Αποθηκεύτηκε online'){
  diagnostics.apiLabel='🟢 Συνδεδεμένο';
  diagnostics.lastSyncLabel=new Date().toLocaleString('el-GR');
  diagnostics.lastMessage=message;
  localStorage.setItem('kapachim.lastSave.v11',diagnostics.lastSyncLabel);
  setSyncStatus('online',`● ${message}`);
}

if(!window.supabase){
  setSyncStatus('error','● Δεν φορτώθηκε το Supabase');
  throw new Error('Supabase library missing');
}

const supabaseClient=window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}
);
window.kapachimSupabase=supabaseClient;

function apiHeaders(extra={}){
  return {apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${SUPABASE_PUBLISHABLE_KEY}`,Accept:'application/json',...extra};
}

async function request(path,{timeout=25000,...options}={}){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),timeout);
  try{
    const response=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
      cache:'no-store',
      ...options,
      headers:apiHeaders(options.headers||{}),
      signal:ctrl.signal
    });
    const raw=await response.text();
    if(!response.ok)throw new Error(`Supabase ${response.status}: ${raw.slice(0,400)}`);
    if(!raw)return null;
    try{return JSON.parse(raw)}catch{return raw}
  } finally { clearTimeout(timer); }
}

async function rpc(name,args={}){
  return request(`rpc/${name}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(args)});
}

async function healthCheck(update=true){
  const started=performance.now();
  if(!navigator.onLine){
    diagnostics.apiLabel='🔴 Χωρίς Internet';
    if(update)setSyncStatus('error','● Χωρίς Internet');
    return false;
  }
  if(update)setSyncStatus('syncing','● Έλεγχος online αποθήκης…');
  try{
    await rpc('kapachim_ping');
    diagnostics.latencyLabel=`${Math.round(performance.now()-started)} ms`;
    diagnostics.apiLabel='🟢 Συνδεδεμένο';
    if(update)setSyncStatus('online','● Online αποθήκη έτοιμη');
    return true;
  }catch(error){
    diagnostics.apiLabel='🔴 Σφάλμα Supabase';
    diagnostics.lastMessage=error.message;
    if(update)setSyncStatus('error','● Δεν συνδέθηκε στο Supabase');
    return false;
  }
}
window.runSupabaseHealthCheck=healthCheck;

function dataUrlToBlob(dataUrl){
  const [header,payload]=String(dataUrl).split(',');
  const mime=(header.match(/data:([^;]+)/)||[])[1]||'image/jpeg';
  return new Blob([Uint8Array.from(atob(payload||''),c=>c.charCodeAt(0))],{type:mime});
}
function safeName(name='photo.jpg'){
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'photo.jpg';
}
function photoUrl(path,id){
  const publicUrl=supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  return `${publicUrl}?id=${encodeURIComponent(id)}&v=${Date.now()}`;
}

let writeQueue=Promise.resolve();
function queued(task){
  const result=writeQueue.then(task,task);
  writeQueue=result.catch(()=>{});
  return result;
}

async function addNote(value){
  const rows=await request('manual_notes?select=id',{
    method:'POST',
    headers:{'Content-Type':'application/json','Prefer':'return=representation'},
    body:JSON.stringify({section:String(value.section||'general'),title:String(value.title||'Σημείωση'),body:String(value.body||'')})
  });
  return rows?.[0]?.id;
}

async function addPhoto(value){
  if(!value?.data)throw new Error('Δεν βρέθηκε εικόνα.');
  const blob=dataUrlToBlob(value.data);
  const section=String(value.section||'general');
  const category=String(value.category||'external');
  const name=safeName(value.name||`photo-${Date.now()}.jpg`);
  const uid=crypto.randomUUID?.()||Math.random().toString(36).slice(2);
  const path=`${section}/${category}/${Date.now()}-${uid}-${name}`;

  const {error:uploadError}=await supabaseClient.storage.from(STORAGE_BUCKET).upload(path,blob,{contentType:blob.type,cacheControl:'0',upsert:false});
  if(uploadError)throw uploadError;

  try{
    const rows=await request('manual_photos?select=id',{
      method:'POST',
      headers:{'Content-Type':'application/json','Prefer':'return=representation'},
      body:JSON.stringify({section,category,storage_path:path,name})
    });
    return rows?.[0]?.id;
  }catch(error){
    await supabaseClient.storage.from(STORAGE_BUCKET).remove([path]);
    throw error;
  }
}

async function cloudGet(store,section){
  if(store==='notes'){
    const rows=await request(`manual_notes?select=*&section=eq.${encodeURIComponent(section)}&order=created_at.asc`);
    return (rows||[]).map(x=>({...x,createdAt:new Date(x.created_at).getTime()}));
  }
  if(store==='photos'){
    const rows=await request(`manual_photos?select=*&section=eq.${encodeURIComponent(section)}&order=created_at.asc`);
    return (rows||[]).map(x=>({...x,data:photoUrl(x.storage_path,x.id),createdAt:new Date(x.created_at).getTime()}));
  }
  return [];
}

async function deletePhoto(id){
  const result=await rpc('kapachim_delete_photo',{p_id:String(id)});
  const path=Array.isArray(result)?result[0]:result;
  const verify=await request(`manual_photos?select=id&id=eq.${encodeURIComponent(id)}&limit=1`);
  if(verify?.length)throw new Error('Η φωτογραφία παραμένει στη βάση.');
  if(path){
    const {error}=await supabaseClient.storage.from(STORAGE_BUCKET).remove([String(path)]);
    if(error)throw new Error(`Η εγγραφή διαγράφηκε, αλλά το αρχείο εικόνας όχι: ${error.message}`);
  }
  return true;
}

async function deleteNote(id){
  await rpc('kapachim_delete_note',{p_id:String(id)});
  const verify=await request(`manual_notes?select=id&id=eq.${encodeURIComponent(id)}&limit=1`);
  if(verify?.length)throw new Error('Το κείμενο δεν διαγράφηκε από τη βάση.');
}

dbAdd=(store,value)=>queued(async()=>{
  setSyncStatus('syncing',store==='photos'?'● Ανέβασμα φωτογραφίας…':'● Αποθήκευση…');
  try{
    const id=store==='photos'?await addPhoto(value):await addNote(value);
    markSaved(store==='photos'?'Η φωτογραφία αποθηκεύτηκε online':'Αποθηκεύτηκε online');
    return id;
  }catch(error){
    setSyncStatus('error','● Αποτυχία αποθήκευσης');
    alert(`Η αλλαγή δεν αποθηκεύτηκε online.\n${error.message}`);
    throw error;
  }
});

dbGetBySection=(store,section)=>cloudGet(store,section);
dbGetNotes=section=>cloudGet('notes',section);
dbGetPhotos=section=>cloudGet('photos',section);

dbDelete=(store,id)=>queued(async()=>{
  setSyncStatus('syncing','● Διαγραφή…');
  try{
    if(store==='photos')await deletePhoto(id); else await deleteNote(id);
    markSaved('Η διαγραφή αποθηκεύτηκε online');
    return true;
  }catch(error){
    setSyncStatus('error','● Αποτυχία διαγραφής');
    alert(`Η διαγραφή δεν ολοκληρώθηκε.\n${error.message}`);
    throw error;
  }
});

const localSaveSections=saveSections;
const localSaveDocs=saveDocs;
let loading=false;
let writing=false;
let stateTimer=null;

async function pushState(){
  if(loading)return false;
  writing=true;
  setSyncStatus('syncing','● Αποθήκευση αλλαγών…');
  try{
    await rpc('kapachim_save_state',{p_sections:sections,p_docs:docs});
    markSaved('Οι αλλαγές αποθηκεύτηκαν online');
    return true;
  }finally{
    writing=false;
  }
}

function schedulePush(){
  clearTimeout(stateTimer);
  stateTimer=setTimeout(()=>queued(pushState).catch(error=>{
    setSyncStatus('error','● Αποτυχία αποθήκευσης');
    alert(`Δεν αποθηκεύτηκαν οι αλλαγές.\n${error.message}`);
  }),120);
}

saveSections=function(){localSaveSections();schedulePush();};
saveDocs=function(){localSaveDocs();schedulePush();};
window.flushKapachimSync=()=>queued(pushState);

async function loadState({keepSection=true}={}){
  if(loading||writing)return false;
  loading=true;
  const sectionId=currentSection?.id;
  const docId=currentDoc?.id;
  setSyncStatus('syncing','● Φόρτωση από online αποθήκη…');
  try{
    const result=await rpc('kapachim_get_state');
    const data=Array.isArray(result)?result[0]:result;
    if(data?.sections?.length||data?.docs?.length){
      if(data.sections?.length)sections=data.sections;
      if(data.docs?.length)docs=data.docs;
      currentDoc=docs.find(d=>d.id===docId)||docs[0];
      localSaveSections();
      localSaveDocs();
    }else{
      await pushState();
    }
    buildNav(document.querySelector('#searchInput')?.value||'');
    if(keepSection&&sectionId)selectSection(sections.find(s=>s.id===sectionId)||homeSection);
    markSaved('Φορτώθηκαν τα τελευταία online δεδομένα');
    return true;
  }catch(error){
    diagnostics.lastMessage=error.message;
    setSyncStatus('error','● Αποτυχία online φόρτωσης');
    return false;
  }finally{
    loading=false;
  }
}
window.reloadKapachimCloudState=loadState;
window.automaticKapachimConnect=({reload=true}={})=>reload?loadState({keepSection:true}):healthCheck(true);

async function boot(){
  try{
    if('serviceWorker' in navigator){
      const registrations=await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r=>r.unregister()));
    }
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }catch{}

  // Μία μόνο online φόρτωση κατά την εκκίνηση. Καμία συνεχή επανάληψη.
  await loadState({keepSection:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
