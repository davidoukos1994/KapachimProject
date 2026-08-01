/* KapaChim Manual V19 - Supabase online synchronization and diagnostics */
const SUPABASE_URL = 'https://bvseqstpqdzferqzbsgf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XsRZNuMARbmE4UROxzvuaQ_hfOv8nPS';
const STORAGE_BUCKET = 'manual-media';
const CLOUD_STATE_ID = 'main';

const diagnostics={projectUrl:SUPABASE_URL,schemaVersion:'Schema v1',apiLabel:'Έλεγχος…',realtimeLabel:'Αναμονή',lastSyncLabel:localStorage.getItem('kapachim.lastSync.v19')||'Δεν έχει γίνει',loadState:'Εκκίνηση',lastMessage:'',latencyLabel:'—'};
window.getSupabaseDiagnostics=()=>({...diagnostics});
function stampSync(message){const t=new Date();diagnostics.lastSyncLabel=t.toLocaleString('el-GR');diagnostics.lastMessage=message||'Συγχρονισμένο';localStorage.setItem('kapachim.lastSync.v19',diagnostics.lastSyncLabel)}
if(!window.supabase){diagnostics.apiLabel='🔴 Δεν φορτώθηκε η βιβλιοθήκη';diagnostics.loadState='Σφάλμα βιβλιοθήκης';document.querySelectorAll('#syncStatus,#syncStatusMobile').forEach(el=>{el.className='sync-status error'+(el.id==='syncStatusMobile'?' mobile-sync':'');el.textContent='● Σφάλμα φόρτωσης Supabase'});throw new Error('Η βιβλιοθήκη Supabase δεν φορτώθηκε.')}
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global:{headers:{'x-client-info':'kapachim-manual-v19'}}
});

const adminMode = true;
let cloudStateTimer = null;
let cloudStateLoading = false;
let realtimeTimer = null;
const originalSaveSections = saveSections;
const originalSaveDocs = saveDocs;

window.isAdminMode = () => true;

function setSyncStatus(mode, text) {
  diagnostics.lastMessage=text;diagnostics.loadState=mode;
  document.querySelectorAll('#syncStatus, #syncStatusMobile').forEach(el => {
    el.className = `sync-status ${el.id === 'syncStatusMobile' ? 'mobile-sync ' : ''}${mode}`;
    el.textContent = text;
  });
}

