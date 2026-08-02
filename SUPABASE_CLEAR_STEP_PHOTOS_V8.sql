-- Διαγράφει ΜΟΝΟ τις εγγραφές φωτογραφιών βημάτων από τη βάση.
-- Τα αρχεία Storage που μένουν ορφανά δεν εμφανίζονται στην εφαρμογή.
-- Η Supabase δεν επιτρέπει direct DELETE από storage.objects μέσω SQL.

delete from public.manual_photos
where section like '%::step::%'
   or category = 'step';

select 'Οι φωτογραφίες βημάτων αφαιρέθηκαν από την εφαρμογή. Πέρασέ τες ξανά.' as result;
