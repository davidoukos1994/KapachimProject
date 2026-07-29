const baseSections = [
  {group:'Τομείς PDF',id:'brine-saturation',title:'Brine Saturation',icon:'▤',page:3,desc:'D-201 / PIT: Κορεσμός άλμης και τροφοδοσία προς τον R-201.',purpose:'Να βγάλει άλμη υψηλής συγκέντρωσης.',output:'D-201 έξοδος προς R-201 ΡΙΑΚΤΟΡΑ.',properties:['Χαμηλό pH','Υψηλή συγκέντρωση (επιθυμητή)','Χωρίς χλώριο','Έχει μαγνήσια και ασβέστια','Υψηλή θερμοκρασία','Δεν έχει στερεά']},
  {group:'Τομείς PDF',id:'brine-treatment',title:'Brine Treatment',icon:'◫',page:4,desc:'R-201 BRINE TREATMENT ΡΙΑΚΤΟΡΑΣ. Ανακατεύουμε με τη ροή και αέρα ώστε να γίνουν αδιάλυτα στερεά: υδροξείδιο του μαγνησίου και ανθρακικό ασβέστιο. Η καθίζηση γίνεται στις δεξαμενές D-2002 A/B/C: η μία γεμίζει, η άλλη είναι σε αναμονή και η άλλη σε παραγωγή.',purpose:'Να δεσμεύσει / απομακρύνει τα ΜΑΓΝΗΣΙΑ Mg²⁺ και ΑΣΒΕΣΤΙΑ Ca²⁺, ρίχνοντας καυστική σόδα (NaOH) και ανθρακική σόδα.',output:'Έξοδος δεξαμενών προς φίλτρα.',properties:['Υψηλό pH','Έχει στερεά','Υψηλή θερμοκρασία','Αναγωγικό','Λιγότερα μαγνήσια και ασβέστια']},
  {group:'Τομείς PDF',id:'brine-filtration',title:'Brine Filtration',icon:'▥',page:5,desc:'F-201 A/B BRINE FILTRATION ΦΙΛΤΡΑ.',purpose:'Να δεσμεύσει τα στερεά που δεν έχει πιάσει η καθίζηση και τα μετράμε σε ppm.',output:'Έξοδος φίλτρων σε D-203.',properties:['Χαμηλό pH','Υψηλή συγκέντρωση','Υψηλή θερμοκρασία','Δεν έχει στερεά και έχει πολύ λίγα ασβέστια και μαγνήσια','Αναγωγικό'],analysisPurpose:'Να μετρήσουμε τα Mg και Ca σε ppm και τη θολότητα, για να δούμε αν είναι καθαρή η άλμη.',relatedDocs:['analysis-d201']},
  {group:'Τομείς PDF',id:'filtered-brine',title:'Filtered Brine Handling',icon:'◩',page:6,desc:'D-203. Δεξαμενή αποθήκευσης (buffer) που αναμιγνύει την άλμη από την καθίζηση, ώστε να υπάρχει ομοιογένεια.',purpose:'Αποθήκευση και ομογενοποίηση της φιλτραρισμένης άλμης.',output:'Έξοδος D-203 προς ρητίνες.',properties:['pH 9 έως 11','Υψηλή θερμοκρασία','Πρέπει να είναι αναγωγικό','Έχει ελάχιστα μαγνήσια και ασβέστια, που μετράμε σε ppb'],analysisPurpose:'Ανάλυση με pH. Όριο: μέχρι 11.',relatedDocs:['analysis-d201'],notes:'Αν δεν είναι αναγωγικό, προστίθεται sulfite, σύμφωνα με το προσωπικό manual.'},
  {group:'Τομείς PDF',id:'brine-purification',title:'Brine Purification',icon:'◉',page:7,desc:'C-201A / C-201B ΡΗΤΙΝΕΣ. Οι δεξαμενές περιέχουν κόκκους παρόμοιους με άμμο και λειτουργούν με ανταλλαγή νατρίου. Οι δύο στήλες δουλεύουν συνεχόμενα. Όταν δεν μπορούν πλέον να δεσμεύσουν Mg και Ca, γίνεται αναγέννηση με καυστική σόδα για να ξαναπάρουν νάτριο.',purpose:'Να δεσμεύσει τα μαγνήσια και ασβέστια, τα οποία μετράμε από ppm σε ppb.',output:'Έξοδος ρητίνης προς D-204.',properties:['Καθόλου μαγνήσια και ασβέστια','Υψηλή θερμοκρασία','Αναγωγικό','Καθόλου στερεά','Υψηλό pH','Υψηλή συγκέντρωση'],analysisPurpose:'Να μετρήσουμε τα Mg και Ca σε ppb. Ανάλυση στη σελίδα 6 του manual.',relatedDocs:['analysis-r201']},
  {group:'Τομείς PDF',id:'pure-brine',title:'Pure Brine Handling',icon:'◧',page:8,desc:'D-204 ΔΕΞΑΜΕΝΗ ΚΑΘΑΡΗΣ ΑΛΜΗΣ. Εξισορροπεί την καθαρή άλμη. Αν χρειάζεται αραίωση, εισέρχεται εξασθενημένη άλμη από τον ανωλύτη μέχρι να επιτευχθεί η επιθυμητή συγκέντρωση.',purpose:'Να εξισορροπεί την καθαρή άλμη σε υψηλή συγκέντρωση και να την προετοιμάζει για ηλεκτρόλυση.',output:'Έξοδος D-204 προς ηλεκτρόλυση.',properties:['Υψηλή θερμοκρασία','Υψηλό pH','Δεν έχει στερεά','Δεν έχει μαγνήσια και ασβέστια','Αναγωγικό'],relatedDocs:['analysis-d201']},
  {group:'Τομείς PDF',id:'electrolyzer',title:'Electrolyzer (CEC)',icon:'ϟ',page:9,desc:'Ηλεκτρολύτης CEC και βασική λειτουργία.',purpose:'Ηλεκτρόλυση καθαρής άλμης για παραγωγή χλωρίου, υδρογόνου και καυστικού διαλύματος.',properties:['Έλεγχος ρεύματος και τάσης','Παραγωγή Cl₂ και H₂','Έλεγχος μεμβρανών','Παρακολούθηση πιέσεων και ροών'],byproducts:'Παραπροϊόντα: υποχλωριώδες οξύ (HOCl), χλωρικό νάτριο (NaClO₃), οξυγόνο και προσροφημένο χλώριο στην ίδια την άλμη.'},
  {group:'Τομείς PDF',id:'depleted-brine',title:'Depleted Brine Handling',icon:'◫',page:10,desc:'Χημική αποχλωρίωση άλμης. D-205: δεξαμενή buffer που εξισορροπεί τη συγκέντρωση των χλωρικών. R-205: αντιδραστήρας διάσπασης χλωρικών της εξασθενημένης άλμης με οξύ και ατμό. DM-205: διαχωρίζει / κάνει μίξη από την ηλεκτρόλυση και από τον R-205.',purpose:'Να διασπάσει το χλωρικό νάτριο και το υποχλωριώδες οξύ.',output:'Έξοδος της άλμης προς φυσική αποχλωρίωση.',properties:['Υψηλότερη θερμοκρασία λόγω ατμού','Περίπου ίδια συγκέντρωση','Δεν έχει στερεά','Δεν έχει μαγνήσια και ασβέστια','Είναι οξειδωτικό λόγω χλωρίου','Χαμηλότερο pH λόγω υδροχλωρικού οξέος','Έχει διασπαστεί το υποχλωριώδες οξύ και έχει μικρή συγκέντρωση σε χλωρικά άλατα'],inputProperties:['Είσοδος στον τομέα: χαμηλό pH λόγω HOCl, υψηλότερη θερμοκρασία λόγω ατμού, χωρίς Mg/Ca, οξειδωτικό λόγω προσροφημένου χλωρίου, χωρίς στερεά.','Είσοδος από ηλεκτρολύτη: χαμηλό pH λόγω HOCl, υψηλή θερμοκρασία, χαμηλή συγκέντρωση NaCl, οξειδωτικό λόγω χλωρίου, χωρίς στερεά, χωρίς Mg/Ca, 180–190 g/L.']},
  {group:'Τομείς PDF',id:'dechloration',title:'Brine Dechloration',icon:'◌',page:11,desc:'BRINE DECHLORATION / ΦΥΣΙΚΗ ΑΠΟΧΛΩΡΙΩΣΗ.',purpose:'Να απομακρύνει το φυσικά προσροφημένο χλώριο, συμπαρασύροντάς το με αέρα μέσα από τον πύργο που έχει πληρωτικό υλικό.',output:'Έξοδος προς feed (μίκτης 204) και έξοδος προς PIT / D-201.',properties:['Προς feed: χαμηλότερη θερμοκρασία','Ίδιο pH και συγκέντρωση με την είσοδο από D-205','Οξειδωτικό γιατί υπάρχει ακόμη φυσικά προσροφημένο χλώριο','Δεν έχει Mg και Ca','Δεν έχει στερεά','Προς PIT / D-201: ίδια χαρακτηριστικά με την έξοδο προς feed, αλλά έχει περίσσεια υπεροξειδίου του υδρογόνου και όχι φυσικά προσροφημένο χλώριο']},
  {group:'Τομείς PDF',id:'hypo-synthesis',title:'Hypochlorite Synthesis',icon:'◒',page:12,desc:'Δημιουργία υποχλωριώδους νατρίου.',purpose:'Παραγωγή διαλύματος υποχλωριώδους νατρίου με ελεγχόμενη αντίδραση χλωρίου και καυστικού.',properties:['Έλεγχος αντίδρασης','Ρύθμιση παροχών','Παρακολούθηση θερμοκρασίας','Έλεγχος ενεργού χλωρίνης'],relatedDocs:['analysis-chlorine']},
  {group:'Τομείς PDF',id:'hcl-synthesis',title:'HCl Synthesis',icon:'◉',page:13,desc:'Μονάδα δημιουργίας υδροχλωρικού οξέος.',purpose:'Παραγωγή υδροχλωρικού οξέος μέσω ελεγχόμενης καύσης υδρογόνου και χλωρίου.',properties:['Έλεγχος αναλογίας H₂ / Cl₂','Παρακολούθηση φλόγας','Έλεγχος νερού απορρόφησης','Interlocks και ασφαλής λειτουργία'],relatedDocs:['hcl-start-dcs','hcl-start-outside','hcl-stop-outside','hcl-stop-dcs']},
  {group:'Τομείς PDF',id:'hypo-storage',title:'Hypochlorite Storage',icon:'▣',page:16,desc:'Δεξαμενές αποθήκευσης υποχλωριώδους.',purpose:'Αποθήκευση και διάθεση υποχλωριώδους νατρίου από τις δεξαμενές Ζ1–Ζ3 και D1–D3.',properties:['Έλεγχος στάθμης δεξαμενών','Διαχωρισμός αριστερής και δεξιάς πλευράς','Παρακολούθηση χωρητικότητας','Ασφαλής επιλογή δεξαμενής']},
  {group:'Τομείς PDF',id:'sludge',title:'Sludge & Sulphate Treatment',icon:'♨',page:17,desc:'Βοηθητική μονάδα επεξεργασίας λάσπης και θειικών.',purpose:'Συλλογή και επεξεργασία λάσπης και θειικών παραπροϊόντων της μονάδας.',properties:['Διαχείριση R-210','Φίλτρα F-210 A/B','Δεξαμενή D-211','Έλεγχος αντλιών και ροών']},
  {group:'Βοηθητικοί Τομείς',id:'cooling-tower',title:'Πύργος Ψύξης (Evapco)',icon:'❄',desc:'Βοηθητικός τομέας ψύξης νερού με ανεμιστήρα, ακροφύσια, πληρωτικό υλικό και λεκάνη συλλογής.',purpose:'Να απομακρύνει θερμότητα από το ζεστό νερό της εγκατάστασης με επαφή νερού και αέρα και να το επιστρέφει ψυχρότερο στο κύκλωμα.',output:'Ψυχρό νερό προς το chiller / την εγκατάσταση.',properties:['Είσοδος ζεστού νερού','Κατανομή νερού από ακροφύσια','Ροή αέρα από ανεμιστήρα','Εξάτμιση μικρού μέρους του νερού','Συλλογή ψυχρού νερού στη λεκάνη','Make-up για αναπλήρωση','Υπερχείλιση και εκκένωση (blowdown)'],builtInImages:['assets/aux/cooling-tower.jpeg']},
  {group:'Βοηθητικοί Τομείς',id:'carrier-chiller',title:'Carrier 30HXC100 – Υδρόψυκτος Ψύκτης',icon:'▣',desc:'Υδρόψυκτο ψυκτικό μηχάνημα R134a που συνεργάζεται με τον πύργο ψύξης και το κύκλωμα ψυχρού νερού της εγκατάστασης.',purpose:'Να αφαιρεί θερμότητα από το νερό της εγκατάστασης και να παρέχει ψυχρό νερό για κλιματισμό ή διεργασίες.',output:'Ψυχρό νερό περίπου 7°C προς εγκατάσταση και θερμό νερό συμπυκνωτή προς πύργο ψύξης.',properties:['Συμπιεστής κοχλιοφόρος','Συμπυκνωτής νερού','Εξατμιστής','Εκτονωτική βαλβίδα','Ψυκτικό μέσο R134a','Κύκλωμα νερού συμπυκνωτή 28–35°C','Κύκλωμα ψυχρού νερού περίπου 12→7°C','Όργανα πίεσης, θερμοκρασίας και ροής'],builtInImages:['assets/aux/carrier-chiller-overview.jpeg','assets/aux/carrier-chiller-detail.jpeg']},
  {group:'Βοηθητικοί Τομείς',id:'electric-steam-boiler',title:'Ηλεκτρικός Ατμολέβητας',icon:'♨',desc:'Ηλεκτρικός λέβητας που θερμαίνει νερό με ηλεκτρικές αντιστάσεις και παράγει ατμό.',purpose:'Να παράγει ατμό με ασφαλή, καθαρό και αποδοτικό τρόπο για τις ανάγκες θέρμανσης και των βιομηχανικών διεργασιών.',output:'Ατμός προς χρήση στο σύστημα.',properties:['Ηλεκτρικές αντιστάσεις','Τροφοδοσία νερού','Παραγωγή και έξοδος ατμού','Πίνακας ελέγχου','Έλεγχος θερμοκρασίας και πίεσης','Βαλβίδες ασφαλείας','Απομάκρυνση συμπυκνωμάτων'],builtInImages:['assets/aux/electric-steam-boiler.jpeg']},
  {group:'Βοηθητικοί Τομείς',id:'oil-boiler',title:'Λέβητας Πετρελαίου',icon:'🔥',desc:'Λέβητας που καίει πετρέλαιο στον καυστήρα και μεταφέρει τη θερμότητα στο νερό μέσω των αυλών καυσαερίων.',purpose:'Να θερμαίνει νερό για θέρμανση χώρων ή άλλες ανάγκες της εγκατάστασης.',output:'Ζεστό νερό προς την εγκατάσταση και καυσαέρια προς την καμινάδα.',properties:['Καυστήρας πετρελαίου','Είσοδος πετρελαίου','Είσοδος κρύου νερού','Έξοδος ζεστού νερού','Αυλοί καυσαερίων','Έξοδος καυσαερίων','Μανόμετρο και βαλβίδα ασφαλείας'],builtInImages:['assets/aux/oil-boiler.jpeg']},
  {group:'Εργαλεία',id:'flow',title:'Ροή Μονάδας',icon:'⇣',type:'flow'},
  {group:'Ξεχωριστή καρτέλα',id:'documents',title:'Έγγραφα & Τρόποι Εκκίνησης Μονάδας',icon:'▧',type:'documents'}
];

