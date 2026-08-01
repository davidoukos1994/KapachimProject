/* KapaChim Project v1 — Supabase sync for shared content and images */
const SUPABASE_URL = 'https://bvseqstpqdzferqzbsgf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XsRZNuMARbmE4UROxzvuaQ_hfOv8nPS';
const STORAGE_BUCKET = 'manual-media';
const CLOUD_STATE_ID = 'main';

const diagnostics = {
  projectUrl: SUPABASE_URL,
  schemaVersion: 'Schema v2',
  apiLabel: 'Έλεγχος…',
  realtimeLabel: 'Αναμονή',
  lastSyncLabel: localStorage.getItem('kapachim.lastSync.v20') || 'Δεν έχει γίνει',
  loadState: 'Εκκίνηση',
  lastMessage: '',
  latencyLabel: '—'
};
window.getSupabaseDiagnostics = () => ({ ...diagnostics });

function stampSync(message) {
  diagnostics.lastSyncLabel = new Date().toLocaleString('el-GR');
  diagnostics.lastMessage = message || 'Συγχρονισμένο';
  localStorage.setItem('kapachim.lastSync.v20', diagnostics.lastSyncLabel);
}

function setSyncStatus(mode, text) {
  diagnostics.loadState = mode;
  diagnostics.lastMessage = text;
  document.querySelectorAll('#syncStatus, #syncStatusMobile').forEach(el => {
    el.className = `sync-status ${el.id === 'syncStatusMobile' ? 'mobile-sync ' : ''}${mode}`;
    el.textContent = text;
  });
}

if (!window.supabase) {
  diagnostics.apiLabel = '🔴 Δεν φορτώθηκε η βιβλιοθήκη';
  setSyncStatus('error', '● Σφάλμα φόρτωσης Supabase');
  throw new Error('Η βιβλιοθήκη Supabase δεν φορτώθηκε.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { 'x-client-info': 'kapachim-manual-v20' } }
});
window.kapachimSupabase = supabaseClient;
window.isAdminMode = () => true;
window.showAdminDialog = () => {};

function withTimeout(promise, milliseconds = 12000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Η σύνδεση με το Supabase καθυστέρησε υπερβολικά.')), milliseconds))
  ]);
}

window.runSupabaseHealthCheck = async function runSupabaseHealthCheck(updateBadge = true) {
  const started = performance.now();
  if (!navigator.onLine) {
    diagnostics.apiLabel = '🔴 Χωρίς Internet';
    diagnostics.latencyLabel = '—';
    if (updateBadge) setSyncStatus('error', '● Χωρίς Internet');
    return false;
  }
  try {
    const { error } = await withTimeout(
      supabaseClient.from('manual_app_state').select('id').limit(1),
      8000
    );
    if (error) throw error;
    diagnostics.apiLabel = '🟢 Συνδεδεμένο';
    diagnostics.latencyLabel = `${Math.round(performance.now() - started)} ms`;
    if (updateBadge) setSyncStatus('online', '● Online · Συγχρονισμένο');
    return true;
  } catch (error) {
    diagnostics.apiLabel = '🔴 Σφάλμα API';
    diagnostics.latencyLabel = '—';
    diagnostics.lastMessage = error.message;
    if (updateBadge) setSyncStatus('error', '● Δεν συνδέθηκε στο Supabase');
    return false;
  }
};

function publicPhotoUrl(path) {
  return path ? supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl : '';
}

