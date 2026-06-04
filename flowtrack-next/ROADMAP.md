# FlowTrack — Roadmap per la versione multi-utente in produzione

## Stack scelto

| Componente | Tecnologia |
|---|---|
| Framework | Next.js (App Router) |
| Database | PostgreSQL |
| ORM | Drizzle |
| Auth | Auth.js (NextAuth v5) |
| Hosting | Vercel |
| Database hosting | Neon (serverless PostgreSQL) |

---

## Fase 1 — Migrazione a Next.js + Database (~2-3 settimane)

- [ ] Inizializzare nuovo progetto Next.js
- [ ] Copiare componenti e logica dall'attuale Vite app
- [ ] Setup PostgreSQL locale (Docker o Neon)
- [ ] Setup Drizzle ORM + schema tabelle
- [ ] Setup Auth.js (OAuth Google/GitHub come metodo primario, password come fallback)
- [ ] Input validation lato server con Zod per tutte le API
- [ ] Sanitizzare descrizioni transazioni (prevenire XSS da import)
- [ ] Creare API routes per CRUD transazioni (con validazione user_id lato server)
- [ ] Creare API routes per categorie, regole, banche
- [ ] Spostare categorizer lato server
- [ ] Pagina di import dati dal localStorage al DB

## Fase 2 — Funzionalità core + Sicurezza (~2-3 settimane)

- [ ] CRUD completo via API (transazioni, categorie, regole, banche)
- [ ] Categorizzazione automatica lato server
- [ ] Query di aggregazione per grafici e report
- [ ] Import CSV/Excel collegato alle API
- [ ] Row Level Security (RLS) su PostgreSQL — blocco a livello DB anche se l'API fallisce
- [ ] Rate limiting sulle API (prevenire brute force e abuso)
- [ ] Content Security Policy (CSP) — prevenire XSS
- [ ] Audit log — registrare login, tentativi falliti, operazioni sensibili
- [ ] Test funzionali di base
- [ ] Test di sicurezza (tentativo accesso incrociato tra utenti, SQL injection, XSS)

## Fase 3 — Produzione (~1-2 settimane)

- [ ] Deploy database su Neon
- [ ] Deploy app su Vercel
- [ ] Configurare variabili d'ambiente (DATABASE_URL, AUTH_SECRET, ecc.)
- [ ] Configurare HTTPS e dominio
- [ ] Backup automatici del database

## Fase 4 — Rifiniture (continuo)

- [ ] Landing page e pagina about
- [ ] Pagine privacy e termini (GDPR)
- [ ] Email transazionali (conferma registrazione, reset password)
- [ ] 2FA opzionale (Auth.js lo supporta)
- [ ] Dashboard admin per gestione utenti (se serve)

---

## Costi mensili stimati (per pochi utenti)

| Servizio | Costo |
|---|---|
| Vercel (Hobby) | Gratuito |
| Neon (PostgreSQL) | Gratuito (0.5GB) |
| Dominio .com | ~10€/anno |
| **Totale** | **< 1€/mese** |

---

## Schema database previsto

```
users (id, name, email, password_hash, created_at)

transactions (id, user_id, date, bank, description, amount, category)

categories (id, user_id, name, icon, type [default|custom])

rules (id, user_id, keywords[], category, priority)

banks (id, user_id, name)
```

Tutte le tabelle hanno `user_id FK → users.id` per isolamento dei dati per utente.

---

## Note sulla sicurezza

| Minaccia | Mitigazione |
|---|---|
| Accesso incrociato tra utenti | RLS su PostgreSQL + validazione user_id in ogni API |
| Brute force login | Rate limiting + OAuth (delega sicurezza a Google/GitHub) |
| XSS (descrizioni importate) | Sanitizzazione input + CSP header |
| SQL injection | Drizzle ORM (parametri automatici, niente query raw) |
| Password deboli/riutilizzate | OAuth come metodo primario, minimo 8 caratteri se password |
| Furto sessione | JWT con scadenza, HTTPS obbligatorio, HttpOnly cookies |
| Perdita dati | Backup automatici Neon + export CSV manuale |
| Attacco al server | Vercel gestisce isolamento, patch automatiche, DDoS protection |

**Principio generale:** ogni API route deve verificare che `user_id` nella richiesta corrisponda all'utente autenticato — mai fidarsi del client.
