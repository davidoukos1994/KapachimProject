-- KapaChim Project v4 — επανέλεγχος δικαιωμάτων διαγραφής φωτογραφιών
-- Τρέξ' το μόνο αν η εφαρμογή εμφανίσει μήνυμα ότι η πολιτική DELETE δεν επιτρέπει διαγραφή.

drop policy if exists "KapaChim photos delete" on public.manual_photos;
create policy "KapaChim photos delete" on public.manual_photos
  for delete to anon, authenticated using (true);

grant delete, select on public.manual_photos to anon, authenticated;

drop policy if exists "KapaChim manual media delete" on storage.objects;
create policy "KapaChim manual media delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'manual-media');

select 'Οι πολιτικές διαγραφής φωτογραφιών είναι ενεργές.' as result;
