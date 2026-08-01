/* KapaChim Project v5 — αξιόπιστος συγχρονισμός Supabase */
const SUPABASE_URL = 'https://bvseqstpqdzferqzbsgf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XsRZNuMARbmE4UROxzvuaQ_hfOv8nPS';
const STORAGE_BUCKET = 'manual-media';
const CLOUD_STATE_ID = 'main';
const APP_VERSION = 'v5.0';

const diagnostics = {
  projectUrl: SUPABASE_URL,
  schemaVersion: 'Schema v3',
  apiLabel: 'Έλεγχος…',
  realtimeLabel: 'Αναμονή',
  lastSyncLabel: localStorage.getItem('kapachim.lastSync.v5') || 'Δεν έχει γίνει',
  loadState: 'Εκκίνηση',
  lastMessage: '',
  latencyLabel: '—'
};
window.getSupabaseDiagnostics = () => ({ ...diagnostics });
window.isAdminMode = () => true;
window.showAdminDialog = () => {};

function setSyncStatus(mode, text) {
  diagnostics.loadState = mode;
  diagnostics.lastMessage = text;
  document.querySelectorAll('#syncStatus, #syncStatusMobile').forEach(el => {
    el.className = `sync-status ${el.id === 'syncStatusMobile' ? 'mobile-sync ' : ''}${mode}`;
    el.textContent = text;
  });
}
window.setKapachimSyncStatus = setSyncStatus;

function markSynced(message='Online · Συγχρονισμένο') {
  diagnostics.apiLabel = '🟢 Συνδεδεμένο';
  diagnostics.lastSyncLabel = new Date().toLocaleString('el-GR');
  diagnostics.lastMessage = message;
  localStorage.setItem('kapachim.lastSync.v5', diagnostics.lastSyncLabel);
  setSyncStatus('online', '● Online · Συγχρονισμένο');
}

function timeout(ms, message='Η σύνδεση καθυστέρησε.') {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}
function withTimeout(promise, ms=20000, message) { return Promise.race([promise, timeout(ms, message)]); }

if (!window.supabase) {
  diagnostics.apiLabel = '🔴 Δεν φορτώθηκε η βιβλιοθήκη';
  setSyncStatus('error', '● Σφάλμα Supabase');
  throw new Error('Η βιβλιοθήκη Supabase δεν φορτώθηκε.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: { params: { eventsPerSecond: 5 } },
  global: { headers: { 'x-client-info': 'kapachim-project-v5' } }
});
window.kapachimSupabase = supabaseClient;

function headers(extra={}) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    Accept: 'application/json',
    ...extra
  };
}

async function rest(path, options={}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 22000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      cache: 'no-store',
      ...options,
      headers: headers(options.headers || {}),
      signal: controller.signal
    });
    const raw = await response.text();
    if (!response.ok) throw new Error(`Supabase ${response.status}: ${raw.slice(0,250)}`);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  } finally { clearTimeout(timer); }
}

async function healthCheck(updateBadge=true) {
  const started = performance.now();
  if (!navigator.onLine) {
    diagnostics.apiLabel = '🔴 Χωρίς Internet';
    if (updateBadge) setSyncStatus('error','● Χωρίς Internet');
    return false;
  }
  if (updateBadge) setSyncStatus('syncing','● Σύνδεση με Supabase…');
  try {
    await rest('manual_app_state?select=id&id=eq.main&limit=1');
    diagnostics.latencyLabel = `${Math.round(performance.now()-started)} ms`;
    markSynced('Ο έλεγχος σύνδεσης ολοκληρώθηκε.');
    return true;
  } catch (error) {
    diagnostics.apiLabel = '🟠 Επανασύνδεση';
    diagnostics.lastMessage = error.message;
    if (updateBadge) setSyncStatus('syncing','● Αυτόματη επανασύνδεση…');
    return false;
  }
}
window.runSupabaseHealthCheck = healthCheck;

function publicPhotoUrl(path) {
  return path ? supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl : '';
}
function dataUrlToBlob(dataUrl) {
  const [header,payload] = String(dataUrl).split(',');
  const mime = (header.match(/data:([^;]+)/)||[])[1] || 'image/jpeg';
  const bytes = Uint8Array.from(atob(payload||''), c=>c.charCodeAt(0));
  return new Blob([bytes], {type:mime});
}
function safeFileName(name='photo.jpg') {
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'photo.jpg';
}

let writeQueue = Promise.resolve();
function queueWrite(task) {
  const run = writeQueue.then(task,task);
  writeQueue = run.catch(()=>{});
  return run;
}

async function addNote(value) {
  const rows = await rest('manual_notes?select=id', {
    method:'POST',
    headers:{'Content-Type':'application/json','Prefer':'return=representation'},
    body:JSON.stringify({section:String(value.section||'general'),title:String(value.title||'Σημείωση'),body:String(value.body||'')})
  });
  return rows?.[0]?.id;
}

