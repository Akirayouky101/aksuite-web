"""
Estrattore dati dal PDF Dahua Listino Videosorveglianza Wireless Ottobre 2025.
Usa testo nativo (no OCR) - molto piu' veloce e preciso.
Output: CSV nel formato standard per import in AKSuite.
"""

import re
import pandas as pd
import fitz  # PyMuPDF

PDF_PATH = "/Users/akirayouky/Downloads/Dahua - Listino videosorveglianza wireless Ottobre 2025.pdf"
OUT_CSV = "/Users/akirayouky/Downloads/dahua_listino_Wireless_import_form.csv"

# Pattern per trovare il codice M-XXXXXXX e il prezzo sulla stessa riga o vicino
# Formato tipico: M-0036111 \n euro XX,XX  oppure  M-0036111 € XX,XX
M_CODE_RE = re.compile(r'(M-\d{7})')
PRICE_RE = re.compile(r'[\u20ac\$]\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2}))')
# Pattern per modelli Dahua (IPC-xxx, SD-xxx, NVR-xxx, etc.)
MODEL_RE = re.compile(r'((?:IPC-|SD\d|NVR\d|DHI-|DH-|KIT/)[A-Z0-9][A-Z0-9/_.\-]{5,})')
# Pattern per modelli corti tipo H5B, C5A, P5B-PV, T4A-LED etc.
SHORT_MODEL_RE = re.compile(r'^([A-Z]\d[A-Z](?:-[A-Z]{1,5})?)$')

def norm_price(s: str) -> str:
    """Converte prezzo formato IT (1.234,56) in stringa"""
    n = float(s.replace('.', '').replace(',', '.'))
    return f"{n:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

def determine_category(text_context: str, page_text: str) -> str:
    """Determina la categoria/sottocategoria dal contesto della pagina"""
    text_upper = (text_context + " " + page_text).upper()
    
    if "5G" in text_upper and "BULLET" in text_upper:
        return "Telecamere IP 5G > BULLET"
    elif "5G" in text_upper and "PTZ" in text_upper:
        return "Telecamere PTZ IP 5G > PTZ SD8"
    elif "4G" in text_upper and "BULLET" in text_upper:
        return "Telecamere IP 4G > BULLET"
    elif "4G" in text_upper and "DOME" in text_upper:
        return "Telecamere IP 4G > DOME"
    elif "4G" in text_upper and "PTZ SD6" in text_upper:
        return "Telecamere PTZ IP 4G > PTZ SD6"
    elif "4G" in text_upper and "PTZ SD4" in text_upper:
        return "Telecamere PTZ IP 4G > PTZ SD4"
    elif "4G" in text_upper and "PTZ SD2" in text_upper:
        return "Telecamere PTZ IP 4G > PTZ SD2"
    elif "4G" in text_upper and "PTZ" in text_upper:
        return "Telecamere PTZ IP 4G"
    elif "NVR" in text_upper:
        return "Videoregistratori NVR Wi-Fi > 1 HDD"
    elif "DOME PTZ" in text_upper:
        return "Telecamere PTZ IP Wi-Fi > DOME PTZ"
    elif "PTZ SD3" in text_upper:
        return "Telecamere PTZ IP Wi-Fi > PTZ SD3"
    elif "PICOO" in text_upper:
        return "Telecamere PT IP Wi-Fi > PICOO"
    elif "DOME" in text_upper:
        return "Telecamere IP Wi-Fi > DOME"
    elif "TURRET" in text_upper or "EYEBALL" in text_upper:
        return "Telecamere IP Wi-Fi > TURRET"
    elif "BULLET" in text_upper:
        return "Telecamere IP Wi-Fi > BULLET"
    elif "HERO" in text_upper:
        return "Telecamere PT IP Wi-Fi > HERO"
    elif "CUBE" in text_upper:
        return "Telecamere IP Wi-Fi > CUBE"
    else:
        return "Wireless"

