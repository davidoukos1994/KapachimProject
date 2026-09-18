// Opens synchronously in the click gesture so Safari on iPhone permits printing.
window.printKapachimManual=async function(){
  const preview=window.open('','_blank');
  if(!preview){alert('Επίτρεψε τα αναδυόμενα παράθυρα για να ανοίξει η εκτύπωση.');return}
  preview.document.write('<!doctype html><html lang="el"><meta charset="utf-8"><title>Kapachim Project — Εκτύπωση</title><body><p>Φόρτωση του online περιεχομένου…</p></body></html>');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paragraphs=value=>esc(value).replace(/\n/g,'<br>');
  const asset=value=>new URL(value,location.href).href;
  try{
    const {notes,photos}=await window.getKapachimPrintData();
    const noteBlocks=section=>notes.filter(n=>n.section===section).map(n=>`<div class="block"><h3>${esc(n.title)}</h3><p>${paragraphs(n.body)}</p></div>`).join('');
    const photoBlocks=section=>photos.filter(p=>p.section===section).map(p=>`<figure><img src="${esc(p.data)}" alt="${esc(p.name)}"><figcaption>${esc(p.name)}</figcaption></figure>`).join('');
    const content=sections.filter(s=>!['home','settings'].includes(s.type)).map(section=>{
      const procedures=notes.filter(n=>n.section===`${section.id}::procedures`).map(n=>`<div class="block"><h3>${esc(n.title)}</h3><p>${paragraphs(n.body)}</p>${photoBlocks(`procedure::${n.id}`)}</div>`).join('');
      const docContent=section.type==='documents'?docs.map(doc=>`<div class="doc"><h3>${esc(doc.title)}</h3>${doc.text?`<p>${paragraphs(doc.text)}</p>`:''}${doc.body?`<p>${paragraphs(doc.body)}</p>`:''}${doc.editableText?`<p>${paragraphs(doc.editableText)}</p>`:''}${Number.isInteger(doc.page)?`<figure><img src="${esc(asset(`assets/pages/page-${String(doc.page).padStart(2,'0')}.webp`))}" alt="${esc(doc.title)}"></figure>`:''}${Array.isArray(doc.steps)?doc.steps.map((step,i)=>`<div class="block"><h4>Βήμα ${i+1}</h4><p>${paragraphs(typeof step==='string'?step:JSON.stringify(step))}</p>${photoBlocks(`${doc.id}::step::${i}`)}</div>`).join(''):''}${noteBlocks(doc.id)}${photoBlocks(doc.id)}</div>`).join(''):'';
      const image=section.overviewImage||section.builtInImages?.[0]||(Number.isFinite(Number(section.page))?`assets/pages/page-${String(section.page).padStart(2,'0')}.webp`:null);
      return `<section class="chapter"><h2>${esc(section.title)}</h2>${image?`<figure><img src="${esc(asset(image))}" alt="${esc(section.title)}"></figure>`:''}${section.desc?`<p>${paragraphs(section.desc)}</p>`:''}${section.purpose?`<p><b>Σκοπός:</b> ${paragraphs(section.purpose)}</p>`:''}${section.output?`<p><b>Έξοδος:</b> ${paragraphs(section.output)}</p>`:''}${section.properties?.length?`<h3>Ιδιότητες</h3><ul>${section.properties.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}${section.notes?`<h3>Παρατηρήσεις</h3><p>${paragraphs(section.notes)}</p>`:''}${docContent}${noteBlocks(section.id)}${photoBlocks(section.id)}${procedures}</section>`;
    }).join('');
    preview.document.open();
    preview.document.write(`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kapachim Project — PDF</title><style>body{font:15px/1.5 Arial,sans-serif;color:#1b2941;margin:0 auto;max-width:850px;padding:22px}header{border-bottom:3px solid #153661;margin-bottom:28px}.toolbar{position:sticky;top:0;background:white;padding:12px;border-bottom:1px solid #ddd}button{font:inherit;background:#173d76;color:white;border:0;border-radius:9px;padding:11px 18px}h1,h2,h3{color:#153661}h2{border-bottom:1px solid #bdc9d8;padding-bottom:7px}.chapter{break-before:page}.chapter:first-of-type{break-before:auto}.block,figure,.doc{break-inside:avoid}figure{margin:16px 0}figure img{display:block;max-width:100%;max-height:230mm;object-fit:contain}figcaption{font-size:12px;color:#526078}p{white-space:normal;overflow-wrap:anywhere}@page{size:A4;margin:15mm}@media print{body{max-width:none;padding:0}.toolbar{display:none}.chapter{page-break-before:always}}</style></head><body><div class="toolbar"><button onclick="window.print()">Εκτύπωση / Αποθήκευση ως PDF</button></div><header><h1>Kapachim Project</h1><p>Εκτυπώσιμη έκδοση · ${esc(new Date().toLocaleString('el-GR'))}</p></header>${content}</body></html>`);
    preview.document.close();
  }catch(error){preview.document.body.textContent=`Δεν φορτώθηκε το περιεχόμενο για εκτύπωση: ${error.message}`}
};
