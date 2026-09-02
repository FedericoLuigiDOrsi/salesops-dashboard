---
status: locked
superseded_by: null
locked_date: 2026-09-02
supersedes: "../07-design-anchor-p2c.md (status: locked 27/06 — confermato superato da Federico il 02/09, non semplice bozza come diceva questa nota)"
---

# MAAT — Design System (canonico)

> Fonte unica di verità per **oggetti e interfacce** MAAT / Photo-to-Catalog. Web-first, responsive a mobile.
> Palette MP076 · estetica dashboard high-contrast editoriale. Token machine-readable in [`design-tokens.json`](design-tokens.json), spec elementi in [`COMPONENTS.md`](COMPONENTS.md), anteprime in `*.html` (`@dsCard`).
> Versione: **1.0** · supersede `../07-design-anchor-p2c.md`.

> ⚠️ **I design system MAAT sono due.** Questo è quello del **prodotto**, ed è quello che serve per
> costruire una schermata dell'applicazione. L'altro è quello della **landing**
> (`dedalo-os/projects/maat/landing/DESIGN.md`): scuro `#0F0F0F` con accento terracotta e 3D, cioè
> l'opposto di questo.
>
> La divergenza è voluta: la landing convince a freddo qualcuno che non conosce MAAT, il prodotto è
> uno strumento che si usa tutti i giorni. Ma fino al 31/08/2026 nessuno dei due file nominava
> l'altro, e aprire quello sbagliato per primo era un errore facile da fare.

---

## 0. Filosofia & principi

Uno **strumento preciso** per il seller resale vintage, non un'app consumer. Tre principi che governano ogni decisione:

1. **Contrasto, non decorazione.** Il carattere viene da near-black su warm-white e da un unico accento fluo, non da gradienti, ombre colorate o ornamenti.
2. **Il fluo è azione.** Il verde fluo `#DBE64C` compare *solo* dove l'utente agisce o dove qualcosa chiede attenzione. Mai come riempitivo, mai con glow. Dosaggio ~90% neutro / ~10% fluo.
3. **I dati sono mono.** Ogni valore misurabile (SKU, misure, conteggi, timestamp) è in JetBrains Mono. È la firma "tool da pro".

Anti-obiettivi espliciti: niente pastello SaaS, niente dark mode, niente look giocoso, niente AI-slop (Inter, viola/neon, 3 card uguali, clichés).

---

## 1. Architettura dei token (3 livelli)

I token sono organizzati in tre strati. Si progetta sui **semantici**, mai sui primitivi.

```
PRIMITIVE   valori grezzi          es. --c-navy-900: #001F3F
   ↓ mappa
SEMANTIC    ruolo nel sistema      es. --text-primary: var(--c-navy-900)
   ↓ consuma
COMPONENT   uso nel componente     es. StatusBadge[bozza].bg = var(--accent)
```

- **Primitive** = la palette/le scale raw. Non si usano mai direttamente nei componenti.
- **Semantic** = il ruolo (`--bg`, `--text-primary`, `--accent`, `--status-confermato`…). Cambiare un primitivo qui si propaga ovunque.
- **Component** = override locali quando un componente ha bisogno di un token proprio.

Regola d'oro (dal MCSFD): **ogni campo sortable/filterable deve esistere come token semantico** prima di poter diventare un filtro/badge nell'UI.

---

## 2. Colore

### Primitivi
| Token | Hex | |
|---|---|---|
| `--c-canvas` | `#F6F7ED` | Praxeti White |
| `--c-white` | `#FFFFFF` | Pure Surface |
| `--c-navy-900` | `#001F3F` | Midnight Mirage (near-black) |
| `--c-steel-600` | `#5B6670` | Muted Steel |
| `--c-steel-400` | `#9AA0A6` | tertiary |
| `--c-fluo` | `#DBE64C` | First Colors of Spring |
| `--c-fluo-700` | `#C8D43B` | fluo pressed |
| `--c-green-700` | `#00804C` | Picture Book Green |
| `--c-green-400` | `#74C365` | Mantis |
| `--c-blue-700` | `#1E488F` | Nuit Blanche |
| `--c-red-500` | `#E5484D` | Signal Red |

