"""
Estrattore dati dai PDF Tecnoalarm (PRODOTTI e RICAMBI).
Usa testo nativo (no OCR) - veloce e preciso.
Output: CSV nel formato standard per import in AKSuite.
"""

import re
import pandas as pd
import fitz  # PyMuPDF

PDF_PRODOTTI = "/Users/akirayouky/Downloads/Listino_TA_PRODOTTI_2026-10.pdf"
PDF_RICAMBI  = "/Users/akirayouky/Downloads/Listino_TA_RICAMBI_2026-10_ita.pdf"

OUT_PRODOTTI = "/Users/akirayouky/Downloads/tecnoalarm_listino_prodotti_import_form.csv"
OUT_RICAMBI  = "/Users/akirayouky/Downloads/tecnoalarm_listino_ricambi_import_form.csv"

# Pattern prezzo: € XXX,XX oppure € X.XXX,XX
PRICE_RE = re.compile(r'\u20ac\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})')
# Pattern codice articolo Tecnoalarm (F1xx, S1xx, C1xx, D1xx, R1xx, ecc.)
CODE_RE = re.compile(r'([FSCDRE]\d{2,3}[A-Z0-9/_.\-]{3,})')

def norm_price(s: str) -> str:
    """Mantiene formato IT (gia' corretto)"""
    return s.strip()

