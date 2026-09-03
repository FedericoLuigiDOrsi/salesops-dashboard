---
status: superseded
superseded_by: maat-ds/DESIGN.md
locked_date: 2026-06-27
superseded_date: 2026-09-02
supersedes: "00 - General/Branding/MAAT-DESIGN-ANCHOR.md (sage+oro, mai lockata)"
---

> ⚠️ **Sostituito il 02/09.** Il vincolo vivo è [`maat-ds/DESIGN.md`](maat-ds/DESIGN.md)
> (confermato da Federico durante il ground-truth check di Fase 6, dopo che questo file e
> quello si contraddicevano: questo dichiarava `locked`, l'altro lo bollava "bozza" nella
> prosa senza un `superseded_by` reciproco). Resta qui come verbale storico del 27/06, non
> più come vincolo.

# Design System — MAAT App / Photo-to-Catalog (web-first)

> ⚠️ Sostituisce la precedente variante *light/terracotta* (scartata 27/06: esteticamente debole).
> Direzione di Federico: **nero / bianco / grigio + verde fluo** (palette MP076), estetica dashboard pulita ad alto contrasto editoriale. **Web-first, responsive a mobile.** Popola i valori del token contract di [`06-atomic-bridge.md`](06-atomic-bridge.md).

## 1. Atmosfera
Dashboard-strumento ad alto contrasto, editoriale, non SaaS-pastello. Canvas chiaro e ariosa, struttura near-black (sidebar, testo, dati), e un singolo accento **verde fluo** che compare *solo* dove l'utente agisce o dove qualcosa chiede attenzione. Densità 5/10 (working tool, non gallery), varianza 6/10 (griglie asimmetriche, niente 3-colonne uguali), moto 5/10 (spring, reveal a cascata). Il carattere viene dal contrasto e dal fluo, non da decorazioni.

## 2. Palette & ruoli (MP076)
| Nome | Hex | Ruolo |
|---|---|---|
| **Praxeti White** | `#F6F7ED` | Canvas primario (bianco caldo) |
| **Pure Surface** | `#FFFFFF` | Card, contenitori |
| **Midnight Mirage** | `#001F3F` | Near-black: sidebar, testo primario, superfici scure (mai `#000000`) |
| **Muted Steel** | `#5B6670` | Testo secondario, meta, label |
| **Whisper Border** | `rgba(0,31,63,.10)` | Hairline 1px, divisori |
| **First Colors of Spring** | `#DBE64C` | ⚡ **Accento firma (unico)**: CTA primaria, stato attivo/selezionato, marker obbligatorio, focus. Sempre piatto — mai glow/neon. |
| Picture Book Green | `#00804C` | Solo semantico "Confermato/validato" |
| Mantis | `#74C365` | Solo semantico success soft / hover positivo |
| Nuit Blanche | `#1E488F` | Solo semantico info/link (raro) |
| Signal Red | `#E5484D` | Solo errore/rejected (funzionale, fuori swatch brand) |

Dosaggio ~90% neutro (white/near-black/grey), ~10% fluo. Il fluo su near-black (o near-black su fluo) è la firma visiva.
> Deroga consapevole alla regola "accento <80% sat": il fluo è scelta di brand esplicita di Federico. Disciplinato: fill piatti, niente bagliori.

## 3. Tipografia
- **Geist** — display + UI. Gerarchia per peso (500/600/700) e colore, non per dimensione urlata. Tracking leggermente negativo sui titoli.
- **JetBrains Mono** — TUTTI i dati: `SKU`, misure, conteggi, `timestamp`, label tecniche. Mai Geist per un numero misurabile.
- **Banditi:** `Inter` (troppo generico/AI), system fonts, qualsiasi serif (è un software UI).

