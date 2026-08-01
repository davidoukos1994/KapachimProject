/* KapaChim Project v3 — κοινός συγχρονισμός Supabase */
const SUPABASE_URL = 'https://bvseqstpqdzferqzbsgf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XsRZNuMARbmE4UROxzvuaQ_hfOv8nPS';
const STORAGE_BUCKET = 'manual-media';
const CLOUD_STATE_ID = 'main';
const APP_VERSION = 'v3.1';

const diagnostics = {
  projectUrl: SUPABASE_URL,
  schemaVersion: 'Schema v3',
  apiLabel: 'Έλεγχος…',
  realtimeLabel: 'Αναμονή',
  lastSyncLabel: localStorage.getItem('kapachim.lastSync.v3') || 'Δεν έχει γίνει',
  loadState: 'Εκκίνηση',
  lastMessage: '',
  latencyLabel: '—'
};
window.getSupabaseDiagnostics = () => ({ ...diagnostics });

function stampSync(message) {
  diagnostics.lastSyncLabel = new Date().toLocaleString('el-GR');
  diagnostics.lastMessage = message || 'Συγχρονισμένο';
  localStorage.setItem('kapachim.lastSync.v3', diagnostics.lastSyncLabel);
}

function setSyncStatus(mode, text) {
  diagnostics.loadState = mode;
  diagnostics.lastMessage = text;
  document.querySelectorAll('#syncStatus, #syncStatusMobile').forEach(el => {
    el.className = `sync-status ${el.id === 'syncStatusMobile' ? 'mobile-sync ' : ''}${mode}`;
    el.textContent = text;
  });
}
window.setKapachimSyncStatus = setSyncStatus;

if (!window.supabase) {
  diagnostics.apiLabel = '🔴 Δεν φορτώθηκε η βιβλιοθήκη';
  setSyncStatus('error', '● Σφάλμα φόρτωσης Supabase');
  throw new Error('Η βιβλιοθήκη Supabase δεν φορτώθηκε.');
}

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { headers: { 'x-client-info': 'kapachim-project-v3' } }
});
window.kapachimSupabase = supabaseClient;
window.isAdminMode = () => true;
window.showAdminDialog = () => {};

function withTimeout(promise, milliseconds = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Η σύνδεση με το Supabase καθυστέρησε υπερβολικά.')), milliseconds))
  ]);
}

async function directRestHealthCheck() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/manual_app_state?select=id&limit=1`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        Accept: 'application/json'
      },
      signal: controller.signal
    });
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(`Supabase HTTP ${response.status}${message ? `: ${message.slice(0,180)}` : ''}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