def extract_products(pdf_path: str) -> pd.DataFrame:
    doc = fitz.open(pdf_path)
    rows = []
    
    # Traccia la sezione corrente (header della pagina)
    current_section = ""
    current_subsection = ""
    
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        text = page.get_text()
        
        if not text.strip():
            continue
        
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # Aggiorna sezione/sottosezione dai titoli
        for line in lines:
            upper = line.upper()
            if upper in ["BULLET", "DOME", "TURRET", "HERO", "CUBE", "PICOO", 
                         "PTZ SD3", "PTZ SD4", "PTZ SD6", "PTZ SD8", "DOME PTZ",
                         "PTZ SD2", "1 HDD"]:
                current_subsection = line
            if "TELECAMER" in upper or "NVR" in upper or "VIDEOREGISTRAT" in upper:
                if "WI-FI" in upper or "4G" in upper or "5G" in upper:
                    current_section = line
        
        # Cerca pattern: linee con M-code seguite da prezzo
        for i, line in enumerate(lines):
            m_match = M_CODE_RE.search(line)
            if not m_match:
                continue
            
            m_code = m_match.group(1)
            
            # Cerca prezzo nella stessa riga o nelle 2 righe successive
            price = ""
            search_text = line
            for j in range(1, 3):
                if i + j < len(lines):
                    search_text += " " + lines[i + j]
            
            price_match = PRICE_RE.search(search_text)
            if price_match:
                price = norm_price(price_match.group(1))
            
            if not price:
                continue
            
            # Cerca il modello: guarda le righe sopra (fino a 15 righe)
            model = ""
            description_lines = []
            
            for k in range(max(0, i - 20), i):
                prev_line = lines[k]
                # Modello lungo (IPC-xxx, SD-xxx, NVR-xxx)
                model_match = MODEL_RE.search(prev_line)
                if model_match:
                    model = model_match.group(1)
                
                # Modello corto (H5B, C5A, P5B-PV, T4A-LED)
                short_match = SHORT_MODEL_RE.match(prev_line)
                if short_match and not model:
                    model = short_match.group(1)
            
            # Se non troviamo modello lungo, cerca nella stessa riga o vicine
            if not model:
                for k in range(max(0, i - 5), min(len(lines), i + 3)):
                    model_match = MODEL_RE.search(lines[k])
                    if model_match:
                        model = model_match.group(1)
                        break
            
            # Cerca la descrizione: blocco di testo lungo prima del modello
            desc = ""
            for k in range(max(0, i - 25), i):
                prev_line = lines[k]
                if len(prev_line) > 50 and ("telecamera" in prev_line.lower() or 
                                              "nvr" in prev_line.lower() or
                                              "speed dome" in prev_line.lower() or
                                              "mini speed" in prev_line.lower() or
                                              "kit" in prev_line.lower() or
                                              "sensore" in prev_line.lower() or
                                              "risoluzione" in prev_line.lower()):
                    desc = prev_line
                    # Aggiungi righe successive della descrizione
                    for m in range(k + 1, i):
                        if len(lines[m]) > 30 and not M_CODE_RE.search(lines[m]) and not PRICE_RE.search(lines[m]):
                            if not lines[m].replace('mm', '').replace(' ', '').isdigit():
                                desc += " " + lines[m]
                        else:
                            break
                    break
            
            # Trova specs dalla riga del modello (risoluzione, ottica, ecc.)
            specs = ""
            for k in range(max(0, i - 3), i):
                if "Mp" in lines[k] or "mp" in lines[k].lower():
                    specs = lines[k]
                    break
            
            # Determina categoria
            page_context = current_section + " " + current_subsection
            category = determine_category(page_context, text[:500])
            
            # Genera nome prodotto
            if model:
                name = f"Dahua {model}"
            else:
                name = f"Dahua {m_code}"
            
            # Aggiungi specs al nome se disponibili
            resolution = ""
            for k in range(max(0, i - 5), i + 1):
                res_match = re.search(r'(\d+)\s*Mp', lines[k])
                if res_match:
                    resolution = res_match.group(1) + "Mp"
                    break
                res_match2 = re.search(r'(2x\d+)\s*Mp', lines[k])
                if res_match2:
                    resolution = res_match2.group(1) + "Mp"
                    break
            
            if resolution and model:
                name = f"Dahua {model} {resolution}"
            
            # Controlla duplicati per M-code
            if any(r["Codice a Barre"] == m_code for r in rows):
                continue
            
            rows.append({
                "Nome Prodotto": name,
                "SKU": model if model else m_code,
                "Categoria": category,
                "Marca": "Dahua",
                "Modello": model if model else m_code,
                "Descrizione": desc[:500] if desc else "",
                "Codice a Barre": m_code,
                "Codice QR": "",
                "Unita": "Pezzi",
                "Quantita": 0,
                "Scorta Min": 0,
                "Scorta Max": 0,
                "Prezzo Acquisto": price,
                "Prezzo Vendita": "",
                "Posizione": "",
                "Scaffale": "",
                "Fornitore": "Dahua",
                "Note": f"Listino Wireless Ott 2025 (pag. {page_num + 1})"
            })
    
    doc.close()
    
    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.drop_duplicates(subset=["Codice a Barre"], keep="first").reset_index(drop=True)
    
    return df


if __name__ == "__main__":
    print("Estrazione dati da:", PDF_PATH)
    df = extract_products(PDF_PATH)
    
    # Rinomina colonne per il formato CSV di import
    df.columns = [
        "Nome Prodotto", "SKU", "Categoria", "Marca", "Modello", "Descrizione",
        "Codice a Barre", "Codice QR", "Unita", "Quantita", "Scorta Min", "Scorta Max",
        "Prezzo Acquisto", "Prezzo Vendita", "Posizione", "Scaffale", "Fornitore", "Note"
    ]
    
    df.to_csv(OUT_CSV, sep=";", index=False, encoding="utf-8-sig")
    
    print(f"\nCSV generato: {OUT_CSV}")
    print(f"Prodotti estratti: {len(df)}")
    print(f"\nCategorie trovate:")
    if not df.empty:
        for cat, count in df["Categoria"].value_counts().items():
            print(f"  {cat}: {count}")
    
    print(f"\nPrimi 10 prodotti:")
    if not df.empty:
        for _, row in df.head(10).iterrows():
            print(f"  {row['SKU']:40s} | {row['Prezzo Acquisto']:>12s} | {row['Categoria']}")
    
    print(f"\nUltimi 5 prodotti:")
    if not df.empty:
        for _, row in df.tail(5).iterrows():
            print(f"  {row['SKU']:40s} | {row['Prezzo Acquisto']:>12s} | {row['Categoria']}")