def extract_prodotti(pdf_path: str) -> pd.DataFrame:
    """Estrae prodotti dal listino PRODOTTI Tecnoalarm"""
    doc = fitz.open(pdf_path)
    rows = []
    current_section = ""
    current_subsection = ""
    
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        text = page.get_text()
        
        if not text.strip():
            continue
        
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # Traccia sezione/sottosezione
        for line in lines:
            upper = line.upper()
            # Sezioni principali
            if upper.startswith("SISTEMI EV"):
                current_section = "Sistemi EV"
            elif upper.startswith("SISTEMI TP"):
                current_section = "Sistemi TP"
            elif upper.startswith("COMPLIMENTI DI IMPIANTO") or upper.startswith("COMPLEMENTI"):
                current_section = "Complementi di Impianto"
            elif upper.startswith("CONSOLE E DISPOSITIVI"):
                current_section = "Console e Dispositivi"
            elif upper.startswith("MODULI DI ESPANSIONE"):
                current_section = "Moduli di Espansione"
            elif upper.startswith("TECNOLOGIA RSC"):
                current_section = "Tecnologia RSC"
            elif upper.startswith("TECNOLOGIA WIRELESS"):
                current_section = "Tecnologia Wireless"
            elif upper.startswith("RIVELATORI"):
                current_section = "Rivelatori"
            elif upper.startswith("SIRENE"):
                current_section = "Sirene"
            elif upper.startswith("ALIMENTATORI"):
                current_section = "Alimentatori"
            elif upper.startswith("SOFTWARE"):
                current_section = "Software"
            elif upper.startswith("ACCESSORI"):
                current_section = "Accessori"
            elif upper.startswith("VIDEOALARM"):
                current_section = "VideoAlarm"
            
            # Sottosezioni (righe che descrivono il tipo di prodotto)
            subsection_keywords = [
                "centrali", "tastiere", "lettori", "access point", "rivelatori",
                "protezione", "sirene", "moduli", "gruppi di alimentazione",
                "comunicatori", "interfacce", "console", "barriere", "cavi",
                "contatti", "sensori", "batterie", "scatole", "alimentatori",
                "software", "monitorizzazione", "programmazione", "servizi",
                "attuatori", "ripetitori", "videoalarm"
            ]
            for kw in subsection_keywords:
                if kw in line.lower() and len(line) < 80 and not PRICE_RE.search(line):
                    if not any(skip in line.lower() for skip in ["foto", "articolo", "codice", "prezzo", "cert.", "indice"]):
                        current_subsection = line
                        break
        
        # Ora cerchiamo le righe con prezzo
        i = 0
        while i < len(lines):
            line = lines[i]
            
            # Salta header di tabella
            if any(h in line.lower() for h in ["foto", "codice articolo", "descrizione", "cert.", "cl. amb.", "indice", "rel. 1.0"]):
                i += 1
                continue
            
            # Cerca prezzo in questa riga
            price_match = PRICE_RE.search(line)
            if not price_match:
                i += 1
                continue
            
            price = norm_price(price_match.group(1))
            
            # Tutto il contenuto prima del prezzo
            before_price = line[:price_match.start()].strip()
            
            # Cerca il codice articolo: puo' essere nella riga o nelle righe sopra
            sku = ""
            name = ""
            desc = ""
            
            # Prima cerca codice nella riga stessa
            code_match = CODE_RE.search(before_price)
            if code_match:
                sku = code_match.group(1)
                # Il nome e' il testo prima del codice
                name = before_price[:code_match.start()].strip()
                desc = before_price[code_match.end():].strip()
            
            # Se non trovato, guarda le righe sopra
            if not sku:
                # Cerca nelle 5 righe sopra
                for k in range(max(0, i - 5), i):
                    code_match = CODE_RE.search(lines[k])
                    if code_match:
                        sku = code_match.group(1)
                        name = lines[k][:code_match.start()].strip()
                        break
                
                # Se ancora niente, usa il testo prima del prezzo come nome
                if not sku:
                    # Prova pattern piu' generico
                    generic_match = re.search(r'([A-Z][A-Z0-9/_.\-]{4,})', before_price)
                    if generic_match:
                        sku = generic_match.group(1)
                        name = before_price[:generic_match.start()].strip()
                    else:
                        i += 1
                        continue
            
            # Se il nome e' vuoto, guarda la riga sopra
            if not name:
                for k in range(max(0, i - 3), i):
                    if len(lines[k]) > 5 and not PRICE_RE.search(lines[k]) and lines[k] not in [sku]:
                        if not any(h in lines[k].lower() for h in ["foto", "codice articolo", "descrizione", "cert."]):
                            name = lines[k]
                            break
            
            # Cerca descrizione: riga lunga vicina (tipicamente sotto il nome)
            if not desc:
                for k in range(max(0, i - 8), i):
                    if len(lines[k]) > 40 and not PRICE_RE.search(lines[k]):
                        if not any(h in lines[k].lower() for h in ["foto", "codice articolo", "cert.", "indice"]):
                            desc = lines[k]
                            break
            
            # Pulizia
            name = name.strip(" -|,.")
            if not name:
                name = sku
            
            # Aggiungi "Tecnoalarm" al nome se non presente
            if not name.lower().startswith("tecnoalarm"):
                name = f"Tecnoalarm {name}"
            
            # Categoria
            category = current_section
            if current_subsection and current_subsection != current_section:
                category = f"{current_section} > {current_subsection}"
            if not category:
                category = "Tecnoalarm"
            
            # Evita duplicati
            if not any(r["SKU"] == sku for r in rows):
                rows.append({
                    "Nome Prodotto": name,
                    "SKU": sku,
                    "Categoria": category,
                    "Marca": "Tecnoalarm",
                    "Modello": sku,
                    "Descrizione": desc[:500] if desc else "",
                    "Codice a Barre": "",
                    "Codice QR": "",
                    "Unita": "Pezzi",
                    "Quantita": 0,
                    "Scorta Min": 0,
                    "Scorta Max": 0,
                    "Prezzo Acquisto": price,
                    "Prezzo Vendita": "",
                    "Posizione": "",
                    "Scaffale": "",
                    "Fornitore": "Tecnoalarm",
                    "Note": f"Listino TA PRODOTTI 2026-10 (pag. {page_num + 1})"
                })
            
            i += 1
    
    doc.close()
    return pd.DataFrame(rows)


