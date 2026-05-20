// Auto-extracted from n8n workflow P6t8mrXLJC59rrN8 (Opsis - Email Sequence v5 - Turisticke agencije i ture)
// Industry: tour
module.exports = {
  E1: {
    V1: {
      subject: `web vam ne radi`,
      body: `Pozdrav,

vidim da {{website}} trenutno vraca gresku ({{website_status}}). Gosti koji Vas Googlaju za ture u {{Grad}}u trenutno samo dobivaju prazan ekran - sto je posebno problematicno u sezoni kad svaki sat propustene vidljivosti znaci nekoliko izgubljenih rezervacija.

Najcesca 3 razloga (i kako provjeriti):

1) Istekao SSL certifikat - provjerite na ssllabs.com/ssltest/, upisite Vas domen, ako vidite "expired" ? kontaktirajte hostera, vecina ga obnovi besplatno u 10 minuta.

2) Hosting server pao - ulogirajte se u hosting panel (cPanel, Plesk, Hostinger panel...) i pogledajte ima li poruka o nedostupnosti.

3) DNS problem - upisite Vas domen na dnschecker.org. Ako neke zemlje pokazuju crveno, propagacija je zapela. Bitno kod turistickih stranica jer Vas cesto traze iz inozemstva.

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

slucajno sam naletio na Vas Google Business profil dok sam trazio turisticku agenciju u {{Grad}}u - {{review_count}} recenzija, ocjena {{review_rating}}, sve stvari koje gostima ulijevaju povjerenje prije nego sto rezerviraju turu.

Primijetio sam jednu malu stvar koja Vam moze povecati broj direktnih upita za 15-20% bez ikakvog troska:

Google profil ima sekciju "Postovi" (slicno kao Facebook postovi) koju vecina turistickih agencija uopce ne koristi. Google penalizira profile bez recentnih postova - ako nista ne objavljujete tjednima, profil pada u rangu za lokalne pretrage tipa "day tour {{Grad}}", "izleti {{Grad}}", "wine tour {{Grad}}".

Sto treba: 1 post tjedno, ne mora biti dugacak. Primjeri:
- Tura ovaj vikend (foto + 2 recenice na HR + EN)
- Sezonska tema ("Blue Cave summer schedule", "Off-season hiking tours")
- Recenzija gosta + Vas odgovor (po mogucnosti na engleskom za strane goste)

Postavlja se za 2 minute preko Google Business aplikacije na mobitelu. Za sezonu posebno bitno jer 70%+ pretraga u Splitu/Dalmaciji dolazi s engleskih kljucnih rijeci. Sigurno cete primijetiti razliku u broju "Get directions" klikova i poziva za 2-3 tjedna.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V3: {
      subject: `Chrome upozorenje na Vasoj stranici`,
      body: `Pozdrav,

otvorio sam {{website}} u Chromeu i odmah dobio upozorenje "Veza nije sigurna". Razlog: stranica nema HTTPS (SSL certifikat). Za turisticke stranice je to dvostruko gore jer strani gosti vide Chrome upozorenje na engleskom ("Your connection is not private") i vecina odmah zatvori tab - bez sanse da uopce vide Vase ture.

To je trenutno besplatno za rijesiti i traje 10 minuta:

Ako koristite Hostinger, Bluehost, SiteGround ili slican host:
1) Login u hosting panel
2) Pronadite sekciju "SSL" ili "Security"
3) Kliknite "Install Let's Encrypt SSL" (besplatno je)
4) Pricekajte 5 minuta da se propagira

Ako koristite WordPress, nakon SSL instalacije idite u Settings ? General i promijenite "http://" u "https://" za WordPress Address i Site Address.

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

Sitemap je tekstualni fajl koji govori Googleu "evo svih stranica koje imam, indeksiraj ih". Bez njega Google sam pogada sto imate, i obicno propusti pola stranica - sto je zlatno za turisticke agencije jer bas stranice tipa /jednodnevne i /vise-dana vode goste direktno do rezervacije bez Viator/GetYourGuide provizije.

