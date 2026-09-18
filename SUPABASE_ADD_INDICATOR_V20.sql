-- Run once in Supabase SQL Editor after the v19 backup SQL.
-- Keeps all current sections, procedures, notes and photos.
update public.manual_app_state
set docs = coalesce(docs,'[]'::jsonb) || jsonb_build_array($doc${"category":"Αναλύσεις","id":"analysis-indicator-solution","title":"Διάλυμα δείκτη","editableText":"ΜΕΘΟΔΟΣ KACA-44\nΠαρασκευή διαλύματος δείκτη χλωριόντων (2′,7′-Dichlorofluorescein)\n\nΑ. ΑΝΤΙΔΡΑΣΤΗΡΙΑ\n1. 2′,7′-Dichlorofluorescein (C₂₀H₁₀Cl₂O₅)\n2. Μεθανόλη (CH₃OH) 100%\n3. Απιονισμένο νερό (Demi Water)\n\nΒ. ΟΡΓΑΝΑ – ΣΥΣΚΕΥΕΣ\n1. Ογκομετρικός κύλινδρος 100 mL\n2. Αναλυτικός ζυγός\n\nΓ. ΔΙΑΔΙΚΑΣΙΑ ΠΑΡΑΣΚΕΥΗΣ\n1. Τοποθετούμε τον ογκομετρικό κύλινδρο στον αναλυτικό ζυγό.\n2. Προσθέτουμε 0,1 g 2′,7′-Dichlorofluorescein στον ογκομετρικό κύλινδρο.\n3. Προσθέτουμε μεθανόλη μέχρι την ένδειξη των 75 mL και ανακατεύουμε.\n4. Προσθέτουμε απιονισμένο νερό (Demi Water) μέχρι την ένδειξη των 100 mL και ανακατεύουμε.\n5. Αποθηκεύουμε το παρασκευασμένο διάλυμα σε σκούρο δοχείο."}$doc$::jsonb),
    revision = revision + 1,
    updated_at = now()
where id='main'
  and not coalesce(docs,'[]'::jsonb) @> '[{"id":"analysis-indicator-solution"}]'::jsonb;
select id,title from jsonb_to_recordset((select docs from public.manual_app_state where id='main')) as d(id text,title text)
where id='analysis-indicator-solution';