### Semantici (ruoli)
| Token | → primitivo | Uso |
|---|---|---|
| `--bg` | canvas | sfondo madre |
| `--surface` | white | card, pannelli |
| `--surface-dark` | navy-900 | sidebar, superfici scure |
| `--text-primary` | navy-900 | testo principale |
| `--text-secondary` | steel-600 | meta, label |
| `--text-tertiary` | steel-400 | placeholder, caption |
| `--text-on-dark` | `#F6F7ED` | testo su superfici scure |
| `--border` | rgba(navy,.10) | hairline 1px |
| `--accent` | fluo | azione/attenzione (CTA, attivo, required) |
| `--on-accent` | navy-900 | testo su fluo |
| `--status-locale` | steel-600 | Local Draft (offline) |
| `--status-bozza` | fluo | to_be_reviewed (azione) |
| `--status-confermato` | green-700 | available (fatto) |
| `--success` | green-700 | validato |
| `--danger` | red-500 | rejected / errore |
| `--info` | blue-700 | info/link (raro) |

**Regole colore:** mai `#000000` (usa navy-900). Un solo accento caldo a vista. I verdi/blu sono *semantici*, mai decorazione. Il rosso solo per errore/rejected.

---

## 3. Tipografia

- **Geist** — UI + display. Gerarchia per **peso e colore**, non per dimensione urlata.
- **JetBrains Mono** — tutti i dati misurabili. Mai Geist per un numero.
- Banditi: `Inter`, system fonts generici, qualsiasi serif (è un software UI).

### Scala (token)
| Token | Font | Size | Weight | Tracking | Uso |
|---|---|---|---|---|---|
| `--type-display` | Geist | clamp(34,5vw,52)px | 800 | -.03em | hero, titoli pagina grandi |
| `--type-title-lg` | Geist | 28px | 700 | -.02em | titolo schermata |
| `--type-title` | Geist | 22px | 600 | -.02em | titolo sezione |
| `--type-subtitle` | Geist | 17px | 600 | -.01em | sottotitolo, modal h |
| `--type-body` | Geist | 15px | 400 | 0 | corpo |
| `--type-body-sm` | Geist | 13px | 400 | 0 | corpo piccolo |
| `--type-label` | Geist | 13px | 500 | 0 | label form, nav |
| `--type-caption` | Geist | 12px | 400 | 0 | meta, helper |
| `--type-overline` | JetBrains Mono | 11–12px | 600 | .12em up | eyebrow, section label |
| `--type-data` | JetBrains Mono | contestuale | 500 | 0 | SKU, misure, conteggi |

Body max 65ch. Touch/leggibilità: corpo minimo 14px su mobile.

---

## 4. Spazio & layout

- **Base 4px.** Scala: `--s1 4` `--s2 8` `--s3 12` `--s4 16` `--s5 24` `--s6 32` `--s7 48` `--s8 64`.
- **Container** max-width `--container 1400px`, centrato.
- **Griglia catalogo**: CSS Grid auto-fill, card min ~240px — **mai 3 colonne uguali rigide**.
- **Breakpoint**: `--bp-sm 480` · `--bp-md 768` (sidebar→drawer, multi-colonna→1) · `--bp-lg 1024` · `--bp-xl 1400`.
- Niente `calc()` percentuale, niente overlap: ogni elemento ha la sua zona.

---

## 5. Forma & elevazione

- **Raggi**: `--r-sm 8` · `--r-slot 10` · `--r-card 14` · `--r-pill 999`.
- **Elevazione** (ombre calde tinte near-black, mai grigio freddo):
  - `--e0` none (flat, divisori a hairline)
  - `--e1` `0 1px 2px rgba(navy,.04), 0 6px 20px rgba(navy,.06)` — card
  - `--e2` `0 2px 6px rgba(navy,.08), 0 16px 40px rgba(navy,.10)` — overlay, hover lift
- Hairline 1px `--border`. Niente stripe d'accento spesse.

---

## 6. Motion