Generirao sam okvirni sitemap za Vasu agenciju, kopirajte u obican tekst editor, snimite kao "sitemap.xml":

  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>{{website}}/</loc><priority>1.0</priority></url>
    <url><loc>{{website}}/ture</loc><priority>0.9</priority></url>
    <url><loc>{{website}}/jednodnevne</loc><priority>0.9</priority></url>
    <url><loc>{{website}}/vise-dana</loc><priority>0.9</priority></url>
    <url><loc>{{website}}/grupne</loc><priority>0.8</priority></url>
    <url><loc>{{website}}/galerija</loc><priority>0.7</priority></url>
    <url><loc>{{website}}/kontakt</loc><priority>0.7</priority></url>
  </urlset>

Koraci:
1) Postavite fajl na {{website}}/sitemap.xml (FTP, file manager, ili Yoast plugin za WordPress radi to automatski)
2) Idite na search.google.com/search-console
3) Dodajte Vas domen kao novu property
4) Pod "Sitemaps" submitajte "sitemap.xml"
5) Za 7-14 dana Google ce indeksirati sve stranice

Ako imate vise stranica od ovih u primjeru (npr. posebne stranice za Blue Cave, Hvar, Krka, biking, food tours), javite ih, pa Vam prilagodim sitemap. Posebno bitno prije sezone.

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
- Ne znate odakle dolaze (Google, TripAdvisor, Instagram, direktno...) i iz kojih zemalja (presudno za turisticku agenciju)
- Ako pokrenete oglase na Facebooku ili Googleu, ne mozete optimizirati jer alati ne vide tko je zapravo rezervirao turu

Google Analytics 4 je besplatan i postavlja se za 10 minuta:

1) Idite na analytics.google.com ? "Start measuring"
2) Account name: "{{title}}"
3) Property name: "{{title}}", odaberite vremensku zonu Croatia
4) Data Stream ? Web ? upisite {{website}}
5) Dobit cete kod koji izgleda ovako:

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXX');
  </script>

6) Taj kod ide u <head> sekciju svake stranice (u WordPressu obicno header.php, ili kroz plugin "Insert Headers and Footers")

Za 24-48h imat cete prve podatke: tko dolazi na stranicu, koja je tura najgledanija, koliko se zadrzavaju, iz koje zemlje. Sve presudno za odluke prije sezone.

