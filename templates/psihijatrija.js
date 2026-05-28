// Auto-extracted from n8n workflow pQ2khjWOh0cXGt3l (Opsis - Email Sequence v5 - Psihijatrijske ordinacije)
// Industry: psihijatrija
module.exports = {
  E1: {
    V1: {
      subject: `web vam ne radi`,
      body: `Pozdrav,

vidim da {{website}} trenutno vraca gresku ({{website_status}}). Ljudi koji Vas Googlaju ("psihijatar {{Grad}}", "privatna psihijatrija {{Grad}}") trenutno samo dobivaju prazan ekran - a cesto su to pacijenti koji su skupili hrabrost da prvi put potraze pomoc, pa ako stranica ne radi, jednostavno odustanu.

Najcesca 3 razloga (i kako provjeriti):

1) Istekao SSL certifikat - provjerite na ssllabs.com/ssltest/, upisite Vas domen, ako vidite "expired" → kontaktirajte hostera, vecina ga obnovi besplatno u 10 minuta.

2) Hosting server pao - ulogirajte se u hosting panel (cPanel, Plesk, Hostinger panel...) i pogledajte ima li poruka o nedostupnosti.

3) DNS problem - upisite Vas domen na dnschecker.org. Ako neke zemlje pokazuju crveno, propagacija je zapela.

Ako stane na bilo kojem koraku, slobodno mi odgovorite na ovaj mail s screenshotom - kazem Vam u 2 recenice sto napraviti.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V2: {
      subject: `mala stvar za Vas Google profil`,
      body: `Pozdrav,

slucajno sam naletio na Vas Google Business profil dok sam trazio psihijatra u {{Grad}}u - {{review_count}} recenzija, ocjena {{review_rating}}, sve stvari koje pacijentu koji se prvi put obraca ulijevaju povjerenje.

Primijetio sam jednu malu stvar koja Vam moze pomoci da ljudi prije nego sto nazovu vec znaju sto ocekivati (a to im jako olaksava prvi kontakt):

Google profil ima sekciju "Postovi" koju vecina privatnih psihijatara uopce ne koristi. Google penalizira profile bez recentnih postova - ako nista ne objavljujete tjednima, profil pada u rangu za lokalne pretrage tipa "psihijatar {{Grad}}".

Sto treba: 1 post tjedno, ne mora biti dug ni osoban. Primjeri:
- "Kako izgleda prvi razgovor" (informacija sto ocekivati - smanjuje strah)
- Edukativni mini-post (npr. razlika izmedu psihijatra i psihologa)
- Obavijest o slobodnim terminima ili online opciji
- Diskretni podsjetnik o povjerljivosti i anonimnosti

Sve moze biti potpuno neutralno, bez fotografija pacijenata. Postavlja se za 2 minute preko Google Business aplikacije.

Razlika obicno vidljiva za 2-3 tjedna - vise ljudi koji vec znaju sto ocekivati, manje "praznih" poziva.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V3: {
      subject: `Chrome upozorenje na Vasoj stranici`,
      body: `Pozdrav,

otvorio sam {{website}} u Chromeu i odmah dobio upozorenje "Veza nije sigurna". Razlog: stranica nema HTTPS (SSL certifikat). Za psihijatrijsku praksu to je posebno osjetljivo - pacijenti koji vide "Veza nije sigurna" obicno odmah zatvore tab jer pretpostavljaju da podaci nisu zasticeni, a kod mentalnog zdravlja povjerljivost je sve.

To je trenutno besplatno za rijesiti i traje 10 minuta:

Ako koristite Hostinger, Bluehost, SiteGround ili slican host:
1) Login u hosting panel
2) Pronadite sekciju "SSL" ili "Security"
3) Kliknite "Install Let's Encrypt SSL" (besplatno je)
4) Pricekajte 5 minuta da se propagira

Ako koristite WordPress, nakon SSL instalacije idite u Settings → General i promijenite "http://" u "https://" za WordPress Address i Site Address.

Nakon toga Chrome vise nece prikazivati upozorenje, a Google ce prestati gurati Vasu stranicu nize u rezultatima pretrage (rangira HTTPS stranice vise od 2014.).

Ako se zaglavi negdje, javite - pomognem u 2 poruke.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V4: {
      subject: `Google ne vidi cijelu Vasu stranicu`,
      body: `Pozdrav,

provjerio sam {{website}} kroz alat za SEO i vidio jednu stvar koja se lako rjesava: nemate sitemap.xml.

Sitemap je tekstualni fajl koji govori Googleu "evo svih stranica koje imam, indeksiraj ih". Bez njega Google sam pogada sto imate, i obicno propusti pola stranica - sto je steta, jer bas stranice o pristupu, terapijama i timu pomazu pacijentima da odluce prije prvog koraka (koji im je inace najtezi).

Generirao sam okvirni sitemap za Vasu ordinaciju, kopirajte u obican tekst editor, snimite kao "sitemap.xml":

  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>{{website}}/</loc><priority>1.0</priority></url>
    <url><loc>{{website}}/pristup</loc><priority>0.9</priority></url>
    <url><loc>{{website}}/terapije</loc><priority>0.9</priority></url>
    <url><loc>{{website}}/cjenik</loc><priority>0.8</priority></url>
    <url><loc>{{website}}/tim</loc><priority>0.8</priority></url>
    <url><loc>{{website}}/kontakt</loc><priority>0.7</priority></url>
  </urlset>

Koraci:
1) Postavite fajl na {{website}}/sitemap.xml (FTP, file manager, ili Yoast plugin za WordPress radi to automatski)
2) Idite na search.google.com/search-console
3) Dodajte Vas domen kao novu property
4) Pod "Sitemaps" submitajte "sitemap.xml"
5) Za 7-14 dana Google ce indeksirati sve stranice