function dataUrlToBlob(dataUrl) {
  const [header, payload] = String(dataUrl).split(',');
  const mime = (header.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  const bytes = Uint8Array.from(atob(payload || ''), char => char.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

function safeFileName(name = 'photo.jpg') {
  return String(name)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'photo.jpg';
}

async function addNote(value) {
  const { data, error } = await supabaseClient.from('manual_notes').insert({
    section: value.section,
    title: value.title,
    body: value.body
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function addPhoto(value) {
  if (!value?.data) throw new Error('Δεν βρέθηκαν δεδομένα εικόνας.');
  const blob = dataUrlToBlob(value.data);
  if (!blob.size) throw new Error('Η εικόνα είναι κενή.');

  const filename = safeFileName(value.name || `photo-${Date.now()}.jpg`);
  const category = value.category || 'external';
  const section = String(value.section || 'general');
  const storagePath = `${section}/${category}/${Date.now()}-${crypto.randomUUID()}-${filename}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabaseClient.from('manual_photos').insert({
    section,
    category,
    storage_path: storagePath,
    name: filename
  }).select('id').single();

  if (insertError) {
    await supabaseClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
    if (/created_by/i.test(insertError.message || '')) {
      throw new Error('Η βάση έχει παλιό υποχρεωτικό πεδίο created_by. Εκτέλεσε μία φορά το αρχείο SUPABASE_SETUP.sql και ξαναδοκίμασε.');
    }
    throw insertError;
  }
  return data.id;
}

async function cloudDbAdd(store, value) {
  if (store === 'notes') return addNote(value);
  if (store === 'photos') return addPhoto(value);
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
    return (data || []).map(row => ({
      ...row,
      data: publicPhotoUrl(row.storage_path),
      createdAt: new Date(row.created_at).getTime()
    }));
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

// Replace IndexedDB operations with online Supabase operations.
dbAdd = async function(store, value) {
  setSyncStatus('syncing', '● Αποθήκευση online…');
  try {
    const id = await cloudDbAdd(store, value);
    stampSync('Online αποθήκευση ολοκληρώθηκε');
    setSyncStatus('online', '● Online · Συγχρονισμένο');
    return id;
  } catch (error) {
    console.error(error);
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
  setSyncStatus('syncing', '● Διαγραφή online…');
  try {
    await cloudDbDelete(store, id);
    stampSync('Online διαγραφή ολοκληρώθηκε');
    setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    console.error(error);
    setSyncStatus('error', '● Σφάλμα διαγραφής');
    alert(`Η διαγραφή δεν ολοκληρώθηκε.\n${error.message}`);
    throw error;
  }
};

const originalSaveSections = saveSections;
const originalSaveDocs = saveDocs;
let stateSaveTimer = null;
let loadingCloudState = false;

async function pushCloudState() {
  if (loadingCloudState) return;
  setSyncStatus('syncing', '● Αποθήκευση online…');
  try {
    const { error } = await supabaseClient.from('manual_app_state').upsert({
      id: CLOUD_STATE_ID,
      sections,
      docs,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) throw error;
    stampSync('Κείμενα και τομείς αποθηκεύτηκαν online');
    setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    console.error(error);
    setSyncStatus('error', '● Η αλλαγή δεν αποθηκεύτηκε');
    alert(`Η αλλαγή δεν αποθηκεύτηκε στο Supabase.\n${error.message}`);
  }
}

function scheduleCloudState() {
  clearTimeout(stateSaveTimer);
  stateSaveTimer = setTimeout(pushCloudState, 350);
}
saveSections = function() { originalSaveSections(); scheduleCloudState(); };
saveDocs = function() { originalSaveDocs(); scheduleCloudState(); };

async function loadCloudState({ keepSection = false } = {}) {
  if (loadingCloudState) return;
  loadingCloudState = true;
  setSyncStatus('syncing', '● Φόρτωση online…');
  try {
    if (!(await window.runSupabaseHealthCheck(false))) throw new Error(diagnostics.lastMessage || 'Δεν υπάρχει σύνδεση με Supabase.');
    const { data, error } = await withTimeout(
      supabaseClient.from('manual_app_state').select('sections,docs').eq('id', CLOUD_STATE_ID).maybeSingle()
    );
    if (error) throw error;

    const previousSectionId = currentSection?.id;
    const previousDocId = currentDoc?.id;
    if (data?.sections?.length) sections = data.sections;
    if (data?.docs?.length) docs = data.docs;
    currentDoc = docs.find(doc => doc.id === previousDocId) || docs[0];
    originalSaveSections();
    originalSaveDocs();
    buildNav(document.querySelector('#searchInput')?.value || '');

    if (keepSection && previousSectionId) {
      selectSection(sections.find(section => section.id === previousSectionId) || homeSection);
    } else {
      selectSection(homeSection);
    }
    stampSync('Online δεδομένα φορτώθηκαν');
    setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    console.error(error);
    setSyncStatus('error', navigator.onLine ? '● Δεν συνδέθηκε στο Supabase' : '● Χωρίς Internet');
  } finally {
    loadingCloudState = false;
  }
}

let realtimeTimer = null;
function scheduleRealtimeRefresh() {
  clearTimeout(realtimeTimer);
  realtimeTimer = setTimeout(() => loadCloudState({ keepSection: true }), 500);
}

function startRealtime() {
  supabaseClient.channel('kapachim-project-v1-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_app_state' }, scheduleRealtimeRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_notes' }, () => renderContent())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_photos' }, () => renderContent())
    .subscribe(status => {
      if (status === 'SUBSCRIBED') diagnostics.realtimeLabel = '🟢 Ενεργό';
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') diagnostics.realtimeLabel = '🟠 Μη διαθέσιμο';
    });
}

window.addEventListener('online', () => loadCloudState({ keepSection: true }));
window.addEventListener('offline', () => setSyncStatus('error', '● Χωρίς Internet'));

(async () => {
  await loadCloudState();
  startRealtime();
  setInterval(() => window.runSupabaseHealthCheck(true), 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) window.runSupabaseHealthCheck(true); });
  window.addEventListener('focus', () => window.runSupabaseHealthCheck(true));
  renderContent();
})();