function loadSections(){
  try{
    const saved=JSON.parse(localStorage.getItem('kapachim.sections.v5')||localStorage.getItem('kapachim.sections.v4')||'null');
    if(Array.isArray(saved)&&saved.length){const byId=new Map(saved.map(x=>[x.id,x]));return baseSections.map(b=>byId.has(b.id)?{...b,...byId.get(b.id),builtInImages:b.builtInImages||byId.get(b.id).builtInImages,relatedDocs:b.relatedDocs||byId.get(b.id).relatedDocs}:b).concat(saved.filter(x=>x.custom&&!baseSections.some(b=>b.id===x.id)));}
  }catch(e){}
  return structuredClone(baseSections);
}
let sections=loadSections();
function saveSections(){localStorage.setItem('kapachim.sections.v5',JSON.stringify(sections))}

const baseDocs = [
 {category:'Εκκινήσεις & Σταματήματα Υδροχλωρικού',id:'hcl-start-dcs',title:'Εκκίνηση Υδροχλωρικού από το DCS (από μέσα)',page:14,steps:['Ανοίγω την αντλία υδροχλωρικού P-801A/Β και την βάζω GF και τον ανεμιστήρα Κ-801Α/Β, στην P801 θέλω 1.5 έως 2 bar (PI-8602) και παροχή θέλω από 1.5 έως 2 m³/h.','Κλείνουμε manual την βάνα PIC-2005 για τον υδρογόνο και την PIC-2006 για το χλώριο για να πιάσουμε σωστές πιέσεις προς τον πύργο του υδροχλωρικού.','Αφού πιέσαμε το χλώριο κοντά στο 850 ανοίγουμε την KV8100.','Πατάς HCL UNIT START UP και φυσάει 120 δευτερόλεπτα άζωτο.','Βάζω το νερό 0.350 (FIC-8401).','Σου λέει ο απέξω να ανοίξεις την control του υδρογόνου και την ανοίγεις 35%.','Σου λέει να ανοίξεις την control του χλωρίου και την ανοίγεις στο 45%.','Σου λέει να ανοίξεις τις on/off υδρογόνου και χλωρίου.','Το πιο ασφαλές είναι όταν φτάσεις την βάνα του χλωρίου 60% και του υδρογόνου 45%, αυτός που είναι έξω να κλείσει εντελώς τον αέρα στον πύργο.']},
 {category:'Εκκινήσεις & Σταματήματα Υδροχλωρικού',id:'hcl-start-outside',title:'Εκκίνηση Υδροχλωρικού Εξωτερικά (βάζεις τη φωτιά)',page:15,steps:['Ανοίγω προς 902.','Ανοίγω το πράσινο βανάκι.','Γεμίζω τα silpot, κλείνω του υδρογόνου όταν βγάλει νερό, και τσεκάρω το demister αν γεμίζει για να κλείσω και του χλωρίου.','Εάν η πίεση στην μεριά του υδρογόνου είναι υψηλή πρέπει να εκτονώσω μέχρι να πάει 400-450 στο silpot του υδρογόνου.','Ανοίγω την κεντρική του υδρογόνου σε συνεννόηση με τον χειριστή μέσα.','Ξεπλένω τα tubes από την μεριά του υδρογόνου και του χλωρίου με περίπου 100-150 λίτρα, σε συνεννόηση με τον χειριστή, για 2 λεπτά.','Ανοίγω την παροχή στο σωληνάκι για την φωτιά και πετάω για λίγο έξω άζωτο ή υδρογόνο για να έρθει το υδρογόνο.','Ανοίγω το πορτάκι και βάζω φωτιά και τοποθετώ το μαρκούτσι μέσα.','Λες στον χειριστή να ανοίξει την control του υδρογόνου 35% και ανοίγεις σιγά σιγά το bypass.','Εφόσον έχεις υδρογόνο και βλέπεις καύση, κλείνεις τις βάνες για το μαρκούτσι και το βγάζεις από τον πύργο.','Λες στον χειριστή να ανοίξει και την control του χλωρίου 45% και ανοίγεις σιγά σιγά το bypass.','Μόλις τερματίσουν οι βάνες, ανοίγονται οι on/off σε συνεννόηση και κλείνουν τα bypass αφού ελεγχθεί η σωστή λειτουργία.','Στο τέλος κλείνεις σιγά σιγά τον αέρα και μετά την χειροκίνητη κάτω.','Βάζεις νερό προσεκτικά από την μεριά του υδρογόνου μέχρι να υπάρχει νερό σε όλη την επιφάνεια της φλόγας.']},
 {category:'Εκκινήσεις & Σταματήματα Υδροχλωρικού',id:'hcl-stop-outside',title:'Τρόπος σταματήματος υδροχλωρικού εξωτερικά',page:19,steps:['Ανοίγουμε χειροκίνητες βάνες του αέρα για να αναπνεύσει ο πύργος.','Κλείνουμε την κεντρική του Υδρογόνου.','Ξεπλένουμε με DW την φλόγα ανοίγοντας μία το υδρογόνο και μία το χλώριο.','Κλείνουμε την κεντρική του νερού DW.','Γεμίζουμε τα silpot.','Κλείνουμε την είσοδο νερού Π.Ψ στον μανδύα.','Ανοίγουμε το κενό προς 610.','Γυρνάμε προς 902.','Κλείνω την χειροκίνητη βάνα μπροστά από τις αντλίες (πράσινη βάνα).','Φυσάνε άζωτο στην γραμμή του υδρογόνου.']},
 {category:'Εκκινήσεις & Σταματήματα Υδροχλωρικού',id:'hcl-stop-dcs',title:'Τρόπος σταματήματος στο υδροχλωρικό DCS',page:20,steps:['Κάνεις όλα τα interlock disable στον πύργο εκτός από το power failure.','Αρχίζω και κλείνω την FIC-8101 και την FIC-8201 και προσέχω τις πιέσεις PIC-2006 και PIC-2005.','Κατεβάζεις από την FIC-8401 την ροή του νερού.','Ανοίγεις την PIC8300 και την βάζεις Manual στο 50%.','Όταν φτάσει 50% η βάνα του χλωρίου και 35-30% του υδρογόνου πατάμε HCL UNIT SHUTDOWN.','Βγάζω από GF την P801 και την κλείνω, και η βάνα LIC-8501 manual και βάζω στα details Out Lo 0 και Out High 100.']},
 {category:'Αναλύσεις',id:'analysis-naoh',title:'Ανάλυση NaOH & Na₂CO₃ σε διάλυμα',page:21},{category:'Αναλύσεις',id:'analysis-chlorine',title:'Ανάλυση ενεργού χλωρίνης',page:22},{category:'Αναλύσεις',id:'analysis-d201',title:'Ανάλυση D-201 / D-204 / Feed / Ανωλύτης',page:23},{category:'Αναλύσεις',id:'analysis-r201',title:'Ανάλυση R-201 (Ριακτόρας)',page:24},{category:'Αναλύσεις',id:'analysis-salt',title:'Ανάλυση αλατιού',page:25}
];