Ako imate i posebne stranice (npr. online terapija, anksioznost, depresija), javite ih, pa Vam prilagodim sitemap.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V5: {
      subject: `nemate Analytics - propustate vazne podatke`,
      body: `Pozdrav,

pogledao sam izvorni kod {{website}} i vidio da na stranici nemate ni Google Analytics ni Facebook Pixel. To znaci da:

- Ne znate koliko ljudi mjesecno dolazi na stranicu
- Ne znate odakle dolaze (Google, preporuka, direktno...)
- Ne znate koje informacije najvise traze (cjenik, "kako izgleda prvi razgovor", online opcija)

Google Analytics 4 je besplatan i postavlja se za 10 minuta:

1) Idite na analytics.google.com → "Start measuring"
2) Account name: "{{title}}"
3) Property name: "{{title}}", odaberite vremensku zonu Croatia
4) Data Stream → Web → upisite {{website}}
5) Dobit cete kod koji izgleda ovako:

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXX');
  </script>

6) Taj kod ide u <head> sekciju svake stranice (u WordPressu obicno header.php, ili kroz plugin "Insert Headers and Footers")

Napomena: GA4 ne prati osobne zdravstvene podatke, samo agregirani saobracaj - kompatibilno s GDPR-om uz standardni cookie banner. Ne vidi tko je tko, samo "30 ljudi je danas doslo na cjenik".

Za 24-48h imat cete prve podatke. Najkorisnije: vidite koji su sadrzaji ljudima najvazniji prije nego sto se odluce javiti - pa ih mozete istaknuti na home stranici. Cesto se ispostavi da ljudi traze bas ono sto je ordinaciji "skriveno" u footeru.

Ako se nesto zaglavi pri postavljanju, slobodno pitajte.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V6: {
      subject: `WhatsApp odgovori za prvi kontakt s pacijentom`,
      body: `Pozdrav,

pretpostavljam da znate koliko je tesko ljudima napraviti prvi korak - cesto zovu i spuste prije nego sto netko odgovori, ili salju poruke u 23h jer ne znaju u koje vrijeme se "smiju" javiti. Pisana komunikacija im je puno laksa od telefona, posebno kod prvog kontakta.

WhatsApp Business aplikacija ima sekciju "Quick Replies" koja Vam dosta toga rijesi diskretno i bez osjecaja "ureda". Evo 4 gotova odgovora koje mozete kopirati i koristiti:

1) Prvi kontakt (kracenica: /prvi-kontakt)
"Pozdrav i hvala sto ste se javili. Sve sto napisete tretira se povjerljivo. Za prvi termin trebamo samo: ime (moze i inicijali), broj na koji mozemo nazvati ili odgovoriti, i kratko sto Vas muci (samo nekoliko rijeci - ne mora biti detaljno). Vremena: jutarnji ili popodnevni termin. Ako Vam je lakse, na skali 1-10 - koliko Vam je trenutno tesko? To nam pomaze odrediti hitnost."