Ako se nesto zaglavi pri postavljanju, slobodno pitajte.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V6: {
      subject: `WhatsApp odgovori za turisticke upite (4 jezika)`,
      body: `Pozdrav,

pretpostavljam da preko WhatsAppa, Instagrama i Booking poruka dobivate puno pitanja tipa "What time does the tour start?", "Koliko traje?", "Is lunch included?", "Sto ako pada kisa?". Vjerojatno netko rucno tipka iste odgovore svaki dan, cesto na 2-3 jezika.

WhatsApp Business aplikacija ima sekciju "Quick Replies" koja vecini to rijesi. Evo 4 gotova bilingvalna odgovora (HR + EN) koje mozete kopirati:

1) Info o turi (kracenica: /tour-info)
"HR: Polazna tocka [adresa] u 09:00. Tura traje 6h. Ukljuceno: vodic, transport, rucak, ulaznice. Ponijeti: udobne cipele, suncane naocale, vodu, kupace. / EN: Departure from [address] at 9:00 AM. Duration 6h. Included: guide, transport, lunch, entry fees. Bring: comfortable shoes, sunglasses, water, swimwear."

2) Cijena (kracenica: /price)
"HR: Cijena po osobi: [X EUR]. Grupe 5+ osoba: [Y EUR]. Djeca do 12 godina: 50% popust. Ukljuceno: vodic, transport, rucak. / EN: Per person: [X EUR]. Groups 5+: [Y EUR]. Kids under 12: 50% off. Included: guide, transport, lunch."

3) Booking (kracenica: /booking)
"HR: Za rezervaciju potreban je depozit 30% (kartica/uplata), ostatak na licu mjesta gotovinom. Besplatno otkazivanje do 24h prije polaska, kasnije naplacujemo depozit. / EN: 30% deposit required to confirm (card/transfer), remainder paid on the day in cash. Free cancellation up to 24h before tour."

4) Vrijeme (kracenica: /weather)
"HR: Ako pada kisa ili je nemirno more, premjestamo turu na drugi dan ili vracamo cijeli iznos. Ljeti ponesite sesir i kremu, zimi vjetrovku i topliji sloj. / EN: If rainy or rough sea, we reschedule or fully refund. Summer: bring hat and sunscreen. Winter: bring windbreaker and warm layer."

Postavlja se za 5 minuta: WhatsApp Business ? Settings ? Business tools ? Quick replies ? Add new.

Rijesit ce Vam otprilike 70% upita prije rezervacije, agencija se moze posvetiti slozenijim grupnim upitima i partnerskim hotelima.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V7: {
      subject: `Vasa stranica se sporo otvara na mobitelu`,
      body: `Pozdrav,

testirao sam {{website}} kroz Google PageSpeed Insights - mobile rezultat je {{pagespeed_mobile}}/100. Sve ispod 50 znaci da gosti cekaju 4-6 sekundi da se stranica ucita, a 53% ljudi odustane prije nego sto se uopce prikaze (Google podatak). Za turisticke stranice je to posebno bolno jer stranci na 4G mrezi dok su u Splitu/Dubrovniku/Hvaru otvore par tab-ova istovremeno i biraju turu - najsporija stranica gubi.

3 stvari koje obicno najvise ubrzaju (lako za napraviti):

1) Komprimirajte slike
   Turisticke stranice imaju puno fotografija - obicno tu lezi problem. Idite na tinypng.com, uploadajte sve slike s Vase stranice, downloadajte komprimirane verzije, zamijenite original. Obicno smanji slike za 60-70% bez vidljivog gubitka kvalitete.

2) Pretvorite slike u WebP format
   WebP je 50% manji od JPG-a, podrzava ga svaki browser. Alat: squoosh.app (besplatan, radi u browseru). Uploadate JPG, downloadate WebP. Posebno bitno za galerije s desecima fotografija.

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

primijetio sam jednu malu stvar na {{website}} koja utjece na to kako Vasa stranica izgleda kad se pojavi u Google rezultatima ili kad netko podijeli link na Facebooku/WhatsAppu (npr. gost koji preporucuje Vasu turu prijateljima ili u Reddit/TripAdvisor postu).

Nedostaje par meta tagova u <head> sekciji. Posljedica:
- Google sam smislja tekst koji se prikaze ispod naslova u rezultatima (umjesto Vaseg pazljivo napisanog opisa)
- Kad netko podijeli Vas link, prikaze se prazno (bez fotografije ture, bez opisa)
- Nemate "rich snippets" (zvjezdice, ocjene) u Google rezultatima - sto je za ture velika stvar jer se natjecete s Viatorom i GetYourGuide

Napisao sam Vam gotove tagove, samo paste u <head> sekciju HTML-a:

  <!-- Meta description za Google -->
  <meta name="description" content="{{title}} - {{Kategorija_lc}} u {{Grad}}u. {{review_count}}+ recenzija, ocjena {{review_rating}}/5. Direktna rezervacija ili nazovite {{phone}}.">

  <!-- Open Graph (za Facebook/WhatsApp/LinkedIn share) -->
  <meta property="og:title" content="{{title}} - {{Kategorija_lc}} {{Grad}}">
  <meta property="og:description" content="{{Kategorija_lc}} u {{Grad}}u, {{review_count}}+ zadovoljnih gostiju.">
  <meta property="og:image" content="{{website}}/cover.jpg">
  <meta property="og:url" content="{{website}}">

  <!-- Schema za Google rich results -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "{{title}}",
    "url": "{{website}}",
    "telephone": "{{phone}}",
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