function publicPhotoUrl(path) {
  if (!path) return '';
  return supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function dataUrlToBlob(dataUrl) {
  const [header, payload] = String(dataUrl).split(',');
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  const binary = atob(payload || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function safeFileName(name = 'photo.jpg') {
  return String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'photo.jpg';
}

window.showAdminDialog = () => {};

async function cloudDbAdd(store, value) {
  if (store === 'notes') {
    const { data, error } = await supabaseClient.from('manual_notes').insert({
      section: value.section,
      title: value.title,
      body: value.body
    }).select('id').single();
    if (error) throw error;
    return data.id;
  }
  if (store === 'photos') {
    const blob = dataUrlToBlob(value.data);
    const filename = safeFileName(value.name || `photo-${Date.now()}.jpg`);
    const storagePath = `${value.section}/${value.category || 'external'}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
    const { error: uploadError } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(storagePath, blob, {
      contentType: blob.type,
      upsert: false
    });
    if (uploadError) throw uploadError;
    const { data, error } = await supabaseClient.from('manual_photos').insert({
      section: value.section,
      category: value.category || 'external',
      storage_path: storagePath,
      name: filename
    }).select('id').single();
    if (error) {
      await supabaseClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw error;
    }
    return data.id;
  }
  throw new Error('Μη υποστηριζόμενος τύπος δεδομένων.');
}

async function cloudDbGetBySection(store, section) {
  if (store === 'notes') {
    const { data, error } = await supabaseClient.from('manual_notes').select('*').eq('section', section).order('created_at');
    if (error) throw error;
    return (data || []).map(row => ({ ...row, createdAt: new Date(row.created_at).getTime() }));
  }
  if (store === 'photos') {
    const { data, error } = await supabaseClient.from('manual_photos').select('*').eq('section', section).order('created_at');
    if (error) throw error;
    return (data || []).map(row => ({ ...row, data: publicPhotoUrl(row.storage_path), createdAt: new Date(row.created_at).getTime() }));
  }
  return [];
}

async function cloudDbDelete(store, id) {
  if (store === 'notes') {
    const { error } = await supabaseClient.from('manual_notes').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  if (store === 'photos') {
    const { data, error: fetchError } = await supabaseClient.from('manual_photos').select('storage_path').eq('id', id).maybeSingle();
    if (fetchError) throw fetchError;
    if (data?.storage_path) {
      const { error: storageError } = await supabaseClient.storage.from(STORAGE_BUCKET).remove([data.storage_path]);
      if (storageError) throw storageError;
    }
    const { error } = await supabaseClient.from('manual_photos').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  throw new Error('Μη υποστηριζόμενος τύπος δεδομένων.');
}

dbAdd = async function(store, value) {
  try {
    setSyncStatus('syncing', '● Αποθήκευση online…');
    const id = await cloudDbAdd(store, value);
    stampSync('Online αποθήκευση ολοκληρώθηκε');setSyncStatus('online', '● Online · Συγχρονισμένο');
    return id;
  } catch (error) {
    setSyncStatus('error', '● Σφάλμα αποθήκευσης');
    alert(`Η αλλαγή δεν αποθηκεύτηκε online.\n${error.message}`);
    throw error;
  }
};

dbGetBySection = async function(store, section) {
  try {
    return await cloudDbGetBySection(store, section);
  } catch (error) {
    console.error(error);
    setSyncStatus('error', '● Σφάλμα online δεδομένων');
    return [];
  }
};

dbGetNotes = section => dbGetBySection('notes', section);
dbGetPhotos = section => dbGetBySection('photos', section);

dbDelete = async function(store, id) {
  try {
    setSyncStatus('syncing', '● Διαγραφή online…');
    await cloudDbDelete(store, id);
    stampSync('Online συγχρονισμός ολοκληρώθηκε');setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    setSyncStatus('error', '● Σφάλμα διαγραφής');
    alert(`Η διαγραφή δεν ολοκληρώθηκε.\n${error.message}`);
  }
};

async function pushCloudState() {
  if (cloudStateLoading) return;
  setSyncStatus('syncing', '● Αποθήκευση online…');
  try {
    const { error } = await supabaseClient.from('manual_app_state').upsert({
      id: CLOUD_STATE_ID,
      sections,
      docs,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) throw error;
    setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    setSyncStatus('error', '● Η αλλαγή δεν αποθηκεύτηκε');
    console.error(error);
    alert(`Η αλλαγή δεν αποθηκεύτηκε στο Supabase.\n${error.message}`);
  }
}

function scheduleCloudState() {
  clearTimeout(cloudStateTimer);
  cloudStateTimer = setTimeout(pushCloudState, 450);
}

saveSections = function() { originalSaveSections(); scheduleCloudState(); };
saveDocs = function() { originalSaveDocs(); scheduleCloudState(); };

function withTimeout(promise, milliseconds = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Η σύνδεση με το Supabase καθυστέρησε υπερβολικά.')), milliseconds))
  ]);
}

async function loadCloudState({ keepSection = false } = {}) {
  if (cloudStateLoading) return;
  cloudStateLoading = true;
  setSyncStatus('syncing', '● Έλεγχος και φόρτωση online…');
  diagnostics.loadState='Έλεγχος API';
  try {
    const healthy=await runSupabaseHealthCheck(false);if(!healthy)throw new Error(diagnostics.lastMessage||'Δεν υπάρχει σύνδεση με Supabase');
    diagnostics.loadState='Φόρτωση δεδομένων';
    const { data, error } = await withTimeout(supabaseClient.from('manual_app_state').select('sections,docs').eq('id', CLOUD_STATE_ID).maybeSingle());
    if (error) throw error;
    if (data) {
      const previousSectionId = currentSection?.id;
      const previousDocId = currentDoc?.id;
      if (Array.isArray(data.sections) && data.sections.length) sections = data.sections;
      if (Array.isArray(data.docs) && data.docs.length) docs = data.docs;
      currentDoc = docs.find(d => d.id === previousDocId) || docs[0];
      originalSaveSections();
      originalSaveDocs();
      buildNav(document.querySelector('#searchInput')?.value || '');
      if (keepSection && previousSectionId) {
        const same = sections.find(s => s.id === previousSectionId);
        if (same) selectSection(same);
        else selectSection(homeSection);
      } else {
        selectSection(homeSection);
      }
    }
    diagnostics.apiLabel='🟢 Συνδεδεμένο';stampSync('Τα online δεδομένα φορτώθηκαν');setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    console.error(error);
    setSyncStatus('error', navigator.onLine ? '● Δεν συνδέθηκε στο Supabase' : '● Χωρίς Internet');
  } finally {
    cloudStateLoading = false;
  }
}

function scheduleRealtimeRefresh() {
  clearTimeout(realtimeTimer);
  realtimeTimer = setTimeout(async () => {
    await loadCloudState({ keepSection: true });
  }, 500);
}

function startRealtime() {
  supabaseClient.channel('kapachim-manual-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_app_state' }, scheduleRealtimeRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_notes' }, () => renderContent())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_photos' }, () => renderContent())
    .subscribe(status => {
      if(status==='SUBSCRIBED'){diagnostics.realtimeLabel='🟢 Ενεργό';setSyncStatus('online','● Online · Συγχρονισμένο')}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){diagnostics.realtimeLabel='🟠 Μη διαθέσιμο';}
    });
}


window.addEventListener('online', () => loadCloudState({ keepSection: true }));
window.addEventListener('offline', () => setSyncStatus('error', '● Χωρίς σύνδεση · οι online αλλαγές δεν είναι διαθέσιμες')); 

(async () => {
  await loadCloudState();
  startRealtime();
  setInterval(()=>runSupabaseHealthCheck(true),30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)runSupabaseHealthCheck(true)});
  window.addEventListener('focus',()=>runSupabaseHealthCheck(true));
  renderContent();
})();
