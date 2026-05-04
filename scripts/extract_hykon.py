"""
Estrattore listino HYKON dal PDF (immagini scansionate - usa OCR).
Output: CSV nel formato standard per import in AKSuite Warehouse.

Uso:
  .venv/bin/python scripts/extract_hykon.py
"""

import re
import io
import sys
import pandas as pd
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

PDF_PATH = "Hykon_Listino ottobre 2025.pdf"
OUT_CSV  = "hykon_listino_import.csv"

# Mappa pagina PDF (0-based) -> categoria/sottocategoria dal sommario
# (basata sull'indice a p.2 del PDF)
PAGE_CATEGORIES = {
    range(6, 10):   ("Sistemi Over IP", "Telecamere Video Analisi Essential"),
    range(10, 15):  ("Sistemi Over IP", "Telecamere Video Analisi Premium Everlight"),
    range(15, 17):  ("Sistemi Over IP", "Telecamere Premium Everlight Suitline"),
    range(17, 18):  ("Sistemi Over IP", "Telecamere Premium Neverlight"),
    range(18, 19):  ("Sistemi Over IP", "Telecamere Panoramiche ITC Premium"),
    range(19, 21):  ("Sistemi Over IP", "Telecamere Speed Dome IP"),
    range(21, 22):  ("Sistemi Over IP", "Telecamere Fisheye"),
    range(22, 23):  ("Sistemi Over IP", "Telecamere Multiottica / Lettura Targhe"),
    range(23, 24):  ("Sistemi Over IP", "Illuminatori Infrarosso PoE"),
    range(24, 25):  ("Network Video Recorder", "NVR"),
    range(25, 26):  ("Network Video Recorder", "NVR PoE"),
    range(26, 27):  ("Network Video Recorder", "NVR Senza PoE"),
    range(27, 28):  ("Network Video Recorder", "NVR Senza PoE con Video Analisi"),
    range(28, 30):  ("Network Video Recorder", "CMS HYKON Surveillance"),
    range(31, 33):  ("Sistemi Analogici", "Telecamere 4 in 1"),
    range(32, 33):  ("Sistemi Analogici", "Storage"),
    range(33, 36):  ("Sistemi Analogici", "DVR Analogici Ibridi HD-TVI/AHD/HD-CVI"),
    range(36, 40):  ("Smart Key", "Touch"),
    range(39, 40):  ("Smart Key", "Accessori Smart Key Touch"),
    range(41, 44):  ("Monitor", "Monitor Standard e Industriali"),
    range(43, 44):  ("Monitor", "Accessori per Monitor"),
    range(44, 45):  ("Monitor", "Monitor Test"),
    range(45, 48):  ("UPS e Soccorritori", "UPS Interactive Standard"),
    range(46, 47):  ("UPS e Soccorritori", "UPS Interactive Sinusoidale"),
    range(47, 48):  ("UPS e Soccorritori", "UPS Doppia Conversione"),
    range(47, 49):  ("UPS e Soccorritori", "Soccorritori / Accessori"),
    range(48, 55):  ("Networking TVCC", "Switch PoE / Layer2 / Layer3"),
    range(52, 53):  ("Networking TVCC", "Switch Industriali PoE Layer2 Managed"),
    range(52, 53):  ("Networking TVCC", "PoE Extender"),
    range(53, 55):  ("Networking TVCC", "Protezioni Sovratensioni / Iniettori PoE"),
    range(54, 56):  ("Networking TVCC", "Minigibic / Convertitori / Media"),
    range(55, 56):  ("Networking TVCC", "Moduli I/O TCP/IP"),
    range(56, 61):  ("Armadi Rack TVCC", "Armadi"),
    range(60, 61):  ("Armadi Rack TVCC", "Accessori per Rack"),
    range(61, 63):  ("Trasmissione Segnali", "Extender HDMI / Modulatori"),
    range(62, 64):  ("Trasmissione Segnali", "Cavi HDMI / Balun"),
    range(63, 65):  ("Accessori di Fissaggio", "Supporti Telecamere e Accessori"),
}

def get_category(page_num: int):
    for r, (cat, sub) in PAGE_CATEGORIES.items():
        if page_num in r:
            return cat, sub
    return "Hykon", ""

