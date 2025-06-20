### Proiect: Reminder pentru Zile de Naștere

**Participanți:** Radu-Leonard Mavrodin & Miruna-Cristina Lupu

---

### Descriere generală

Aplicație modernă construită în Angular 18 pentru gestionarea aniversărilor prietenilor și primirea de notificări automate. Proiectul include funcționalități avansate de autentificare, gestionare a prietenilor și afișarea unor statistici legate de zilele de naștere.

---

### Funcționalități principale

#### Sistem de autentificare

- **Formular de logare**: Email, parolă și opțiune "Remember Me"
- **Formular de înregistrare**: Email, parolă, confirmare parolă, prenume și nume
- **Validatori personalizați** pentru complexitatea parolei:

  - Minimum 6 caractere
  - Cel puțin o literă mare
  - Cel puțin o literă mică
  - Cel puțin o cifră
  - Cel puțin un caracter special

- **Securitate**: Doar pagina de login este accesibilă utilizatorilor neautentificați, restul rutei fiind protejate
- **Integrare API**: Conectare completă la backend

#### Implementare tehnică

- **Lazy loading complet** pentru toate rutele
- **Funcționalități Angular**: Utilizare de componente cu `@Input`, `@Output` și servicii dedicate
- **Signals**: Gestionare reactivă a stării folosind noul sistem de signals din Angular 18
- **NgZorro (Ant Design)**: UI complet implementat cu această bibliotecă

#### Tabel de gestionare a prietenilor

- **Tabel detaliat** cu cel puțin 7 coloane: Prenume, Nume, Telefon, Oraș, Data nașterii, Vârstă, Zile rămase până la ziua de naștere, Acțiuni
- **Adăugare prieteni**: Formular în modal, cu validări
- **Editare prieteni**: Formular de modificare într-un modal dedicat
- **Căutare în timp real** după orice câmp din tabel
- **Ștergere prieteni**: Dialog de confirmare pentru eliminare sigură
- **Sortare coloane**: Prin clic pe antetul coloanelor
- **Validări personalizate** pentru telefon și data nașterii

#### Funcționalități bonus

- **Integrare completă cu backend-ul** pentru toate acțiunile
- **Reminder pentru zile de naștere**:

  - Dashboard cu statistici despre aniversări
  - Alerte pentru zilele de naștere de azi
  - Countdown pentru următoarea aniversare
  - Indicatori vizuali pentru aniversările din următoarele 7 zile

- **Librăria Date-fns**: Manipulare și formatare avansată a datelor

#### Calitatea codului și design

- **Arhitectură clară**: Organizare logică în componente și servicii
- **Design modern**: UI responsiv, plăcut vizual, cu fundaluri în degradeuri
- **Fără erori**: Tratarea erorilor și validări în toată aplicația
- **Funcționalități inovatoare**: Calcule în timp real și notificări pentru aniversări

---

### Arhitectură Backend

Backend-ul expune un API REST simplu, dar bine structurat:

#### Autentificare:

- `POST /auth/register` – Creare cont nou, returnează utilizatorul și un token JWT
- `POST /api/auth/login` – Logare, returnează utilizatorul și token-ul
- `GET /api/auth/me` – Returnează datele utilizatorului logat

#### Prieteni:

- `GET /api/friends` – Listează toți prietenii
- `GET /api/friends/:id` – Detalii pentru un prieten anume (doar dacă aparține utilizatorului)
- `POST /api/friends` – Adăugare prieten
- `PUT /api/friends/:id` – Editare prieten
- `DELETE /api/friends/:id` – Ștergere prieten

#### Zile de naștere:

- `GET /api/birthdays` – Toate zilele de naștere
- `GET /api/birthdays/next` – Următoarea aniversare
- `GET /api/birthdays/today` – Zilele de naștere de astăzi

🔒 Toate endpoint-urile protejate necesită un token JWT în antetul **Authorization**, altfel se returnează **401 Unauthorized**.

---

### Frontend – Funcționalități UX/UI

- **Sistem de Guard** pentru protejarea rutelor – utilizatorii neautentificați sunt redirecționați automat
- **Dashboard după autentificare**, care afișează:

  - Numărul total de prieteni
  - Câte zile de naștere urmează
  - Câte aniversări sunt astăzi
  - Următoarea aniversare + numărul de zile rămase

- **Listă de prieteni**: posibilitate de adăugare, editare și ștergere

  - Formularele de adăugare/editare sunt afișate în modale intuitive

---

### Tehnologii folosite

- **Angular 18**
- **NgZorro**
- **RxJS**
- **Date-fns**
- **TypeScript**
- **SCSS**