- **Durate**: `--dur-fast 120ms` · `--dur-base 180ms` · `--dur-slow 400ms`.
- **Easing**: `--ease-standard cubic-bezier(.22,1,.36,1)` (entrate/uscite) · spring per interazioni (stiffness 100, damping 20).
- Principi: calmo, mai nervoso. Reveal liste a cascata (stagger). Solo `transform`/`opacity`. `prefers-reduced-motion` → disattiva.

---

## 7. Iconografia

- Stile **line/outline**, stroke 1.5px, dimensioni 20px (inline) / 24px (azioni). Colore `--text-secondary`; `--accent` solo su attivo.
- Set di riferimento: Lucide (o equivalente line geometrico). Le glyph unicode nelle anteprime sono placeholder → sostituire con icone vere in produzione.
- Niente emoji nell'UI.

---

## 8. Indice elementi → oggetti OOUX

Ogni elemento serve un oggetto del modello (vedi `COMPONENTS.md` per le spec complete).

| Livello | Elemento | Oggetto OOUX |
|---|---|---|
| Atomo | Button · StatusBadge · Input · Select · Search · SegmentedFilter · Chip · Avatar · Icon · Toggle | — (trasversali) |
| Molecola | PhotoSlot · AttributeField · CatalogCard · NotificationRow · ConfirmGateButton · StatTile | Photo · Catalog Entry · Notification |
| Pattern | Banner · Toast · Accordion · Progress/Sequence · Modal · Skeleton · EmptyState | trasversali / stati |
| Organismo | CatalogList · CatalogEntryDetail · ReviewForm · PhotoCaptureFlow · NotificationInbox · PhotoGrid · AppShell | Catalog Entry · Photo · Notification |

---

## 9. Modello degli stati

Tre famiglie di stato, da non confondere:
1. **Interazione** (ogni elemento attivo): default · hover · active(-1px) · focus(ring fluo) · disabled.
2. **Status oggetto** (Catalog Entry persistito): `locale` · `bozza` · `confermato` → StatusBadge.
3. **Stati dato** (collezioni): empty (EmptyState) · loading (Skeleton) · error (Banner/inline) · dead-link.

---

## 10. Responsive

Web-first, degrada a mobile: <768px sidebar → drawer/top-bar, multi-colonna → 1 colonna, nessuno scroll orizzontale, titoli `clamp()`, immagini inline impilano sotto. Full-height: `min-h-[100dvh]`, mai `h-screen`.

Sulle dimensioni dei target di tocco vedi §11: **non** sono ≥44px su `apps/web`, e la riga che lo diceva qui è stata corretta il 02/09.

---

## 11. Accessibilità

- Contrasto AA minimo: testo su canvas/surface OK (navy su warm-white ~16:1). Fluo `#DBE64C` ha **basso contrasto col bianco** → usalo solo con testo near-black sopra, mai testo bianco su fluo, mai testo fluo piccolo su chiaro.
- Focus sempre visibile (ring fluo + offset). `prefers-reduced-motion` rispettato. Stato non veicolato dal solo colore (badge hanno anche label testuale).

### Target di tocco — la regola vera, e cosa stiamo accettando

**Decisione del 02/09/2026.** Fino a quel giorno questo documento diceva «tap target ≥44px» in due
punti, mentre la spec del Button in `COMPONENTS.md` prescriveva `padding 11/20`, che produce ~36px.
Tre punti in contraddizione fra loro, e il codice allineato a nessuno dei tre.

Sciolta così:

| Superficie | Soglia | Perché |
|---|---|---|
| **`apps/mobile`** (Expo) | **≥44px** | È touch-only. 44px è la soglia di Apple HIG e di WCAG 2.5.5 (AAA) |
| **`apps/web`** | **la scala compatta**, 32/36/40px | È un backoffice denso, guidato da mouse e tastiera. Le tabelle, le toolbar e i filtri vivono di densità: alzare ogni bottone a 44px cambierebbe il prodotto, non solo il bottone |

**Il compromesso, detto:** con 32px il bottone più piccolo resta sopra i **24×24** di WCAG 2.5.8,
che è il livello **AA**. Non raggiunge i 44 di WCAG 2.5.5, che è **AAA**. `apps/web` punta ad AA
e lo rispetta.