# Codici Hykon tipici: HYBX..., ITCG..., HY..., ITC..., HYBM...
# Anche codici networking come SW...
CODE_RE  = re.compile(r'\b([A-Z]{2,}[A-Z0-9]{2,}(?:[/_.\-][A-Z0-9]+)*)\b')
PRICE_RE = re.compile(r'(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:€|EUR)?')

def is_valid_code(s: str) -> bool:
    """Filtra codici plausibili Hykon (almeno 4 char, presenza cifre o pattern)"""
    if len(s) < 4:
        return False
    # Scarta parole comuni / titoli
    skip = {'CODICE', 'ACCESSORI', 'LISTINO', 'DESCRIZIONE', 'FOTO', 'NOTE',
            'CONVENTIONAL', 'NETWORK', 'VIDEO', 'RECORDER', 'SMART', 'MONITOR',
            'STORAGE', 'SWITCH', 'LAYER', 'ARMADI', 'MODULI', 'TRASMISSIONE',
            'BALUN', 'HDMI', 'EXTENDER', 'PREMIUM', 'STANDARD', 'SENZA', 'TOUCH',
            'INTERACTIVE', 'SINUSOIDALE', 'CONVERSIONE', 'SOCCORRITORI', 'POE',
            'INDUSTRIALI', 'INFRASTRUTTURE', 'MANAGED', 'EXTENDER', 'CONVERTITORI',
            'ETHERNET', 'MEDIA', 'ALIMENTATORI', 'PROTEZIONI', 'SOVRATENSIONI',
            'INIETTORI', 'MINIGIBIC', 'FISHEYE', 'MULTIOTTICA', 'LETTURA', 'TARGHE',
            'NEVERLIGHT', 'EVERLIGHT', 'SUITLINE', 'ESSENTIAL', 'PANORAMICHE',
            'DOME', 'SPEED', 'FISHEYE', 'IBRIDI', 'ANALOGICI', 'ANALISI', 'BORDO'}
    if s.upper() in skip:
        return False
    # Deve contenere almeno un numero
    if not any(c.isdigit() for c in s):
        return False
    return True

def norm_price(s: str) -> float:
    """Normalizza stringa prezzo in float"""
    s = s.strip()
    # Formato italiano: 1.234,56 o 1234,56
    if ',' in s and '.' in s:
        # 1.234,56
        s = s.replace('.', '').replace(',', '.')
    elif ',' in s:
        s = s.replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return 0.0

import numpy as np

# Percentuali colonne nel PDF Hykon (verificate sperimentalmente):
# CODE: 0–17%,  DESC: 17–77%,  ACC: 77–85%,  PRICE: 85–100%
COL_CODE_END   = 0.17
COL_DESC_END   = 0.77
COL_ACC_END    = 0.85

# Normalizzazione OCR errori comuni sui codici Hykon
OCR_FIXES = [
    (r'[Oo]', '0', lambda s: re.sub(r'[Oo]', '0', s)),   # O→0
    (r'[Ii]', '1', None),  # solo nel contesto numerico
]

def fix_code(s: str) -> str:
    """Corregge errori OCR comuni nei codici Hykon"""
    s = s.strip(" .:,|()[]°*>©+='\"")
    # Rimuove prefisso di rumore (es: '> li ', '0 ', '© =» ')
    # Cerca il primo token uppercase+numbers che sembra un codice
    tokens = re.findall(r'[A-Z]{2,}[0-9A-Z/_.\-]{2,}', s)
    if tokens:
        s = tokens[-1]  # prendi l'ultimo (più a destra, meno rumore)
    s = re.sub(r'z$', 'W', s)
    s = re.sub(r'Z$', 'W', s)
    s = re.sub(r'(?<=[A-Z])O(?=[0-9])', '0', s)
    s = re.sub(r'(?<=[0-9])O(?=[0-9A-Z])', '0', s)
    # numero finale che sembra 'é' → 'e' (OCR confonde)
    s = re.sub(r'é$', '', s)
    return s

def get_clean_image(pix):
    """Converte il pixmap in immagine binaria con testo bianco → nero su bianco"""
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
    arr = np.array(img)
    # Solo pixel molto chiari (testo bianco su sfondo scuro)
    mask = np.where(arr > 190, 0, 255).astype(np.uint8)
    clean = Image.fromarray(mask)
    # Upscale 2x per migliorare OCR
    clean = clean.resize((clean.width * 2, clean.height * 2), Image.LANCZOS)
    return clean