## 4. Token contract → valori
| Token semantico | Valore | Componente |
|---|---|---|
| `status.locale` | Muted Steel `#5B6670` su grigio chiaro | StatusBadge — offline, parcheggiato |
| `status.bozza` | **fluo `#DBE64C`** (pill, testo near-black) | StatusBadge — richiede azione (attira l'occhio) |
| `status.confermato` | Picture Book Green `#00804C` | StatusBadge — fatto |
| `slot.empty` | Whisper Border tratteggiato | Upload Slot |
| `slot.ok` | check `#00804C` su thumb | validated |
| `slot.error` | bordo `#E5484D` + flag | rejected |
| `slot.required` | dot **fluo** `#DBE64C` | label obbligatoria |
| `cta.primary` | **fluo fill + testo near-black** | "Crea capo", "Conferma capo" (enabled) |
| `cta.disabled` | grigio piatto, testo Muted Steel | gate non soddisfatto |
| `notif.draft` | fluo dot | draft_ready |
| `notif.local` | Muted Steel dot | local_save |

## 5. Componenti
- **Buttons:** piatti, niente glow. Primaria = fluo fill, testo near-black, micro -1px su active. Secondaria = outline near-black ghost. Distruttiva = testo `#E5484D`.
- **Cards (capo):** Pure Surface, raggio 14px, ombra soft tinta near-black (mai grigio freddo). Foto in alto, brand+tipo, taglia mono, StatusBadge. Hover: leggera elevazione + bordo fluo 1px.
- **Sidebar:** Midnight Mirage, logo MAAT (mark fluo), voci nav con item attivo = barra/pill fluo + testo bianco.
- **StatusBadge:** pill piccola, mono uppercase tracking, colore per stato (vedi §4).
- **Filtri:** segmented control (Tutti/Bozze/Confermati/Locali), segmento attivo = fluo underline o fill near-black.
- **Inputs:** label sopra, focus ring fluo, errore sotto. Niente floating label.
- **Loaders:** skeleton che ricalca le card. Mai spinner circolare generico.
- **Empty state:** composizione (icona + frase + CTA), non "Nessun dato".

## 6. Layout
Web-first. **Sidebar fissa near-black** + main canvas. Catalogo = **griglia auto-fill asimmetrica** di card capo (mai 3-colonne uguali rigide), `min-width` card ~240px. Max-width contenuto ~1400px. CSS Grid, niente calc%. Stat row in alto (conteggi per status, mono). Responsive: <768px sidebar → top bar/drawer, griglia → 1 colonna, nessuno scroll orizzontale, tap target ≥44px, titoli `clamp()`.

## 7. Moto
Spring (stiffness 100, damping 20). Reveal card a cascata (stagger). Micro-interazioni su hover card / nav attiva. Solo `transform`/`opacity`. Niente easing lineare.

## 8. Anti-pattern (vietati)
Niente emoji · niente `Inter` · niente `#000000` (usa `#001F3F`) · niente glow/neon sul fluo (fill piatto) · niente 3-colonne uguali · niente nomi generici (usa capi reali: "Felpa Stone Island", "Tabi Maison Margiela") · niente numeri tondi finti · niente clichés AI ("Elevate/Seamless/Next-Gen") · niente filler ("scroll to explore", chevron rimbalzanti) · niente link Unsplash rotti (usa picsum.photos) · niente Hero centrato.

## 9. Stitch Reference Block (incolla in testa a ogni prompt)
```
DESIGN SYSTEM REFERENCE — read before drawing anything:
CANVAS: background #F6F7ED (warm white), cards #FFFFFF, sidebar/dark surfaces #001F3F (near-black, NEVER #000000)
TEXT: primary #001F3F, secondary #5B6670, hairline rgba(0,31,63,.10)
ACCENT (signature, use ONLY for action/attention, FLAT never glowing): fluo lime #DBE64C — primary buttons are #DBE64C fill with #001F3F text. Semantic: green #00804C = Confermato/validated · red #E5484D = rejected/error only.
TYPOGRAPHY: Geist (titles + UI, weight-driven hierarchy, tight tracking) · JetBrains Mono (ALL data: SKU, measures, counts, timestamps) — NEVER Inter, NEVER serif.
FEEL: high-contrast editorial dashboard tool for a pro vintage-resale seller. Calm light canvas, near-black structure, one fluo-lime accent where the user acts. NOT pastel SaaS, NOT dark mode, NOT playful.
SHAPE: 14px card radius, soft near-black-tinted shadows, 1px hairlines, asymmetric auto-fill card grid (NO rigid 3-col equal grids), max-width 1400px, generous whitespace.
```