2) Termin (kracenica: /termin)
"Termini traju 50 min. Trenutno imamo slobodne termine u jutarnjim satima ovaj tjedan i popodnevne sljedeci. Postoji i opcija online razgovora (Zoom/WhatsApp video) - za ljude kojima je lakse prvi put iz vlastitog prostora. Javite sto Vam odgovara."

3) Troskovi (kracenica: /troskovi)
"Prva konzultacija X EUR, redovni terminski razgovor Y EUR. Postoji i paket od 10 razgovora po Z EUR. Placanje gotovinski ili karticno, na kraju termina. Nema obveze nastavka - odluka je uvijek Vasa."

4) Hitno (kracenica: /hitno)
"Ako trenutno razmisljate da naudite sebi ili imate akutnu krizu, molim Vas nazovite odmah: Hitna pomoc 112 ili 194, KBC psihijatrija {{Grad}} (24/7), Plavi telefon 01 4833 888, SOS telefon 116 123. Ako nije akutno ali je tesko, javite ovdje detaljnije pa Vam dam najraniji termin (cesto unutar 24-48h)."

Postavlja se za 5 minuta: WhatsApp Business → Settings → Business tools → Quick replies → Add new.

Bonus: na Google profil dodajte WhatsApp link s porukom "Posaljite poruku diskretno" - ljudi kojima je telefon prepreka napokon imaju ulaz.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V7: {
      subject: `Vasa stranica se sporo otvara na mobitelu`,
      body: `Pozdrav,

testirao sam {{website}} kroz Google PageSpeed Insights - mobile rezultat je {{pagespeed_mobile}}/100. Sve ispod 50 znaci da posjetitelji cekaju 4-6 sekundi da se stranica ucita, a 53% ljudi odustane prije nego sto se uopce prikaze (Google podatak). Za ljude koji se prvi put odlucuju javiti psihijatru taj prozor je jos kraci - ako se ne otvori odmah, vracaju se na Google.

3 stvari koje obicno najvise ubrzaju (lako za napraviti):

1) Komprimirajte slike
   Idite na tinypng.com, uploadajte sve slike s Vase stranice, downloadajte komprimirane verzije, zamijenite original. Obicno smanji slike za 60-70% bez vidljivog gubitka kvalitete.

2) Pretvorite slike u WebP format
   WebP je 50% manji od JPG-a, podrzava ga svaki browser. Alat: squoosh.app (besplatan, radi u browseru). Uploadate JPG, downloadate WebP.

3) Aktivirajte browser caching
   Ako koristite Apache hosting (cPanel), dodajte u .htaccess fajl:

     <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType image/jpg "access plus 1 year"
     ExpiresByType image/png "access plus 1 year"
     ExpiresByType image/webp "access plus 1 year"
     ExpiresByType text/css "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
     </IfModule>

   Tako returning posjetitelji ne moraju ponovno ucitavati slike.

Nakon ovih 3 koraka ponovno testirajte na pagespeed.web.dev - trebao bi skok od 15-25 bodova.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V8: {
      subject: `kako Vasa stranica izgleda u Google rezultatima`,
      body: `Pozdrav,

primijetio sam jednu malu stvar na {{website}} koja utjece na to kako Vasa stranica izgleda kad se pojavi u Google rezultatima ili kad netko diskretno podijeli link prijatelju koji trazi pomoc.

Nedostaje par meta tagova u <head> sekciji. Posljedica:
- Google sam smislja tekst koji se prikaze ispod naslova u rezultatima (umjesto Vaseg pazljivo formuliranog opisa)
- Kad netko podijeli Vas link, prikaze se prazno (bez slike, bez opisa) - sto bas za psihijatrijsku praksu izgleda manje profesionalno
- Nemate "rich snippets" (zvjezdice, ocjene) u Google rezultatima - sto novim pacijentima signalizira povjerenje

Napisao sam Vam gotove tagove, samo paste u <head> sekciju HTML-a:

  <!-- Meta description za Google -->
  <meta name="description" content="{{title}} - privatna psihijatrija u {{Grad}}u. {{review_count}}+ recenzija, ocjena {{review_rating}}/5. Povjerljivost zagarantirana. Kontakt: {{phone}}.">

  <!-- Open Graph (za Facebook/WhatsApp/LinkedIn share) -->
  <meta property="og:title" content="{{title}} - psihijatar {{Grad}}">
  <meta property="og:description" content="Privatna psihijatrijska praksa u {{Grad}}u. Diskretno, povjerljivo, online ili u ordinaciji.">
  <meta property="og:image" content="{{website}}/cover.jpg">
  <meta property="og:url" content="{{website}}">

  <!-- Schema za Google rich results -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "name": "{{title}}",
    "url": "{{website}}",
    "telephone": "{{phone}}",
    "medicalSpecialty": "https://schema.org/Psychiatric",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "{{Grad}}",
      "addressCountry": "HR"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "{{review_rating}}",
      "reviewCount": "{{review_count}}"
    }
  }
  </script>