function cloneValue(value){return JSON.parse(JSON.stringify(value))}
function loadDocs(){
  try{
    const saved=JSON.parse(localStorage.getItem('kapachim.docs.v7')||'null');
    if(!Array.isArray(saved)) return cloneValue(baseDocs);
    return baseDocs.map(base=>{const edited=saved.find(x=>x.id===base.id);return edited?{...cloneValue(base),...edited}:cloneValue(base)});
  }catch{return cloneValue(baseDocs)}
}
function saveDocs(){localStorage.setItem('kapachim.docs.v7',JSON.stringify(docs))}
let docs=loadDocs();

const homeSection={id:'home',title:'Αρχική',type:'home',icon:'⌂'};
let currentSection=homeSection, activeTab='home', currentDoc=docs[0], editingSectionId=null;
const $=s=>document.querySelector(s);
const pageSrc=n=>`assets/pages/page-${String(n).padStart(2,'0')}.webp`;
const docById=id=>docs.find(d=>d.id===id);
function builtInGallery(section,category='external'){return category==='external'?(section.builtInImages||[]):[];}
const editableSection=()=>!['documents','flow'].includes(currentSection.type);

function buildNav(filter=''){
 const nav=$('#navList');nav.innerHTML='';let last='';
 if(!filter){const homeBtn=document.createElement('button');homeBtn.className='nav-item'+(currentSection.id==='home'?' active':'');homeBtn.innerHTML='<span class="nav-icon">⌂</span><span>Αρχική</span>';homeBtn.onclick=()=>selectSection(homeSection);nav.append(homeBtn)}
 sections.filter(s=>(s.title+' '+(s.desc||'')+' '+(s.purpose||'')+' '+(s.properties||[]).join(' ')).toLowerCase().includes(filter.toLowerCase())).forEach(s=>{
  if(s.group!==last){const g=document.createElement('div');g.className='nav-group-title';g.textContent=s.group;nav.append(g);last=s.group}
  const b=document.createElement('button');b.className='nav-item'+(s.id===currentSection.id?' active':'');b.innerHTML=`<span class="nav-icon">${s.icon||'▧'}</span><span>${escapeHtml(s.title)}</span>`;b.onclick=()=>selectSection(s);nav.append(b)
 });
}
function selectSection(s){stopSpeech();currentSection=s;activeTab=s.type==='home'?'home':s.type==='documents'?'documents':s.type==='flow'?'flow':'manual';document.body.classList.toggle('home-mode',s.type==='home');$('#pageTitle').textContent=s.type==='home'?'Προσωπικό Manual':s.title;$('#breadcrumb').textContent=s.type==='home'?'Αρχική':s.type==='documents'?'Βιβλιοθήκη εγγράφων':s.type==='flow'?'Εργαλεία / Ροή Μονάδας':'Τομείς / '+s.title;renderTabs();renderContent();buildNav($('#searchInput').value);updateEditButtons();closeSidebar()}
function updateEditButtons(){document.querySelectorAll('.edit-section-btn').forEach(b=>b.disabled=!editableSection())}
function renderTabs(){const t=$('#tabs');t.innerHTML='';if(currentSection.type==='home')return;let tabs;if(currentSection.type==='documents')tabs=[['documents','Έγγραφα & Διαδικασίες'],['additions','Πρόσθετο υλικό']];else if(currentSection.type==='flow')tabs=[['flow','Διάγραμμα Ροής']];else tabs=[['manual','Επισκόπηση'],['dcs','Εικόνες DCS'],['external','Εξωτερικός Εξοπλισμός'],['additions','Πρόσθετο υλικό']];tabs.forEach(([id,label])=>{const b=document.createElement('button');b.className='tab'+(activeTab===id?' active':'');b.textContent=label;b.onclick=()=>{activeTab=id;renderTabs();renderContent()};t.append(b)})}
async function renderContent(){const c=$('#content');if(currentSection.type==='home')return renderHome(c);if(currentSection.type==='documents'&&activeTab==='documents')return renderDocuments(c);if(currentSection.type==='flow')return renderFlow(c);if(activeTab==='manual')return renderManual(c);if(activeTab==='dcs')return renderPhotos(c,'dcs');if(activeTab==='external')return renderPhotos(c,'external');return renderAdditions(c)}