def extract_ricambi(pdf_path: str) -> pd.DataFrame:
    """Estrae ricambi dal listino RICAMBI Tecnoalarm.
    Formato: ogni prodotto e' su 3-4 righe separate:
      Riga -3: Nome articolo (es. CPU, TAMPER, CONTENITORE)
      Riga -2: Codice articolo (es. C110C200P, S110CPUEV424-4G)
      Riga -1: Descrizione (es. Contenitore in ABS, Scheda CPU)
      Riga  0: Prezzo (es. € 58,50)
    """
    doc = fitz.open(pdf_path)
    rows = []
    current_section = ""
    current_subsection = ""
    
    # Pattern codice ricambi: inizia con lettera maiuscola seguita da cifre
    RICAMBI_CODE_RE = re.compile(r'^([A-Z]\d{2,3}[A-Z0-9/_.\-]{2,})$')
    
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        text = page.get_text()
        
        if not text.strip():
            continue
        
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # Traccia sezione
        for line in lines:
            upper = line.upper()
            if upper.startswith("SISTEMI EV"):
                current_section = "Ricambi Sistemi EV"
            elif upper.startswith("SISTEMI TP"):
                current_section = "Ricambi Sistemi TP"
            elif upper.startswith("COMPLIMENTI") or upper.startswith("COMPLEMENTI"):
                current_section = "Ricambi Complementi"
            elif upper.startswith("VIDEOALARM"):
                current_section = "Ricambi VideoAlarm"
            elif upper.startswith("CONSOLE"):
                current_section = "Ricambi Console"
            elif upper.startswith("MODULI"):
                current_section = "Ricambi Moduli"
            elif upper.startswith("TECNOLOGIA RSC"):
                current_section = "Ricambi RSC"
            elif upper.startswith("TECNOLOGIA WIRELESS"):
                current_section = "Ricambi Wireless"
            elif upper.startswith("SIRENE"):
                current_section = "Ricambi Sirene"
            elif upper.startswith("ALIMENTATORI"):
                current_section = "Ricambi Alimentatori"
            elif upper.startswith("SOFTWARE"):
                current_section = "Ricambi Software"
            elif upper.startswith("ACCESSORI"):
                current_section = "Ricambi Accessori"
            elif upper.startswith("RIPARAZIONI"):
                current_section = "Riparazioni"
            
            # Sottosezioni
            subsection_kws = ["centrali", "tastiere", "lettori", "rivelatori", "protezione", 
                              "sirene", "moduli", "barriere", "batterie", "console", "comunicatori",
                              "gruppi di alimentazione"]
            for kw in subsection_kws:
                if kw in line.lower() and len(line) < 80 and not PRICE_RE.search(line):
                    if not any(h in line.lower() for h in ["articolo", "ricambio", "cod.", "prezzo"]):
                        current_subsection = line
                        break
        
        # Cerca righe con prezzo e vai a ritroso per trovare codice/nome/desc
        for i, line in enumerate(lines):
            # La riga deve essere SOLO un prezzo
            price_match = PRICE_RE.match(line)
            if not price_match:
                # Prova anche con testo prima
                price_match = PRICE_RE.search(line)
                if not price_match:
                    continue
            
            price = norm_price(price_match.group(1))
            
            # Salta headers
            if any(h in line.lower() for h in ["articolo", "ricambio", "cod. ricambio", "indice", "rel. 1.0", "condizioni generali"]):
                continue
            
            # Guarda le 3 righe sopra: nome, codice, descrizione
            sku = ""
            name = ""
            desc = ""
            
            # Cerca il codice articolo nelle righe sopra (riga -2 tipicamente)
            for k in range(max(0, i - 4), i):
                if RICAMBI_CODE_RE.match(lines[k]):
                    sku = lines[k]
                    # Nome = riga sopra il codice
                    if k > 0 and not PRICE_RE.search(lines[k-1]) and not RICAMBI_CODE_RE.match(lines[k-1]):
                        name = lines[k-1]
                    # Descrizione = riga sotto il codice (prima del prezzo)
                    if k + 1 < i and not PRICE_RE.search(lines[k+1]):
                        desc = lines[k+1]
                        # Aggiungi righe extra di descrizione
                        for m in range(k + 2, i):
                            if not PRICE_RE.search(lines[m]) and not RICAMBI_CODE_RE.match(lines[m]):
                                desc += " " + lines[m]
                            else:
                                break
                    break
            
            # Se non trovato con pattern stretto, prova piu' generico
            if not sku:
                for k in range(max(0, i - 3), i):
                    generic = re.match(r'^([A-Z][A-Z0-9/_.\-]{4,})$', lines[k])
                    if generic:
                        sku = generic.group(1)
                        if k > 0 and not PRICE_RE.search(lines[k-1]):
                            name = lines[k-1]
                        if k + 1 < i and not PRICE_RE.search(lines[k+1]):
                            desc = lines[k+1]
                        break
            
            # Gestisci il caso di codice + descrizione sulla stessa riga (es. "CAVO ALIMENTATORE C126CAVOALI")
            if not sku:
                before = line[:price_match.start()].strip() if price_match.start() > 0 else ""
                if before:
                    code_inline = re.search(r'([CSFDRE]\d{2,3}[A-Z0-9/_.\-]{2,})', before)
                    if code_inline:
                        sku = code_inline.group(1)
                        name = before[:code_inline.start()].strip()
                        desc = before[code_inline.end():].strip()
                # Anche nelle righe sopra con formato inline
                if not sku:
                    for k in range(max(0, i - 2), i):
                        code_inline = re.search(r'([CSFDRE]\d{2,3}[A-Z0-9/_.\-]{2,})', lines[k])
                        if code_inline and not PRICE_RE.search(lines[k]):
                            sku = code_inline.group(1)
                            name = lines[k][:code_inline.start()].strip()
                            desc = lines[k][code_inline.end():].strip()
                            break
            
            if not sku:
                continue
            
            # Pulizia nome
            name = name.strip(" -|,.")
            # Salta se nome e' un header
            if name.lower() in ["articolo", "ricambio", "cod. ricambio", "descrizione", "prezzo"]:
                name = ""
            if not name:
                name = desc if desc else sku
            
            if not name.lower().startswith("tecnoalarm"):
                name = f"Tecnoalarm {name}"
            
            category = current_section
            if current_subsection:
                category = f"{current_section} > {current_subsection}"
            if not category:
                category = "Tecnoalarm Ricambi"
            
            rows.append({
                "Nome Prodotto": name,
                "SKU": sku,
                "Categoria": category,
                "Marca": "Tecnoalarm",
                "Modello": sku,
                "Descrizione": desc[:500] if desc else "",
                "Codice a Barre": "",
                "Codice QR": "",
                "Unita": "Pezzi",
                "Quantita": 0,
                "Scorta Min": 0,
                "Scorta Max": 0,
                "Prezzo Acquisto": price,
                "Prezzo Vendita": "",
                "Posizione": "",
                "Scaffale": "",
                "Fornitore": "Tecnoalarm",
                "Note": f"Listino TA RICAMBI 2026-10 (pag. {page_num + 1})"
            })
    
    doc.close()
    df = pd.DataFrame(rows)
    if not df.empty:
        # Per ricambi ci possono essere duplicati legittimi (stesso codice, prezzi diversi per varianti)
        # Teniamo il primo
        df = df.drop_duplicates(subset=["SKU"], keep="first").reset_index(drop=True)
    return df