async function addPhoto(value) {
  if (!value?.data) throw new Error('Δεν βρέθηκαν δεδομένα εικόνας.');
  const blob = dataUrlToBlob(value.data);
  const filename = safeFileName(value.name || `photo-${Date.now()}.jpg`);
  const section = String(value.section||'general');
  const category = String(value.category||'external');
  const uid = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
  const storagePath = `${section}/${category}/${Date.now()}-${uid}-${filename}`;
  const {error:uploadError} = await withTimeout(supabaseClient.storage.from(STORAGE_BUCKET).upload(storagePath,blob,{contentType:blob.type||'image/jpeg',cacheControl:'3600',upsert:false}),50000);
  if (uploadError) throw uploadError;
  try {
    const rows = await rest('manual_photos?select=id', {
      method:'POST',
      headers:{'Content-Type':'application/json','Prefer':'return=representation'},
      body:JSON.stringify({section,category,storage_path:storagePath,name:filename})
    });
    return rows?.[0]?.id;
  } catch (error) {
    await supabaseClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw error;
  }
}

async function cloudGet(store,section) {
  if (store==='notes') {
    const rows = await rest(`manual_notes?select=*&section=eq.${encodeURIComponent(section)}&order=created_at.asc`);
    return (rows||[]).map(r=>({...r,createdAt:new Date(r.created_at).getTime()}));
  }
  if (store==='photos') {
    const rows = await rest(`manual_photos?select=*&section=eq.${encodeURIComponent(section)}&order=created_at.asc`);
    return (rows||[]).map(r=>({...r,data:`${publicPhotoUrl(r.storage_path)}?v=${encodeURIComponent(r.id)}-${Date.now()}`,createdAt:new Date(r.created_at).getTime()}));
  }
  return [];
}

async function deletePhoto(id) {
  const photoId = String(id||'').trim();
  if (!photoId) throw new Error('Δεν βρέθηκε το ID της φωτογραφίας.');
  const found = await rest(`manual_photos?select=id,storage_path&id=eq.${encodeURIComponent(photoId)}&limit=1`);
  if (!found?.length) return;
  const storagePath = found[0].storage_path;
  const deleted = await rest(`manual_photos?id=eq.${encodeURIComponent(photoId)}&select=id,storage_path`, {
    method:'DELETE', headers:{'Prefer':'return=representation'}
  });
  if (!deleted?.length) throw new Error('Η βάση δεν επιβεβαίωσε τη διαγραφή της φωτογραφίας.');
  const verify = await rest(`manual_photos?select=id&id=eq.${encodeURIComponent(photoId)}&limit=1`);
  if (verify?.length) throw new Error('Η φωτογραφία παραμένει στη βάση μετά τη διαγραφή.');
  if (storagePath) {
    const {error} = await withTimeout(supabaseClient.storage.from(STORAGE_BUCKET).remove([storagePath]),25000);
    if (error) console.warn('Η εγγραφή διαγράφηκε αλλά απέτυχε η διαγραφή του αρχείου Storage:',error);
  }
}

async function cloudDelete(store,id) {
  if (store==='photos') return deletePhoto(id);
  if (store==='notes') {
    const rows = await rest(`manual_notes?id=eq.${encodeURIComponent(id)}&select=id`, {method:'DELETE',headers:{'Prefer':'return=representation'}});
    if (!rows?.length) throw new Error('Η διαγραφή του κειμένου δεν επιβεβαιώθηκε.');
    return;
  }
  throw new Error('Μη υποστηριζόμενος τύπος δεδομένων.');
}

// Αντικατάσταση του τοπικού IndexedDB με online λειτουργίες.
dbAdd = function(store,value) {
  return queueWrite(async()=>{
    setSyncStatus('syncing',store==='photos'?'● Ανέβασμα φωτογραφίας…':'● Αποθήκευση online…');
    try {
      const id = store==='photos' ? await addPhoto(value) : await addNote(value);
      markSynced(store==='photos'?'Η φωτογραφία αποθηκεύτηκε online.':'Το κείμενο αποθηκεύτηκε online.');
      return id;
    } catch(error) {
      setSyncStatus('error','● Σφάλμα αποθήκευσης');
      alert(`Η αλλαγή δεν αποθηκεύτηκε online.\n${error.message}`);
      throw error;
    }
  });
};
dbGetBySection = async (store,section)=>{
  try { const rows=await cloudGet(store,section); diagnostics.apiLabel='🟢 Συνδεδεμένο'; return rows; }
  catch(error){ diagnostics.lastMessage=error.message; setSyncStatus('syncing','● Αυτόματη επανασύνδεση…'); throw error; }
};
dbGetNotes = section=>dbGetBySection('notes',section);
dbGetPhotos = section=>dbGetBySection('photos',section);
dbDelete = function(store,id) {
  return queueWrite(async()=>{
    setSyncStatus('syncing','● Διαγραφή online…');
    try { await cloudDelete(store,id); markSynced('Η διαγραφή ολοκληρώθηκε online.'); }
    catch(error){ setSyncStatus('error','● Σφάλμα διαγραφής'); alert(`Η διαγραφή δεν ολοκληρώθηκε.\n${error.message}`); throw error; }
  });
};