function renderHome(c){
 const sectorItems=sections.filter(s=>!['documents','flow'].includes(s.type));
 c.innerHTML=`<div class="home-landing"><section class="home-brand-panel"><img src="assets/manual-cover.jpeg" alt="KapaChim Inventing Chemistry" class="home-logo"><h2>Ψηφιακό Προσωπικό Manual</h2><p>Επίλεξε έναν τομέα από το μενού για να ανοίξεις την περιγραφή, τον σκοπό, τις ιδιότητες, τις εικόνες και τα σχετικά έγγραφα.</p><div class="home-quick-actions"><button class="btn secondary home-flow">Ροή Μονάδας</button><button class="btn secondary home-docs">Έγγραφα & Διαδικασίες</button></div></section><aside class="home-sector-panel"><div class="home-sector-head"><div><span>ΤΟΜΕΙΣ</span><h3>Επίλεξε τομέα</h3></div><button class="icon-btn home-menu-button" aria-label="Άνοιγμα πλήρους μενού">☰</button></div><div class="home-sector-list">${sectorItems.map(s=>`<button class="home-sector-item" data-id="${s.id}"><span>${s.icon||'▧'}</span><div><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.purpose||s.desc||'')}</small></div><b>›</b></button>`).join('')}</div></aside></div>`;
 c.querySelectorAll('.home-sector-item').forEach(b=>b.onclick=()=>selectSection(sections.find(s=>s.id===b.dataset.id)));
 c.querySelector('.home-flow').onclick=()=>selectSection(sections.find(s=>s.id==='flow'));
 c.querySelector('.home-docs').onclick=()=>selectSection(sections.find(s=>s.id==='documents'));
 c.querySelector('.home-menu-button').onclick=()=>{$('#sidebar').classList.add('open');$('#backdrop').classList.add('show')};
}