window.runSupabaseHealthCheck = async function runSupabaseHealthCheck(updateBadge = true) {
  const started = performance.now();
  if (!navigator.onLine) {
    diagnostics.apiLabel = '🔴 Χωρίς Internet';
    diagnostics.latencyLabel = '—';
    diagnostics.lastMessage = 'Η συσκευή δεν έχει σύνδεση Internet.';
    if (updateBadge) setSyncStatus('error', '● Χωρίς Internet');
    return false;
  }
  if (updateBadge) setSyncStatus('syncing', '● Αυτόματος έλεγχος σύνδεσης…');
  try {
    // Χρησιμοποιούμε απευθείας REST έλεγχο. Είναι πιο αξιόπιστος στο iPhone/PWA
    // και δεν εξαρτάται από την κατάσταση του Realtime καναλιού.
    await directRestHealthCheck();
    diagnostics.apiLabel = '🟢 Συνδεδεμένο';
    diagnostics.latencyLabel = `${Math.round(performance.now() - started)} ms`;
    diagnostics.lastMessage = 'Η σύνδεση με το Supabase λειτουργεί.';
    if (updateBadge) setSyncStatus('online', '● Online · Συγχρονισμένο');
    return true;
  } catch (error) {
    console.warn('Supabase health check failed:', error);
    diagnostics.apiLabel = '🟠 Προσωρινά μη διαθέσιμο';
    diagnostics.latencyLabel = '—';
    diagnostics.lastMessage = error.name === 'AbortError' ? 'Ο έλεγχος σύνδεσης καθυστέρησε.' : error.message;
    if (updateBadge) setSyncStatus('syncing', '● Επανασύνδεση αυτόματα…');
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

let writeQueue = Promise.resolve();
function queueWrite(task) {
  const result = writeQueue.then(task, task);
  writeQueue = result.catch(() => {});
  return result;
}

async function addNote(value) {
  const { data, error } = await supabaseClient.from('manual_notes').insert({
    section: String(value.section || 'general'),
    title: String(value.title || 'Σημείωση'),
    body: String(value.body || '')
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

async function addPhoto(value) {
  if (!value?.data) throw new Error('Δεν βρέθηκαν δεδομένα εικόνας.');
  const blob = dataUrlToBlob(value.data);
  if (!blob.size) throw new Error('Η εικόνα είναι κενή.');

  const filename = safeFileName(value.name || `photo-${Date.now()}.jpg`);
  const category = String(value.category || 'external');
  const section = String(value.section || 'general');
  const randomId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  const storagePath = `${section}/${category}/${Date.now()}-${randomId}-${filename}`;

  const { error: uploadError } = await withTimeout(
    supabaseClient.storage.from(STORAGE_BUCKET).upload(storagePath, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    }),
    45000
  );
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabaseClient.from('manual_photos').insert({
    section,
    category,
    storage_path: storagePath,
    name: filename
  }).select('id').single();

  if (insertError) {
    await supabaseClient.storage.from(STORAGE_BUCKET).remove([storagePath]);
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
    // Πρώτα αφαιρούμε την εγγραφή από τη βάση ώστε η φωτογραφία να εξαφανίζεται
    // αμέσως από όλες τις συσκευές. Η διαγραφή του αρχείου Storage γίνεται μετά
    // και είναι best-effort, για να μην μπλοκάρει η διαγραφή από παλιό policy/cache.
    const { data, error: fetchError } = await supabaseClient
      .from('manual_photos')
      .select('storage_path')
      .eq('id', String(id))
      .maybeSingle();
    if (fetchError) throw fetchError;

    const { error: rowDeleteError } = await supabaseClient
      .from('manual_photos')
      .delete()
      .eq('id', String(id));
    if (rowDeleteError) throw rowDeleteError;

    if (data?.storage_path) {
      const { error: storageError } = await supabaseClient.storage
        .from(STORAGE_BUCKET)
        .remove([data.storage_path]);
      if (storageError) console.warn('Η εγγραφή διαγράφηκε, αλλά έμεινε ορφανό αρχείο Storage:', storageError);
    }
    return;
  }
  throw new Error('Μη υποστηριζόμενος τύπος δεδομένων.');
}

// Οι λειτουργίες της εφαρμογής γράφουν πλέον απευθείας online.
dbAdd = function(store, value) {
  return queueWrite(async () => {
    setSyncStatus('syncing', store === 'photos' ? '● Ανέβασμα φωτογραφίας…' : '● Αποθήκευση online…');
    try {
      const id = await cloudDbAdd(store, value);
      stampSync(store === 'photos' ? 'Η φωτογραφία αποθηκεύτηκε online' : 'Το κείμενο αποθηκεύτηκε online');
      setSyncStatus('online', '● Online · Συγχρονισμένο');
      return id;
    } catch (error) {
      console.error(error);
      setSyncStatus('error', '● Σφάλμα αποθήκευσης');
      alert(`Η αλλαγή δεν αποθηκεύτηκε online.\n${error.message}`);
      throw error;
    }
  });
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

dbDelete = function(store, id) {
  return queueWrite(async () => {
    setSyncStatus('syncing', '● Διαγραφή online…');
    try {
      await cloudDbDelete(store, id);
      stampSync('Η διαγραφή ολοκληρώθηκε online');
      setSyncStatus('online', '● Online · Συγχρονισμένο');
    } catch (error) {
      console.error(error);
      setSyncStatus('error', '● Σφάλμα διαγραφής');
      alert(`Η διαγραφή δεν ολοκληρώθηκε.\n${error.message}`);
      throw error;
    }
  });
};

const originalSaveSections = saveSections;
const originalSaveDocs = saveDocs;
let stateSaveTimer = null;
let loadingCloudState = false;
let stateWriteInProgress = false;
let realtimeTimer = null;

async function pushCloudState() {
  if (loadingCloudState) return;
  stateWriteInProgress = true;
  setSyncStatus('syncing', '● Αποθήκευση online…');
  try {
    const { error } = await withTimeout(supabaseClient.from('manual_app_state').upsert({
      id: CLOUD_STATE_ID,
      sections,
      docs,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' }), 15000);
    if (error) throw error;
    stampSync('Τομείς και έγγραφα αποθηκεύτηκαν online');
    setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    console.error(error);
    setSyncStatus('error', '● Η αλλαγή δεν αποθηκεύτηκε');
    alert(`Η αλλαγή δεν αποθηκεύτηκε στο Supabase.\n${error.message}`);
    throw error;
  } finally {
    stateWriteInProgress = false;
  }
}

function scheduleCloudState() {
  clearTimeout(stateSaveTimer);
  stateSaveTimer = setTimeout(() => queueWrite(pushCloudState), 450);
}
saveSections = function() { originalSaveSections(); scheduleCloudState(); };
saveDocs = function() { originalSaveDocs(); scheduleCloudState(); };
window.flushKapachimSync = () => queueWrite(pushCloudState);

async function loadCloudState({ keepSection = false } = {}) {
  if (loadingCloudState || stateWriteInProgress) return;
  loadingCloudState = true;
  setSyncStatus('syncing', '● Φόρτωση online…');
  try {
    if (!(await window.runSupabaseHealthCheck(false))) throw new Error(diagnostics.lastMessage || 'Δεν υπάρχει σύνδεση με Supabase.');
    const { data, error } = await withTimeout(
      supabaseClient.from('manual_app_state').select('sections,docs,updated_at').eq('id', CLOUD_STATE_ID).maybeSingle(),
      12000
    );
    if (error) throw error;

    const previousSectionId = currentSection?.id;
    const previousDocId = currentDoc?.id;
    const cloudHasContent = Boolean(data?.sections?.length || data?.docs?.length);

    if (cloudHasContent) {
      if (data.sections?.length) sections = data.sections;
      if (data.docs?.length) docs = data.docs;
      currentDoc = docs.find(doc => doc.id === previousDocId) || docs[0];
      originalSaveSections();
      originalSaveDocs();
    } else {
      // Πρώτη εκκίνηση: ανεβάζει στο Supabase το έτοιμο περιεχόμενο της εφαρμογής.
      await pushCloudState();
    }

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
window.reloadKapachimCloudState = loadCloudState;

function scheduleRealtimeRefresh() {
  if (stateWriteInProgress) return;
  clearTimeout(realtimeTimer);
  realtimeTimer = setTimeout(() => loadCloudState({ keepSection: true }), 700);
}

function startRealtime() {
  supabaseClient.channel('kapachim-project-v3-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_app_state' }, scheduleRealtimeRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_notes' }, () => renderContent())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_photos' }, () => renderContent())
    .subscribe(status => {
      if (status === 'SUBSCRIBED') diagnostics.realtimeLabel = '🟢 Ενεργό';
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') diagnostics.realtimeLabel = '🟠 Μη διαθέσιμο';
    });
}

let reconnectTimer = null;
let periodicTimer = null;
let reconnectAttempt = 0;

function clearReconnectTimer() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

async function automaticConnect({ reload = true, keepSection = true } = {}) {
  clearReconnectTimer();
  const ok = await window.runSupabaseHealthCheck(true);
  if (ok) {
    reconnectAttempt = 0;
    if (reload) await loadCloudState({ keepSection });
    return true;
  }
  reconnectAttempt += 1;
  const delay = Math.min(30000, 3000 * Math.pow(1.55, reconnectAttempt - 1));
  diagnostics.lastMessage = `Αυτόματη νέα προσπάθεια σε ${Math.ceil(delay / 1000)} δευτερόλεπτα.`;
  reconnectTimer = setTimeout(() => automaticConnect({ reload: true, keepSection: true }), delay);
  return false;
}
window.automaticKapachimConnect = automaticConnect;

window.addEventListener('online', () => automaticConnect({ reload: true, keepSection: true }));
window.addEventListener('offline', () => {
  clearReconnectTimer();
  setSyncStatus('error', '● Χωρίς Internet');
});
window.addEventListener('beforeunload', () => { if (stateSaveTimer) pushCloudState(); });
window.addEventListener('pageshow', () => automaticConnect({ reload: true, keepSection: true }));

(async () => {
  // Ο έλεγχος ξεκινά αυτόματα και επαναλαμβάνεται μέχρι να ολοκληρωθεί.
  await automaticConnect({ reload: true, keepSection: false });
  startRealtime();
  periodicTimer = setInterval(() => automaticConnect({ reload: false, keepSection: true }), 25000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) automaticConnect({ reload: true, keepSection: true });
  });
  window.addEventListener('focus', () => automaticConnect({ reload: false, keepSection: true }));
  renderContent();
})();