def ocr_col(img: Image.Image, x1_pct: float, x2_pct: float) -> str:
    w, h = img.size
    crop = img.crop((int(w * x1_pct), int(h * 0.08), int(w * x2_pct), int(h * 0.94)))
    return pytesseract.image_to_string(crop, lang="ita", config="--oem 1 --psm 6 --dpi 700")

def parse_page(page_num: int, code_text: str, desc_text: str, acc_text: str, price_text: str) -> list[dict]:
    """Allinea codici, descrizioni, accessori e prezzi per riga usando le liste estratte per colonna."""

    def extract_lines(text: str) -> list[str]:
        return [l.strip() for l in text.splitlines() if l.strip() and len(l.strip()) > 1]

    def extract_prices(text: str) -> list[tuple[float, int]]:
        """Ritorna lista di (prezzo, posizione_riga) dalle righe del testo"""
        prices = []
        for i, line in enumerate(text.splitlines()):
            m = PRICE_RE.search(line.strip())
            if m:
                p = norm_price(m.group(1))
                if 5 <= p <= 50000:
                    prices.append((p, i))
        return prices

    prices = extract_prices(price_text)
    if not prices:
        return []

    code_lines  = extract_lines(code_text)
    desc_lines  = extract_lines(desc_text)
    acc_lines   = extract_lines(acc_text)

    # Filtra linee di codice valide
    valid_codes = [fix_code(c) for c in code_lines if is_valid_code(c)]

    rows = []
    for idx, (price, _) in enumerate(prices):
        code = valid_codes[idx] if idx < len(valid_codes) else ""
        if not code:
            continue
        # Descrizione: chunk delle righe descrizione corrispondente
        # Ogni prodotto ha mediamente ~3-5 righe di descrizione
        if len(desc_lines) > 0 and len(prices) > 0:
            chunk = max(1, len(desc_lines) // len(prices))
            start = idx * chunk
            end   = start + chunk
            description = " ".join(desc_lines[start:end]).strip()
        else:
            description = ""

        accessory = acc_lines[idx] if idx < len(acc_lines) else ""

        cat, sub = get_category(page_num)
        rows.append({
            'sku':         code,
            'name':        description[:120] if description else code,
            'description': description,
            'category':    cat,
            'subcategory': sub,
            'brand':       'Hykon',
            'model':       code,
            'sell_price':  price,
            'notes':       accessory,
            'warehouse':   'listino',
            'unit':        'pz',
        })

    return rows

def main():
    print(f"Apertura PDF: {PDF_PATH}")
    doc = fitz.open(PDF_PATH)
    total_pages = doc.page_count
    print(f"Pagine totali: {total_pages}")

    all_rows = []
    product_pages = range(5, min(total_pages, 91))

    for pno in product_pages:
        sys.stdout.write(f"\rPagina {pno+1}/{total_pages}...")
        sys.stdout.flush()
        try:
            pix = doc.load_page(pno).get_pixmap(dpi=350)
            img = get_clean_image(pix)

            code_text  = ocr_col(img, 0.0,          COL_CODE_END)
            desc_text  = ocr_col(img, COL_CODE_END,  COL_DESC_END)
            acc_text   = ocr_col(img, COL_DESC_END,  COL_ACC_END)
            price_text = ocr_col(img, COL_ACC_END,   1.0)

            rows = parse_page(pno, code_text, desc_text, acc_text, price_text)
            all_rows.extend(rows)
        except Exception as e:
            print(f"\n  Errore pagina {pno+1}: {e}")

    print(f"\nProdotti estratti (grezzo): {len(all_rows)}")

    df = pd.DataFrame(all_rows)
    if df.empty:
        print("Nessun prodotto trovato!")
        return

    df = df.drop_duplicates(subset=['sku'], keep='first')
    print(f"Prodotti unici: {len(df)}")

    df = df[['sku', 'name', 'description', 'category', 'subcategory',
             'brand', 'model', 'sell_price', 'notes', 'warehouse', 'unit']]

    df.to_csv(OUT_CSV, index=False, encoding='utf-8-sig')
    print(f"\nCSV salvato: {OUT_CSV}")
    print("\nPrime 15 righe:")
    print(df.head(15).to_string())

if __name__ == '__main__':
    main()