Paste sve u <head> nakon <title> taga. Za "cover.jpg" upload najljepsu fotografiju ture (Blue Cave, Hvar, Krka, plovidba - sto god najbolje predstavlja agenciju) u root domena. Velicina 1200x630px ide najbolje.

Test rezultata: search.google.com/test/rich-results - upisite Vas domen, vidite hoce li sad prikazivati zvjezdice i ocjenu.

Za 7-14 dana trebali biste vidjeti porast click-through rate iz Google rezultata, posebno za strane goste koji usporeduju ponude.

Lijep pozdrav,
{{sender_ime}}

-
Opsis Dalmatia
opsisdalmatia.com`
    },
    V9: {
      subject: `5 sitnica za bolji broj rezervacija`,
      body: `Pozdrav,

prosetao sam Vasom stranicom {{website}} - sve izgleda solidno tehnicki (brzina, SEO, HTTPS, struktura). Bravo, vidi se rad iza toga.

Posto je tehnicka strana poslozena, evo 5 sitnica koje obicno pomazu turistickim agencijama dobiti vise direktnih rezervacija (mimo Viator/GetYourGuide provizije) iz iste kolicine prometa:

1) Telefonski broj klikabilan s medunarodnim formatom
   U HTML-u broj treba biti zamotan u <a href="tel:{{phone_intl}}">{{phone}}</a> - kad mobilni gost klikne s ino-broja, otvara dial direktno na +385 prefiksu. Tipicno 10-20% vise poziva ako trenutno nije klikabilan ili je samo HR format.

2) WhatsApp click button s bilingvalnom pre-fill porukom
   Dodajte negdje vidljivo na stranicu:
   <a href="https://wa.me/{{phone_intl}}?text=Hi,%20I'd%20like%20info%20about%20the%20tour">Message us on WhatsApp / Posaljite poruku</a>
   Strani gosti puno radije pisu nego zovu, posebno zbog cijene roaminga. Pre-fill na engleskom dodatno spusta prag.

3) Sticky "Book Now / Rezerviraj" gumb
   Fiksni gumb dolje desno na svakoj stranici, dvojezican, vodi na booking form ili WhatsApp. Conversion rate +25-40% testirano (Hotjar 2024 data).

4) Trust badges iznad fold-a
   "{{review_count}}+ gostiju", "{{review_rating}}/5 Google", TripAdvisor badge ako imate Certificate of Excellence. Smanjuje bounce za ~15%, posebno za prvi posjet sa stranog trzista gdje gosti ne poznaju lokalne brendove.

5) Sezonske Google profile update
   Stavite si reminder krajem ozujka da promijenite radno vrijeme, dodate sezonske ture, refresh fotografije. Google daje boost profilima koji su recently updated, sto vam dize ranking u peak sezoni.

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

prije 3 dana poslao sam Vam {{e1_value_short}} - htio sam samo provjeriti je li nesto od toga bilo korisno.

Razumijem ako niste imali vremena, to ide na dno svake to-do liste. Ako se zaglavilo bilo gdje, slobodno mi odgovorite par redaka - posaljem konkretne korake za Vas slucaj.

Inace, ako Vas zanima razgovor o tome kako se ovakve stvari mogu posloziti automatski (bez Vaseg vremena svaki tjedan), nudimo besplatnu konzultaciju 30min:

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

? opsisdalmatia.com/besplatna-konzultacija

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

- **"Kasnije"** ? pingam ponovno za 6 mjeseci, do tada miran sam
- **"Ne"** ? micem Vas iz liste zauvijek, nece vise email-a
- **"Promaknulo mi je"** ? posaljem zadnji put glavno sto sam htio reci

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
