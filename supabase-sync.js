/* KapaChim Manual V15 - Supabase online synchronization */
const SUPABASE_URL = 'https://bvseqstpqdzferqzbsgf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XsRZNuMARbmE4UROxzvuaQ_hfOv8nPS';
const STORAGE_BUCKET = 'manual-media';
const CLOUD_STATE_ID = 'main';
const ADMIN_PIN = '7669';
const ADMIN_STORAGE_KEY = 'kapachim.admin.enabled.v16';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

let adminMode = localStorage.getItem(ADMIN_STORAGE_KEY) === '1';
let cloudStateTimer = null;
let cloudStateLoading = false;
let realtimeTimer = null;
const originalSaveSections = saveSections;
const originalSaveDocs = saveDocs;

window.isAdminMode = () => adminMode;

function setSyncStatus(mode, text) {
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

function updateAdminDialog() {
  const locked = document.querySelector('#adminLockedView');
  const unlocked = document.querySelector('#adminUnlockedView');
  const unlockBtn = document.querySelector('#unlockAdminButton');
  const lockBtn = document.querySelector('#lockAdminButton');
  if (!locked) return;
  locked.hidden = adminMode;
  unlocked.hidden = !adminMode;
  unlockBtn.hidden = adminMode;
  lockBtn.hidden = !adminMode;
  document.querySelector('#adminPinInput').value = '';
}

function applyAdminMode(enabled) {
  adminMode = Boolean(enabled);
  document.body.classList.toggle('admin-mode', adminMode);
  document.querySelectorAll('.admin-only').forEach(el => { el.hidden = !adminMode; });
  updateAdminDialog();
  window.refreshAdminVisibility?.();
}

window.showAdminDialog = showAdminDialog;
function showAdminDialog() {
  document.querySelector('#adminMessage').textContent = '';
  updateAdminDialog();
  document.querySelector('#adminDialog').showModal();
}

async function ensureCloudStateExists() {
  const { data, error } = await supabaseClient.from('manual_app_state').select('id').eq('id', CLOUD_STATE_ID).maybeSingle();
  if (error) throw error;
  if (data) return;
  const { error: insertError } = await supabaseClient.from('manual_app_state').insert({
    id: CLOUD_STATE_ID,
    sections,
    docs,
    updated_at: new Date().toISOString()
  });
  if (insertError) throw insertError;
}

async function unlockAdmin(event) {
  event.preventDefault();
  const pin = document.querySelector('#adminPinInput').value.trim();
  const message = document.querySelector('#adminMessage');
  if (pin !== ADMIN_PIN) {
    message.className = 'auth-message';
    message.textContent = 'Λάθος PIN.';
    return;
  }
  try {
    await ensureCloudStateExists();
    localStorage.setItem(ADMIN_STORAGE_KEY, '1');
    applyAdminMode(true);
    message.className = 'auth-message success';
    message.textContent = 'Η λειτουργία διαχειριστή ενεργοποιήθηκε σε αυτή τη συσκευή.';
    setSyncStatus('online', '● Online · Διαχειριστής');
  } catch (error) {
    console.error(error);
    message.className = 'auth-message';
    message.textContent = 'Δεν έγινε σύνδεση με το Supabase. Έλεγξε ότι εκτέλεσες το SQL setup.';
  }
}

function lockAdmin() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  applyAdminMode(false);
  document.querySelector('#adminMessage').textContent = 'Η λειτουργία διαχειριστή κλειδώθηκε σε αυτή τη συσκευή.';
  setSyncStatus('online', '● Online · Δημόσια προβολή');
}

async function cloudDbAdd(store, value) {
  if (!adminMode) throw new Error('Χρειάζεται λειτουργία διαχειριστή.');
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
  if (!adminMode) throw new Error('Χρειάζεται λειτουργία διαχειριστή.');
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
    setSyncStatus('online', '● Online · Συγχρονισμένο');
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
    setSyncStatus('online', '● Online · Συγχρονισμένο');
  } catch (error) {
    setSyncStatus('error', '● Σφάλμα διαγραφής');
    alert(`Η διαγραφή δεν ολοκληρώθηκε.\n${error.message}`);
  }
};

async function pushCloudState() {
  if (!adminMode || cloudStateLoading) return;
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
  setSyncStatus('syncing', '● Φόρτωση online…');
  try {
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
    setSyncStatus('online', adminMode ? '● Online · Διαχειριστής' : '● Online · Δημόσια προβολή');
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
    if (!adminMode) await loadCloudState({ keepSection: true });
    else renderContent();
  }, 500);
}

function startRealtime() {
  supabaseClient.channel('kapachim-manual-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_app_state' }, scheduleRealtimeRefresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_notes' }, () => renderContent())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_photos' }, () => renderContent())
    .subscribe(status => {
      if (status === 'SUBSCRIBED') setSyncStatus('online', adminMode ? '● Online · Διαχειριστής' : '● Online · Δημόσια προβολή');
    });
}

document.querySelector('#adminSettingsButton').addEventListener('click', showAdminDialog);
document.querySelector('#sidebarSettingsButton').addEventListener('click', showAdminDialog);
document.querySelector('#adminForm').addEventListener('submit', unlockAdmin);
document.querySelector('#lockAdminButton').addEventListener('click', lockAdmin);

window.addEventListener('online', () => loadCloudState({ keepSection: true }));
window.addEventListener('offline', () => setSyncStatus('error', '● Χωρίς σύνδεση · μόνο προβολή βάσης'));

(async () => {
  applyAdminMode(adminMode);
  await loadCloudState();
  startRealtime();
  renderContent();
})();