**Il rischio residuo, detto:** chi apre `apps/web` dal browser di un telefono tocca bersagli da
32÷40px. Passa AA, resta sotto la raccomandazione di piattaforma. È accettato consapevolmente
perché il telefono non è il contesto d'uso previsto per il backoffice: per il campo c'è
`apps/mobile`. **Se un giorno la web app diventa un percorso d'uso reale da telefono, questa
decisione va riaperta, non aggirata schermata per schermata.**

---

## 12. Stati vuoti

Una collezione vuota non è una sola situazione, sono **tre**, e vanno distinte perché chiedono
risposte opposte. Deciso il 02/09/2026 dopo il censimento delle schermate.

| Stato | Quando | Cosa fa | Peso |
|---|---|---|---|
| **`first-run`** | il tenant non ha *ancora* niente | **insegna il gesto** e offre **una** CTA | occupa la pagina |
| **`no-match`** | filtro o ricerca attivi, nessun risultato | constata e offre di **azzerare i filtri** | interrompe la lista |
| **`idle`** | vuoto legittimo e transitorio | constata, **nessuna azione** | quasi sparisce |

### Perché tre e non due

Con due soli stati il vuoto transitorio finisce dentro il primo, e ogni colonna Kanban
«Consegnati» senza pacchi diventa un invito a crearne uno: un rimprovero per una situazione del
tutto normale. Un martedì senza consegne non è un fallimento dell'utente.

### Le regole che non si negoziano

- **Mai una CTA di creazione sotto un `no-match`.** Se hai filtrato e non trovi niente, il
  problema è il filtro, non il fatto che non hai capi. Offrire «Crea capo» lì dice all'utente
  che non ha capito cosa sta guardando.
- **Un `first-run` insegna, non constata.** «Nessun capo» è vero e inutile. La prima schermata
  che un cliente vede è l'unica occasione di spiegargli il gesto: foto → l'AI compila → confermi.
- **Un `idle` non ha icone né bordi.** Vive dentro un contenitore che ha già i suoi: aggiungere
  peso lo fa sembrare un errore invece di uno spazio libero.
- **Un grafico vuoto non è uno stato vuoto, è un errore travestito.** Se non ci sono dati, il
  grafico sparisce e al suo posto va un `first-run`. Assi con la linea piatta a zero sembrano
  un guasto.

### Attenzione al vuoto che mente

Se una schermata ha filtri, il suo `first-run` **non può** essere anche il suo `no-match`. Il
caso reale che ha prodotto questa riga: Pubblicazione mostrava «Nessun capo da pubblicare» anche
quando i capi c'erano e il filtro li nascondeva. Il testo era falso e non c'era modo di
accorgersene.

Implementazione: `EmptyState` con prop `tone`. Il prop governa **solo il peso visivo** — cosa
scrivere e se mettere una CTA resta una decisione umana, e la regola che la governa è questa.

---

## 13. Anti-pattern (vietati)

Niente `#000000` · niente `Inter`/serif · niente glow/neon sul fluo · niente fluo decorativo · niente 3-colonne uguali rigide · niente Hero centrato · niente emoji · niente nomi generici (usa capi reali) · niente numeri tondi finti · niente clichés AI ("Elevate/Seamless/Next-Gen") · niente filler ("scroll to explore", chevron rimbalzanti) · niente Geist per i numeri.

---

## 14. Governance

- **Estendere**: nuovo elemento → primitivo (se serve un valore nuovo) → semantico → componente → anteprima `@dsCard` → riga in `COMPONENTS.md`. Mai un colore hardcoded in un componente.
- **Naming**: token kebab-case con prefisso di strato (`--c-*` primitive, ruolo per semantic). Componenti in PascalCase.
- **Versioning**: bump qui in testa. Una modifica al token si fa in `design-tokens.json` (fonte) e si propaga; le anteprime e Claude Design (`/design-sync`) si riallineano.
- **Sync**: `/design-sync` da terminale porta il pacchetto in Claude Design (vedi `README.md`).