const originalSaveSections = saveSections;
const originalSaveDocs = saveDocs;
let loadingCloud=false, writingState=false, stateTimer=null, realtimeRefreshTimer=null;

async function pushState() {
  if (loadingCloud) return;
  writingState=true;
  try {
    await rest('manual_app_state?on_conflict=id', {
      method:'POST',
      headers:{'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({id:CLOUD_STATE_ID,sections,docs,updated_at:new Date().toISOString()})
    });
    markSynced('Τομείς και έγγραφα αποθηκεύτηκαν online.');
  } finally { writingState=false; }
}
function scheduleStatePush(){clearTimeout(stateTimer);stateTimer=setTimeout(()=>queueWrite(pushState).catch(error=>{setSyncStatus('error','● Η αλλαγή δεν αποθηκεύτηκε');alert(`Η αλλαγή δεν αποθηκεύτηκε στο Supabase.\n${error.message}`)}),500)}
saveSections=function(){originalSaveSections();scheduleStatePush();};
saveDocs=function(){originalSaveDocs();scheduleStatePush();};
window.flushKapachimSync=()=>queueWrite(pushState);

async function loadState({keepSection=true}={}) {
  if (loadingCloud||writingState) return false;
  loadingCloud=true;
  const previousSection=currentSection?.id, previousDoc=currentDoc?.id;
  setSyncStatus('syncing','● Φόρτωση online…');
  try {
    const rows = await rest('manual_app_state?select=sections,docs,updated_at&id=eq.main&limit=1');
    const data=rows?.[0];
    if (data?.sections?.length || data?.docs?.length) {
      if (data.sections?.length) sections=data.sections;
      if (data.docs?.length) docs=data.docs;
      currentDoc=docs.find(d=>d.id===previousDoc)||docs[0];
      originalSaveSections(); originalSaveDocs();
    } else await pushState();
    buildNav(document.querySelector('#searchInput')?.value||'');
    if (keepSection && previousSection) selectSection(sections.find(s=>s.id===previousSection)||homeSection); else selectSection(homeSection);
    markSynced('Online δεδομένα φορτώθηκαν.');
    return true;
  } finally { loadingCloud=false; }
}
window.reloadKapachimCloudState=loadState;

let retryTimer=null, retryCount=0, lastSuccessfulCheck=0;
function scheduleRetry(){clearTimeout(retryTimer);const delay=Math.min(30000,1500*Math.pow(1.55,retryCount++));retryTimer=setTimeout(()=>connectAndLoad(false),delay)}
async function connectAndLoad(fullReload=true) {
  if (!navigator.onLine){setSyncStatus('error','● Χωρίς Internet');scheduleRetry();return false;}
  try {
    if(fullReload) await loadState({keepSection:true}); else await healthCheck(false);
    retryCount=0; lastSuccessfulCheck=Date.now(); markSynced('Online · Συγχρονισμένο'); return true;
  } catch(error) {
    diagnostics.lastMessage=error.message; diagnostics.apiLabel='🟠 Επανασύνδεση';
    setSyncStatus('syncing','● Αυτόματη επανασύνδεση…'); scheduleRetry(); return false;
  }
}
window.automaticKapachimConnect=({reload=true}={})=>connectAndLoad(reload);

function startRealtime(){
  supabaseClient.channel('kapachim-v5-live')
   .on('postgres_changes',{event:'*',schema:'public',table:'manual_app_state'},()=>{if(!writingState){clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=setTimeout(()=>loadState({keepSection:true}),500)}})
   .on('postgres_changes',{event:'*',schema:'public',table:'manual_notes'},()=>renderContent())
   .on('postgres_changes',{event:'*',schema:'public',table:'manual_photos'},()=>renderContent())
   .subscribe(status=>{diagnostics.realtimeLabel=status==='SUBSCRIBED'?'🟢 Ενεργό':(status==='CHANNEL_ERROR'||status==='TIMED_OUT'?'🟠 Επανασύνδεση':'Αναμονή')});
}

window.addEventListener('online',()=>connectAndLoad(true));
window.addEventListener('offline',()=>setSyncStatus('error','● Χωρίς Internet'));
window.addEventListener('pageshow',()=>connectAndLoad(true));
window.addEventListener('focus',()=>{if(Date.now()-lastSuccessfulCheck>8000)connectAndLoad(false)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)connectAndLoad(true)});

(async()=>{
  // Καθαρίζει παλιές PWA cache/Service Workers που κρατούσαν κώδικα V3/V4.
  try { if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));} if('caches' in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));} } catch(e){console.warn(e)}
  startRealtime();
  await connectAndLoad(true);
  setInterval(()=>connectAndLoad(false),15000);
  renderContent();
})();