Paste sve u <head> nakon <title> taga. Za "cover.jpg" upload neku neutralnu sliku (ordinacija, mirna scena) u root domena, dimenzija 1200x630px.

Test rezultata: search.google.com/test/rich-results - upisite Vas domen, vidite hoce li sad prikazivati zvjezdice i ocjenu.

Za 7-14 dana trebali biste vidjeti porast click-through rate iz Google rezultata.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V9: {
      subject: `5 sitnica za bolji broj prvih kontakata`,
      body: `Pozdrav,

prosetao sam Vasom stranicom {{website}} - sve izgleda solidno tehnicki (brzina, SEO, HTTPS, struktura). Bravo, vidi se rad iza toga.

Posto je tehnicka strana poslozena, evo 5 sitnica koje obicno pomazu privatnim psihijatrima da vise ljudi napravi taj teski prvi korak iz iste kolicine prometa:

1) Telefonski broj klikabilan na mobitelu
   U HTML-u broj treba biti zamotan u <a href="tel:{{phone_clean}}">{{phone}}</a> - kad mobilni korisnik klikne, otvara dial direktno. Tipicno 10-20% vise poziva ako trenutno nije klikabilan.

2) WhatsApp click button s diskretnim disclaimerom
   Dodajte negdje vidljivo na stranicu:
   <a href="https://wa.me/{{phone_intl}}?text=Pozdrav,%20zanima%20me%20termin">Posaljite poruku diskretno na WhatsApp</a>
   Ispod male slove: "Sve poruke tretiraju se povjerljivo. Odgovaramo radnim danom 9-18h." Telefonska barijera je za mnoge ljude prevelika - WhatsApp im daje siguran ulaz.

3) Online booking widget za prvu konzultaciju
   Calendly ima medical/healthcare opciju koja sakriva imena drugih klijenata i pita samo minimum (ime, kontakt, prefer time). Embed na stranicu, pacijent rezervira sam bez razgovora - odlicno za one kojima je javljanje najtezi dio.

4) Trust signali iznad fold-a (prvih 600px stranice)
   "Licencirani psihijatar od X godina", "{{review_count}}+ pacijenata", "Povjerljivost zagarantirana", opcija online razgovora. Bez fotografija pacijenata. Smanjuje strah pred prvim korakom.

5) Mjesecni speed re-check
   Stavite si reminder u kalendaru za mjesecnu provjeru na pagespeed.web.dev - speed pada s vremenom kako se dodaju slike, plugini, scripts.

Sve to mozete sami implementirati u par sati. Razlika vidljiva 2-4 tjedna.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
  },
  E2: {
    DEFAULT: {
      subject: `jeste li uspjeli s onim prosli put?`,
      body: `Pozdrav,

prije 3 dana poslao sam Vam neke prijedloge oko Vase web stranice - htio sam samo provjeriti je li nesto od toga bilo korisno.

Razumijem ako niste imali vremena, to ide na dno svake to-do liste. Ako se zaglavilo bilo gdje, slobodno mi odgovorite par redaka - posaljem konkretne korake za Vas slucaj.

Inace, ako Vas zanima razgovor o tome kako se ovakve stvari mogu posloziti automatski (bez Vaseg vremena svaki tjedan), nudimo besplatnu konzultaciju 30min:

→ opsisdalmatia.com/besplatna-konzultacija

Bez obveze, samo razgovor o tome sto Vam najvise smeta i ima li smisla nesto promijeniti.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    }
  },
  E3: {
    V1: {
      subject: `konkretna ponuda za Vas slucaj`,
      body: `Pozdrav,

prije par dana spomenuo sam da Vam web stranica ima problem ({{website_status}}). Pretpostavljam da to jos nije rijeseno jer su takve stvari obicno dno prioriteta dok se ne stigne.

Evo konkretne ponude ako Vam treba da netko to skine s plate:

**Nova web stranica + AI Chatbot - 1000 EUR jednokratno**
- Responzivan dizajn (mobitel + desktop)
- AI chatbot integriran u stranicu (obucen na Vasim podacima)
- SEO optimizacija ukljucena
- SSL certifikat + hosting
- Google Analytics postavljanje
- Kontakt forma s notifikacijama
- Do 10 stranica sadrzaja
- CMS za upravljanje sadrzajem
- Implementacija 10-14 dana
- 30 dana besplatne podrske nakon isporuke

Odrzavanje chatbota: ~10 EUR/mj (hosting + azuriranja modela).

Bez ugovorne obveze, placate jednom - rjesenje je Vase zauvijek.

Ako Vas zanima razgovor, evo link za besplatnu 30-min konzultaciju (bez obveze, cak i ako odlucite ne raditi s nama):

→ opsisdalmatia.com/besplatna-konzultacija

Ili samo odgovorite na ovaj mail s 2-3 termina koja Vam odgovaraju.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V2: {
      subject: `kompletno online prisustvo za {{Kategorija_lc}}`,
      body: `Pozdrav,

vidio sam u Vasem Google profilu sve sto treba da klijenti vjeruju brendu - {{review_count}} recenzija, ocjena {{review_rating}}/5. Ali bez web stranice klijenti koji Vas Googlaju imaju ogranicenje: ne mogu rezervirati ili saznati detalje izvan radnog vremena Vase recepcije.

Evo paketa koji rjesava cijelu pricu odjednom:

**Web Stranica + AI Chatbot - 1000 EUR jednokratno**

Web stranica:
- Responzivan dizajn (mobitel + desktop)
- SEO optimizacija
- SSL certifikat + hosting + Google Analytics
- Do 10 stranica sadrzaja
- Implementacija 10-14 dana

AI Chatbot:
- Obucen na Vasim podacima
- Web widget + WhatsApp + Telegram
- Visejezicna podrska
- Automatsko prikupljanje leadova
- Analitika razgovora
- Neogranicen broj razgovora

Odrzavanje chatbota: ~10 EUR/mj (hosting + azuriranja modela).

Krajnji rezultat: klijenti rezerviraju i pitaju 24/7, cak i kad zatvoreno.

Ako Vas zanima razgovor, evo link za besplatnu 30-min konzultaciju:

→ opsisdalmatia.com/besplatna-konzultacija

Ili odgovorite s 2-3 termina koja Vam odgovaraju.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V3: {
      subject: `redesign Vase stranice - HTTPS + brzina rijeseno`,
      body: `Pozdrav,

prosli put sam spomenuo HTTPS i brzinu - to su stvari koje se mogu krpit ali cesto je jeftinije i sigurnije napravit novu stranicu nego krpati staru (pogotovo ako je stara WordPress sa starim pluginima).

Evo paketa koji rjesava sve odjednom:

**Nova web stranica + AI Chatbot - 1000 EUR jednokratno**
- HTTPS ukljucen (SSL certifikat besplatno, dozivotno)
- Mobile speed 85-95/100 (testirano prije isporuke)
- Responzivan dizajn (mobitel + desktop)
- AI chatbot integriran u stranicu (obucen na Vasim podacima)
- SEO optimizacija ukljucena
- Hosting + Google Analytics setup
- Kontakt forma s notifikacijama
- Do 10 stranica sadrzaja
- CMS za sami upravljati sadrzajem kasnije
- Implementacija 10-14 dana
- 30 dana besplatne podrske nakon isporuke

Odrzavanje chatbota: ~10 EUR/mj (hosting + azuriranja modela).

Bez ugovorne obveze, placate jednom.

Ako Vas zanima razgovor o tome je li redesign isplativiji nego krpanje stare, evo link za besplatnu 30-min konzultaciju:

→ opsisdalmatia.com/besplatna-konzultacija

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V4: {
      subject: `da Vas Google konacno vidi`,
      body: `Pozdrav,

prosli put sam Vam poslao sitemap.xml - ako ste ga implementirali, super, vec je veliki korak. Ali to je 1 od ~20 tehnickih SEO faktora - Google koristi sve njih kad odlucuje hoce li Vas prikazati visoko u rezultatima.

Ako Vam je vazno da Vas vise potencijalnih klijenata pronade organski (bez placanja oglasa), evo paketa:

**SEO Optimizacija - 199 EUR/mj**
- Tehnicki SEO audit (pocetni, detaljan)
- On-page optimizacija (meta, headings, internal links)
- Lokalni SEO (Google Business Profile)
- Optimizacija za AI trazilice (GEO - ChatGPT, Perplexity)
- Keyword istrazivanje za Vasu nisu
- Mjesecni izvjestaji s napretkom
- Link building strategija
- Optimizacija brzine stranice

Tipican rezultat: 30-60% vise organskog prometa u 3-6 mjeseci.

Bez dugorocnog ugovora - mozete otkazati s 30 dana najave, Vasi rankings i konfiguracije ostaju Vase.

Razgovor o tome ima li smisla za Vasu nisu - besplatna 30-min konzultacija:

→ opsisdalmatia.com/besplatna-konzultacija

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V5: {
      subject: `tracking + automatski izvjestaji za Vas biznis`,
      body: `Pozdrav,

prosli put sam Vam objasnio kako postaviti Google Analytics - to je prvi korak. Ali sami podaci u Analyticsu rijetko sto govore ako ih nitko ne pretvori u akcijske informacije ("sto treba napraviti ovaj tjedan").

Evo paketa koji rjesava cijelu pricu:

**Automatizacija + Tracking - od 399 EUR jednokratno**
- Analiza Vasih postojecih procesa
- Dizajn automatiziranog tijeka rada
- GA4 + FB Pixel setup (ili check ako vec imate)
- Automatski mjesecni izvjestaj (PDF + email):
   * Koliko Vas mjesecno trazi (Google + Instagram + direct)
   * Koje stranice gledaju, gdje odustaju
   * Koliko ih klikne na "rezerviraj"/"kontakt"
   * Sto napraviti iduci mjesec za rast
- CRM integracija (ako koristite)
- Booking sustav integracija
- 30 dana besplatne podrske

Bez ugovorne obveze, placate jednom. Mjesecni izvjestaji idu automatski svakog 1-og u mjesecu na Vas email.

Razgovor o tome sto ima smisla u Vasem slucaju - besplatna 30-min konzultacija:

→ opsisdalmatia.com/besplatna-konzultacija

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V6: {
      subject: `AI koji odgovara na upite umjesto Vas`,
      body: `Pozdrav,

prosli put sam Vam poslao gotove WhatsApp odgovore - to rijesava dio rutine, ali ako primjecujete da ipak gubite klijente koji pisu ili zovu izvan radnog vremena (a HR turisti iz EU salju upite u 23h), AI rjesenje to pokriva 24/7.

Imamo dvije opcije, ovisno o tome kako Vam klijenti dolaze:

**Opcija A: AI Chatbot - 700 EUR izrada + ~10 EUR/mj odrzavanje**
- Obucen na Vasim podacima i dokumentima
- Radi na webu, WhatsAppu i Telegramu
- Visejezicna podrska (HR/EN/IT/DE)
- Automatsko prikupljanje leadova
- Eskalacija na Vas ako je pitanje slozeno
- Analitika svih razgovora
- Neogranicen broj razgovora
- Odrzavanje pokriva hosting + azuriranja modela

**Opcija B: AI Voice Agent - 1000 EUR izrada + 0.1 EUR/min razgovora**
Javlja se na telefonske pozive 24/7/365 u Vase ime, na hrvatskom, engleskom i njemackom. Booking, zakazivanje, prosljedivanje hitnih poziva, integracija s Google Calendar. Placate samo realne minute razgovora - nema fiksnog mjesecnog troska.

**Opcija C: Chatbot + Voice Agent zajedno - 1300 EUR izrada**
(usteda 400 EUR vs zasebno) + ~10 EUR/mj chatbot odrzavanje + 0.1 EUR/min za voice.

Bez dugorocne obveze, sve konfiguracije ostaju Vase.

Najlakse je vidjeti uzivo kako radi - besplatna 30-min demo + konzultacija:

→ opsisdalmatia.com/besplatna-konzultacija

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V7: {
      subject: `stranica koja se otvara u 1.5s na mobitelu`,
      body: `Pozdrav,

prosli put smo prosli kroz 3 brza speed fixa (tinypng, WebP, caching) - ako ste implementirali, probajte ponovno testirat na pagespeed.web.dev, trebalo bi biti bolje.

Ali ako ste primijetili da je problem dublji - mozda stara WordPress instalacija s 30+ plugin-a koji se gone - cesto je jeftinije i sigurnije napravit novu stranicu nego sve to pokusavati optimizirati.

Evo paketa:

**Nova web stranica (speed-fokus) + AI Chatbot - 1000 EUR jednokratno**
- Mobile speed 85-95/100 (testirano prije isporuke)
- Desktop speed 95-99/100
- Responzivan dizajn (mobitel + desktop)
- AI chatbot integriran (obucen na Vasim podacima)
- SEO + SSL + hosting + Analytics setup
- Bez tipicnih WordPress bloat-ova (React/Next.js stack)
- Kontakt forma s notifikacijama
- Do 10 stranica sadrzaja
- CMS za samostalno upravljanje sadrzajem
- Implementacija 10-14 dana
- 30 dana besplatne podrske

Odrzavanje chatbota: ~10 EUR/mj (hosting + azuriranja modela).

Bez ugovorne obveze.

Razgovor o tome je li redesign isplativiji od optimizacije postojeceg - besplatna 30-min konzultacija:

→ opsisdalmatia.com/besplatna-konzultacija

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V8: {
      subject: `bolji prikaz u Google rezultatima`,
      body: `Pozdrav,

prosli put sam poslao gotove meta tagove i schema markup za copy-paste. Ako ste implementirali, super - to je 20% posla. Ostalih 80% je kontinuirano: azuriranje sadrzaja, dodavanje novih kljucnih rijeci, lokalni SEO, link building.

Ako zelite da to netko drugi vodi sustavno svaki mjesec, evo paketa:

**SEO Optimizacija - 199 EUR/mj**
- Pocetni tehnicki SEO audit (detaljan)
- On-page optimizacija
- Lokalni SEO (Google Business Profile)
- Optimizacija za AI trazilice (GEO - ChatGPT, Perplexity)
- Keyword istrazivanje za Vasu nisu
- Mjesecni izvjestaji o pozicijama
- Link building strategija (kvalitetni backlinkovi)
- Optimizacija brzine stranice

Tipican rezultat: 30-60% vise organskog prometa za 3-6 mj.

Mozete otkazati s 30 dana najave - Vasi rezultati ostaju Vasi.

Razgovor o tome ima li smisla za Vasu konkurenciju - besplatna 30-min konzultacija:

→ opsisdalmatia.com/besplatna-konzultacija

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V9: {
      subject: `2 stvari koje obicno pomazu vec dobrim stranicama`,
      body: `Pozdrav,

prosli put sam Vam dao 5 sitnica za konverziju - sve su standard tehnike koje rade ako se implementiraju. Pretpostavljam da Vas tim vec radi na tome, jer Vasa stranica generalno izgleda solidno.

Ali ako razmisljate o slijedecem skoku - a to obicno znaci "kako uloviti vise klijenata iz iste kolicine prometa" + "kako redovito privlaciti novi promet" - evo 2 stvari koje cesto rade za vec-dobre stranice:

**1. AI Chatbot - 700 EUR izrada + ~10 EUR/mj odrzavanje**
Posjetitelji koji bi normalno otisli s 5-10 nepostavljenih pitanja sad ih postavljaju botu i konvertiraju. Tipicno 15-30% vise leadova iz istog prometa.
- Obucen na Vasim podacima
- Web + WhatsApp + Telegram
- Visejezicno (HR/EN/IT/DE)
- Odrzavanje pokriva hosting + azuriranja modela

**2. Content Creation - 149 EUR/mj**
Redovan SEO-optimirani sadrzaj koji privlaci organski promet kroz duzi period:
- AI blog postovi (4/mjesecno)
- Social media sadrzaj
- DALL-E vizuali i grafike
- Video produkcija (kratki formati)
- Content kalendar i strategija
- Visejezicni sadrzaj
- Mjesecni izvjestaji

Paketna ponuda za obje: popust (kontaktirajte za personaliziranu cijenu).

Razgovor o tome sto ima najveci ROI za Vasu nisu - besplatna 30-min konzultacija:

→ opsisdalmatia.com/besplatna-konzultacija

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
  },
  E4: {
    DEFAULT: {
      subject: `zadnji put pisem (obecajem)`,
      body: `Pozdrav,

ovo je zadnji mail - obecajem. Pisao sam Vam 3 puta:

1. Nesto sto mozete sami popraviti besplatno
2. Provjeru jeste li imali vremena
3. Konkretnu ponudu ako Vam treba pomoc

Nije bilo odgovora pa pretpostavljam da nije pravi trenutak ili tema nije relevantna. Potpuno OK, mice se s liste.

Jednu malu uslugu prije nego ode - ako Vam ne smeta odgovoriti jednom rijeci, javite koje od ovih je istina:

- **"Kasnije"** → pingam ponovno za 6 mjeseci, do tada miran sam
- **"Ne"** → micem Vas iz liste zauvijek, nece vise email-a
- **"Promaknulo mi je"** → posaljem zadnji put glavno sto sam htio reci

Razumijem ako ni to nije vrijedno odgovora - ne brinite, automatski Vas micem za 14 dana ako ne cujem nista.

Hvala sto ste izdvojili vrijeme da procitate.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    }
  }
};