if __name__ == "__main__":
    import os
    
    print("=" * 60)
    print("ESTRAZIONE LISTINO TECNOALARM")
    print("=" * 60)
    
    # PRODOTTI
    if os.path.exists(PDF_PRODOTTI):
        print(f"\nElaborazione PRODOTTI: {PDF_PRODOTTI}")
        df_prod = extract_prodotti(PDF_PRODOTTI)
        if not df_prod.empty:
            df_prod.to_csv(OUT_PRODOTTI, sep=";", index=False, encoding="utf-8-sig")
            print(f"OK: {OUT_PRODOTTI}")
            print(f"Prodotti estratti: {len(df_prod)}")
            print(f"\nCategorie trovate:")
            for cat, count in df_prod["Categoria"].value_counts().head(20).items():
                print(f"  {cat}: {count}")
            print(f"\nPrimi 10 prodotti:")
            for _, row in df_prod.head(10).iterrows():
                print(f"  {row['SKU']:35s} | {row['Prezzo Acquisto']:>10s} | {row['Nome Prodotto'][:50]}")
        else:
            print("ATTENZIONE: Nessun prodotto estratto!")
    else:
        print(f"File non trovato: {PDF_PRODOTTI}")
    
    print("\n" + "=" * 60)
    
    # RICAMBI
    if os.path.exists(PDF_RICAMBI):
        print(f"\nElaborazione RICAMBI: {PDF_RICAMBI}")
        df_ric = extract_ricambi(PDF_RICAMBI)
        if not df_ric.empty:
            df_ric.to_csv(OUT_RICAMBI, sep=";", index=False, encoding="utf-8-sig")
            print(f"OK: {OUT_RICAMBI}")
            print(f"Ricambi estratti: {len(df_ric)}")
            print(f"\nCategorie trovate:")
            for cat, count in df_ric["Categoria"].value_counts().head(20).items():
                print(f"  {cat}: {count}")
            print(f"\nPrimi 10 ricambi:")
            for _, row in df_ric.head(10).iterrows():
                print(f"  {row['SKU']:35s} | {row['Prezzo Acquisto']:>10s} | {row['Nome Prodotto'][:50]}")
        else:
            print("ATTENZIONE: Nessun ricambio estratto!")
    else:
        print(f"File non trovato: {PDF_RICAMBI}")
    
    print("\n" + "=" * 60)
    print("FINE")