function renderManual(c){
 const props=(currentSection.properties||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
 const inputProps=(currentSection.inputProperties||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
 const hasPage=Number.isFinite(Number(currentSection.page));
 const builtIns=currentSection.builtInImages||[];
 const related=(currentSection.relatedDocs||[]).map(docById).filter(Boolean);
 const visual=hasPage?`<div class="image-wrap large-manual"><img class="manual-image zoomable" src="${pageSrc(currentSection.page)}" alt="${escapeHtml(currentSection.title)}"></div><div class="image-tools"><button class="btn secondary zoom-btn">Μεγέθυνση εικόνας</button></div>`:builtIns.length?`<div class="built-in-gallery overview-gallery">${builtIns.map((src,i)=>`<img class="manual-image zoomable" src="${src}" alt="${escapeHtml(currentSection.title)} ${i+1}">`).join('')}</div>`:'<div class="custom-placeholder">Δεν υπάρχει αρχική εικόνα. Πρόσθεσε φωτογραφίες DCS ή εξωτερικού εξοπλισμού.</div>';
 c.innerHTML=`<div class="hero-title"><div class="big-icon">${currentSection.icon||'▧'}</div><div><h2>${escapeHtml(currentSection.title)}</h2><p>${escapeHtml(currentSection.desc||'')}</p></div></div>
 ${hasPage?'<div class="original-badge">🔒 Αυθεντικό περιεχόμενο PDF - μόνο για προβολή</div>':builtIns.length?'<div class="original-badge custom">📷 Ενσωματωμένο βοηθητικό υλικό</div>':'<div class="original-badge custom">✏️ Προσωπικός τομέας</div>'}
 <div class="overview-layout"><div class="manual-column">${visual}</div>
 <aside class="info-stack"><div class="speech-actions"><button class="btn primary full play-section">▶ Αναπαραγωγή σελίδας</button><button class="btn secondary stop-speech">■ Διακοπή</button></div><section class="info-box purpose"><h3>Σκοπός</h3><p>${escapeHtml(currentSection.purpose||'Δεν έχει συμπληρωθεί.')}</p></section>${currentSection.output?`<section class="info-box output"><h3>Έξοδος / Επόμενο στάδιο</h3><p>${escapeHtml(currentSection.output)}</p></section>`:''}<section class="info-box properties"><h3>Ιδιότητες / Κύρια σημεία</h3>${props?`<ul>${props}</ul>`:'<p>Δεν έχουν συμπληρωθεί ιδιότητες.</p>'}</section>${currentSection.analysisPurpose?`<section class="info-box analysis"><h3>Σκοπός ανάλυσης</h3><p>${escapeHtml(currentSection.analysisPurpose)}</p></section>`:''}${related.length?`<section class="info-box analysis"><h3>Σχετικά έγγραφα / Αναλύσεις</h3><div class="related-docs">${related.map(d=>`<button class="btn secondary related-doc" data-doc="${d.id}">${escapeHtml(d.title)}</button>`).join('')}</div></section>`:''}${currentSection.byproducts?`<section class="info-box byproducts"><h3>Παραπροϊόντα</h3><p>${escapeHtml(currentSection.byproducts)}</p></section>`:''}${inputProps?`<section class="info-box inputs"><h3>Είσοδοι / Χαρακτηριστικά</h3><ul>${inputProps}</ul></section>`:''}${currentSection.notes?`<section class="info-box description"><h3>Παρατηρήσεις</h3><p>${escapeHtml(currentSection.notes)}</p></section>`:''}<section class="info-box description"><h3>Περιγραφή τομέα</h3><p>${escapeHtml(currentSection.desc||'')}</p></section><button class="btn secondary full edit-inline">✏️ Επεξεργασία τομέα</button></aside></div><div id="inlineAdditions"></div>`;
 bindZoom(c);c.querySelector('.edit-inline').onclick=()=>showSectionDialog(currentSection);c.querySelector('.play-section').onclick=()=>speakSection(currentSection);c.querySelector('.stop-speech').onclick=stopSpeech;c.querySelectorAll('.related-doc').forEach(b=>b.onclick=()=>openRelatedDoc(b.dataset.doc));renderInlineAdditions();
}
function renderFlow(c){
 const ids=['brine-saturation','brine-treatment','brine-filtration','filtered-brine','brine-purification','pure-brine','electrolyzer','depleted-brine','dechloration','cooling-tower','carrier-chiller','electric-steam-boiler','oil-boiler'];const flow=ids.map(id=>sections.find(s=>s.id===id)).filter(Boolean);
 c.innerHTML=`<h2 class="section-title">Ροή Μονάδας</h2><p class="flow-help">Πάτησε σε κάθε στάδιο για να ανοίξει ο αντίστοιχος τομέας.</p><div class="flow-list">${flow.map((s,i)=>`<button class="flow-node" data-id="${s.id}"><span>${s.icon||'▧'}</span><strong>${escapeHtml(s.title)}</strong><small>${escapeHtml(s.output||s.purpose||'')}</small></button>${i<flow.length-1?'<div class="flow-arrow">↓</div>':''}`).join('')}</div>`;
 c.querySelectorAll('.flow-node').forEach(b=>b.onclick=()=>selectSection(sections.find(s=>s.id===b.dataset.id)));
}
async function renderPhotos(c,category){const all=await dbGetPhotos(currentSection.id);const photos=all.filter(p=>(p.category||'external')===category);const builtIns=builtInGallery(currentSection,category);const isDcs=category==='dcs';c.innerHTML=`<div class="section-head-row"><div><h2 class="section-title">${isDcs?'Εικόνες DCS':'Φωτογραφίες εξωτερικού εξοπλισμού'}</h2><p>${isDcs?'Πρόσθεσε επιπλέον οθόνες και σημεία του DCS για αυτόν τον τομέα.':'Πρόσθεσε πραγματικές φωτογραφίες από αντλίες, βάνες, δεξαμενές και άλλο εξωτερικό εξοπλισμό.'}</p></div><button class="btn primary add-photo-here">+ Προσθήκη ${isDcs?'DCS':'εξωτερικής'} φωτογραφίας</button></div>${builtIns.length?`<h3>Ενσωματωμένες φωτογραφίες</h3><div class="built-in-gallery">${builtIns.map((src,i)=>`<img class="zoomable" src="${src}" alt="${escapeHtml(currentSection.title)} ${i+1}">`).join('')}</div><h3>Δικές μου φωτογραφίες</h3>`:''}<div class="photo-grid large-photos" id="photoGrid"></div>`;renderPhotoGrid(photos,$('#photoGrid'),currentSection.id);bindZoom(c);c.querySelector('.add-photo-here').onclick=()=>showPhotoDialog(category)}
async function renderAdditions(c){const notes=await dbGetNotes(currentSection.id);const photos=await dbGetPhotos(currentSection.id);c.innerHTML=`<h2 class="section-title">Πρόσθετο υλικό</h2><p>Το υλικό αυτό είναι ξεχωριστό από το PDF και μπορεί να διαγραφεί ή να συμπληρωθεί χωρίς να επηρεαστεί το αρχικό manual.</p><div id="notesList"></div><h3>Εικόνες DCS</h3><div class="photo-grid" id="dcsGrid"></div><h3>Εξωτερικός εξοπλισμός</h3><div class="photo-grid" id="externalGrid"></div>`;renderNotes(notes);renderPhotoGrid(photos.filter(p=>p.category==='dcs'),$('#dcsGrid'));renderPhotoGrid(photos.filter(p=>(p.category||'external')==='external'),$('#externalGrid'))}
function renderDocuments(c){const groups=[...new Set(docs.map(d=>d.category||'Έγγραφα'))];c.innerHTML=`<div class="doc-list"><div class="doc-menu">${groups.map(g=>`<div class="doc-group-title">${escapeHtml(g)}</div>${docs.filter(d=>(d.category||'Έγγραφα')===g).map(d=>`<button class="doc-choice ${d.id===currentDoc.id?'active':''}" data-doc="${d.id}">▧ ${d.title}</button>`).join('')}`).join('')}</div><div id="docView"></div></div>`;c.querySelectorAll('.doc-choice').forEach(b=>b.onclick=()=>{currentDoc=docs.find(d=>d.id===b.dataset.doc);renderContent()});renderDocView()}
function openRelatedDoc(id){const d=docById(id);const docSection=sections.find(s=>s.id==='documents');if(!d||!docSection)return;currentDoc=d;selectSection(docSection)}
async function renderDocView(){
 const v=$('#docView');let body='';
 if(currentDoc.steps){
  body=`<div class="original-badge custom">✏️ Επεξεργάσιμο αντίγραφο — το αρχικό PDF παραμένει ανέπαφο</div><div class="steps">${currentDoc.steps.map((step,i)=>`<article class="step-card"><div class="step-main"><label class="step"><input type="checkbox"><span><strong>${i+1}.</strong> ${escapeHtml(step)}</span></label><button type="button" class="btn secondary step-photo-add" data-step="${i}">+ Φωτογραφία βήματος</button><input class="step-photo-input" data-step="${i}" type="file" accept="image/*" hidden></div><div class="step-photo-list" id="stepPhotos-${i}"></div></article>`).join('')}</div>`
 }else{
  body=`<div class="original-badge custom">✏️ Μπορείς να προσθέσεις ή να αλλάξεις το συνοδευτικό κείμενο</div>${currentDoc.editableText?`<div class="doc-editable-text">${escapeHtml(currentDoc.editableText).replace(/\n/g,'<br>')}</div>`:''}<img class="manual-image zoomable" src="${pageSrc(currentDoc.page)}" alt="${escapeHtml(currentDoc.title)}">`
 }
 v.innerHTML=`<div class="doc-title-row"><h2 class="section-title">${escapeHtml(currentDoc.title)}</h2><div class="doc-actions"><button class="btn primary play-doc">▶ Αναπαραγωγή</button><button class="btn secondary stop-speech">■ Διακοπή</button><button class="btn primary edit-doc">✏️ Επεξεργασία κειμένου</button></div></div>${body}<div class="image-tools"><button class="btn secondary show-page">Προβολή αρχικής σελίδας PDF</button><button class="btn secondary reset-doc">Επαναφορά αρχικού κειμένου</button></div><div class="additions"><h3>Πρόσθετες σημειώσεις / φωτογραφίες</h3><div id="inlineAdditions"></div></div>`;
 bindZoom(v);
 v.querySelector('.show-page').onclick=()=>openImage(pageSrc(currentDoc.page));
 v.querySelector('.edit-doc').onclick=showDocDialog;
 v.querySelector('.reset-doc').onclick=resetCurrentDoc;
 v.querySelector('.play-doc').onclick=()=>speakDocument(currentDoc);
 v.querySelector('.stop-speech').onclick=stopSpeech;
 v.querySelectorAll('.step-photo-add').forEach(btn=>btn.onclick=()=>v.querySelector(`.step-photo-input[data-step="${btn.dataset.step}"]`).click());
 v.querySelectorAll('.step-photo-input').forEach(inp=>inp.onchange=async()=>{const file=inp.files?.[0];if(!file)return;await addStepPhoto(currentDoc.id,Number(inp.dataset.step),file);inp.value='';await renderStepPhotos(currentDoc.id,Number(inp.dataset.step));});
 if(currentDoc.steps)await Promise.all(currentDoc.steps.map((_,i)=>renderStepPhotos(currentDoc.id,i)));
 renderInlineAdditions(currentDoc.id)
}

function stepPhotoSection(docId,stepIndex){return `${docId}::step::${stepIndex}`}
async function addStepPhoto(docId,stepIndex,file){
 if(!file.type.startsWith('image/'))return;
 const data=await compressImage(file);
 await dbAdd('photos',{section:stepPhotoSection(docId,stepIndex),category:'step',data,name:file.name,createdAt:Date.now()});
}
async function renderStepPhotos(docId,stepIndex){
 const host=document.querySelector(`#stepPhotos-${stepIndex}`);if(!host)return;
 const photos=await dbGetPhotos(stepPhotoSection(docId,stepIndex));
 if(!photos.length){host.innerHTML='<span class="step-photo-empty">Δεν έχει προστεθεί φωτογραφία σε αυτό το βήμα.</span>';return}
 host.innerHTML=photos.map(p=>`<div class="step-photo-thumb"><button type="button" class="step-photo-open" aria-label="Άνοιγμα φωτογραφίας"><img src="${p.data}" alt="Φωτογραφία βήματος ${stepIndex+1}"></button><button type="button" class="step-photo-delete" data-id="${p.id}" aria-label="Διαγραφή φωτογραφίας">×</button></div>`).join('');
 host.querySelectorAll('.step-photo-open').forEach((b,i)=>b.onclick=()=>openImage(photos[i].data));
 host.querySelectorAll('.step-photo-delete').forEach(b=>b.onclick=async()=>{if(!confirm('Να διαγραφεί η φωτογραφία αυτού του βήματος;'))return;await dbDelete('photos',Number(b.dataset.id));await renderStepPhotos(docId,stepIndex)});
}
async function renderInlineAdditions(key=currentSection.id){const host=$('#inlineAdditions');if(!host)return;const notes=await dbGetNotes(key),photos=await dbGetPhotos(key);host.innerHTML=`<div id="notesList"></div><div class="photo-grid" id="photoGrid"></div>`;renderNotes(notes,host.querySelector('#notesList'),key);renderPhotoGrid(photos,host.querySelector('#photoGrid'),key)}
function renderNotes(notes,host=$('#notesList')){if(!host)return;host.innerHTML=notes.length?notes.map(n=>`<article class="addition-card"><div class="addition-head"><div><h4>${escapeHtml(n.title)}</h4><p>${escapeHtml(n.body)}</p></div><button class="btn danger delete-note" data-id="${n.id}">Διαγραφή</button></div></article>`).join(''):'<div class="empty-state">Δεν έχει προστεθεί ακόμη πρόσθετο κείμενο.</div>';host.querySelectorAll('.delete-note').forEach(b=>b.onclick=async()=>{await dbDelete('notes',Number(b.dataset.id));renderContent()})}
function renderPhotoGrid(photos,host=$('#photoGrid')){if(!host)return;host.innerHTML=photos.length?photos.map(p=>`<div class="photo-card"><img src="${p.data}" alt="Πρόσθετη φωτογραφία" data-src="${p.data}"><button class="delete-photo" data-id="${p.id}">✕</button></div>`).join(''):'<div class="empty-state">Δεν έχουν προστεθεί φωτογραφίες.</div>';host.querySelectorAll('img').forEach(i=>i.onclick=()=>openImage(i.dataset.src));host.querySelectorAll('.delete-photo').forEach(b=>b.onclick=async()=>{await dbDelete('photos',Number(b.dataset.id));renderContent()})}
function bindZoom(root){root.querySelectorAll('.zoomable').forEach(i=>i.onclick=()=>openImage(i.src));root.querySelectorAll('.zoom-btn').forEach(b=>b.onclick=()=>openImage(root.querySelector('.manual-image').src))}
function openImage(src){$('#fullImage').src=src;$('#imageDialog').showModal()}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function additionKey(){return currentSection.type==='documents'?currentDoc.id:currentSection.id}

const DB='kapachim-manual-db';function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('notes')){const s=d.createObjectStore('notes',{keyPath:'id',autoIncrement:true});s.createIndex('section','section')}if(!d.objectStoreNames.contains('photos')){const s=d.createObjectStore('photos',{keyPath:'id',autoIncrement:true});s.createIndex('section','section')}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function dbAdd(store,val){const d=await openDB();return new Promise((res,rej)=>{const t=d.transaction(store,'readwrite');t.objectStore(store).add(val);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function dbGetBySection(store,section){const d=await openDB();return new Promise((res,rej)=>{const r=d.transaction(store).objectStore(store).index('section').getAll(section);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
const dbGetNotes=s=>dbGetBySection('notes',s);const dbGetPhotos=s=>dbGetBySection('photos',s);async function dbDelete(store,id){const d=await openDB();return new Promise((res,rej)=>{const t=d.transaction(store,'readwrite');t.objectStore(store).delete(id);t.oncomplete=res;t.onerror=()=>rej(t.error)})}

function getGreekVoice(){
 const voices=window.speechSynthesis?.getVoices?.()||[];
 return voices.find(v=>String(v.lang).toLowerCase()==='el-gr')||voices.find(v=>String(v.lang).toLowerCase().startsWith('el'))||null;
}
let speechRun=0;
function naturalSpeechText(text){
 return String(text||'').replace(/\bPh\b/gi,'πε χά').replace(/\bpH\b/g,'πε χά').replace(/Mg²?\+?/g,'μαγνήσιο').replace(/Ca²?\+?/g,'ασβέστιο').replace(/NaOH/g,'καυστική σόδα').replace(/NaCl/g,'χλωριούχο νάτριο').replace(/\s+/g,' ').trim();
}
function speakSequence(chunks){
 if(!('speechSynthesis' in window)){alert('Η αναπαραγωγή φωνής δεν υποστηρίζεται σε αυτή τη συσκευή.');return}
 stopSpeech();
 const run=++speechRun, voice=getGreekVoice();
 const queue=chunks.map(naturalSpeechText).filter(Boolean);
 const next=()=>{
  if(run!==speechRun||!queue.length)return;
  const utterance=new SpeechSynthesisUtterance(queue.shift());
  utterance.lang='el-GR';utterance.rate=.86;utterance.pitch=.98;utterance.volume=1;
  if(voice)utterance.voice=voice;
  utterance.onend=()=>{if(run===speechRun)setTimeout(next,320)};
  utterance.onerror=()=>{if(run===speechRun)setTimeout(next,250)};
  window.speechSynthesis.speak(utterance);
 };
 next();
}
function speakText(text){speakSequence([text])}
function stopSpeech(){speechRun++;if('speechSynthesis' in window)window.speechSynthesis.cancel()}
function speakSection(section){
 const chunks=[`Ακούτε την περιγραφή του τομέα ${section.title}.`];
 if(section.desc)chunks.push(`Περιγραφή τομέα. ${section.desc}`);
 if(section.purpose)chunks.push(`Ο σκοπός του τομέα είναι ο εξής. ${section.purpose}`);
 if(section.output)chunks.push(`Η έξοδος, ή το επόμενο στάδιο, είναι. ${section.output}`);
 if(section.properties?.length){chunks.push('Οι βασικές ιδιότητες και τα κύρια σημεία είναι τα εξής.');section.properties.forEach((x,i)=>chunks.push(`${i+1}. ${x}`))}
 if(section.analysisPurpose)chunks.push(`Σκοπός της ανάλυσης. ${section.analysisPurpose}`);
 if(section.notes)chunks.push(`Παρατηρήσεις. ${section.notes}`);
 chunks.push('Τέλος περιγραφής τομέα.');
 speakSequence(chunks);
}
function speakDocument(doc){
 const chunks=[`Έγγραφο. ${doc.title}.`];
 if(doc.steps?.length){chunks.push('Ακολουθούν τα βήματα της διαδικασίας.');doc.steps.forEach((x,i)=>chunks.push(`Βήμα ${i+1}. ${x}`));chunks.push('Τέλος διαδικασίας.');}
 else if(doc.editableText){chunks.push(doc.editableText);chunks.push('Τέλος εγγράφου.');}
 else chunks.push('Το έγγραφο εμφανίζεται ως εικόνα από το αρχικό PDF. Πρόσθεσε συνοδευτικό κείμενο ώστε να μπορεί να αναπαραχθεί με φωνή.');
 speakSequence(chunks);
}
function showDocDialog(){
 $('#docTitleInput').value=currentDoc.title||'';
 $('#docTextLabel').textContent=currentDoc.steps?'Βήματα — ένα ανά γραμμή':'Συνοδευτικό επεξεργάσιμο κείμενο';
 $('#docTextInput').value=currentDoc.steps?(currentDoc.steps||[]).join('\n'):(currentDoc.editableText||'');
 $('#docDialog').showModal();
}
function saveDocEdit(e){
 e.preventDefault();
 const title=$('#docTitleInput').value.trim();
 const text=$('#docTextInput').value.trim();
 if(!title)return;
 currentDoc.title=title;
 if(Array.isArray(currentDoc.steps))currentDoc.steps=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 else currentDoc.editableText=text;
 saveDocs();$('#docDialog').close();renderContent();
}
function resetCurrentDoc(){
 const original=baseDocs.find(d=>d.id===currentDoc.id);
 if(!original||!confirm('Να επανέλθει το αρχικό κείμενο αυτού του εγγράφου;'))return;
 const i=docs.findIndex(d=>d.id===currentDoc.id);docs[i]=cloneValue(original);currentDoc=docs[i];saveDocs();renderContent();
}

function showTextDialog(){$('#noteTitle').value='';$('#noteBody').value='';$('#textDialog').showModal()}
async function saveText(e){e.preventDefault();const title=$('#noteTitle').value.trim(),body=$('#noteBody').value.trim();if(!title||!body)return;await dbAdd('notes',{section:additionKey(),title,body,createdAt:Date.now()});$('#textDialog').close();renderContent()}
function showPhotoDialog(category='external'){$('#photoCategory').value=category;$('#photoFiles').value='';$('#photoDialog').showModal()}
async function handlePhotos(files,category){for(const f of files){if(!f.type.startsWith('image/'))continue;const data=await compressImage(f);await dbAdd('photos',{section:additionKey(),category,data,name:f.name,createdAt:Date.now()})}$('#photoDialog').close();renderContent()}
function compressImage(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const im=new Image();im.onload=()=>{const max=1600,scale=Math.min(1,max/Math.max(im.width,im.height));const cv=document.createElement('canvas');cv.width=Math.round(im.width*scale);cv.height=Math.round(im.height*scale);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL('image/jpeg',.82))};im.src=r.result};r.readAsDataURL(file)})}

function showSectionDialog(section=null){
 editingSectionId=section?.id||null;$('#sectionDialogTitle').textContent=section?'Επεξεργασία τομέα':'Προσθήκη νέου τομέα';
 $('#sectionTitleInput').value=section?.title||'';$('#sectionIconInput').value=section?.icon||'▧';$('#sectionDescInput').value=section?.desc||'';$('#sectionPurposeInput').value=section?.purpose||'';$('#sectionOutputInput').value=section?.output||'';$('#sectionPropertiesInput').value=(section?.properties||[]).join('\n');$('#sectionAnalysisInput').value=section?.analysisPurpose||'';$('#sectionNotesInput').value=section?.notes||'';$('#deleteSectionBtn').hidden=!section||!section.custom;$('#sectionDialog').showModal();
}
function saveSection(e){
 e.preventDefault();const title=$('#sectionTitleInput').value.trim();if(!title)return;
 const data={title,icon:$('#sectionIconInput').value.trim()||'▧',desc:$('#sectionDescInput').value.trim(),purpose:$('#sectionPurposeInput').value.trim(),output:$('#sectionOutputInput').value.trim(),properties:$('#sectionPropertiesInput').value.split('\n').map(x=>x.trim()).filter(Boolean),analysisPurpose:$('#sectionAnalysisInput').value.trim(),notes:$('#sectionNotesInput').value.trim()};
 if(editingSectionId){const i=sections.findIndex(s=>s.id===editingSectionId);sections[i]={...sections[i],...data}}else{const id='custom-'+Date.now();const newSection={group:'Προσωπικοί Τομείς',id,custom:true,...data};const insertAt=sections.findIndex(s=>s.id==='flow');sections.splice(insertAt<0?sections.length:insertAt,0,newSection);currentSection=newSection}
 saveSections();$('#sectionDialog').close();buildNav();selectSection(sections.find(s=>s.id===currentSection.id)||currentSection)
}
function deleteCurrentCustomSection(){if(!editingSectionId)return;const s=sections.find(x=>x.id===editingSectionId);if(!s?.custom)return;if(!confirm('Να διαγραφεί αυτός ο προσωπικός τομέας;'))return;sections=sections.filter(x=>x.id!==editingSectionId);saveSections();$('#sectionDialog').close();selectSection(sections[0])}
function resetSectionData(){if(!confirm('Να επανέλθουν οι αρχικοί τομείς και τα κείμενα της έκδοσης V5; Οι προσωπικοί τομείς και οι αλλαγές στα στοιχεία τομέων θα αφαιρεθούν. Οι φωτογραφίες και οι πρόσθετες σημειώσεις δεν διαγράφονται.'))return;sections=structuredClone(baseSections);saveSections();selectSection(sections[0])}
function closeSidebar(){$('#sidebar').classList.remove('open');$('#backdrop').classList.remove('show')}

$('#searchInput').oninput=e=>buildNav(e.target.value);$('#openSidebar').onclick=()=>{$('#sidebar').classList.add('open');$('#backdrop').classList.add('show')};$('#closeSidebar').onclick=closeSidebar;$('#backdrop').onclick=closeSidebar;
$('#addTextTop').onclick=showTextDialog;$('#addTextSide').onclick=showTextDialog;$('#textForm').onsubmit=saveText;$('#addPhotoTop').onclick=()=>showPhotoDialog('external');$('#addPhotoSide').onclick=()=>showPhotoDialog('external');$('#photoForm').onsubmit=async e=>{e.preventDefault();await handlePhotos([...$('#photoFiles').files],$('#photoCategory').value)};
$('#addSectionTop').onclick=()=>showSectionDialog();$('#addSectionSide').onclick=()=>showSectionDialog();document.querySelectorAll('.edit-section-btn').forEach(b=>b.onclick=()=>editableSection()&&showSectionDialog(currentSection));$('#sectionForm').onsubmit=saveSection;$('#docForm').onsubmit=saveDocEdit;$('#deleteSectionBtn').onclick=deleteCurrentCustomSection;$('#resetSections').onclick=resetSectionData;
$('#closeImage').onclick=()=>$('#imageDialog').close();$('#openOriginal').onclick=()=>window.open('original-manual.pdf','_blank');
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});buildNav();selectSection(homeSection);
