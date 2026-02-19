# pip install pymupdf pytesseract pillow pandas
# Su macOS: brew install tesseract tesseract-lang
# Su Windows: installa anche Tesseract OCR e aggiungilo al PATH
# https://github.com/UB-Mannheim/tesseract/wiki

import re, io
import pandas as pd
import fitz  # PyMuPDF
from PIL import Image
import pytesseract

PDF_PRODOTTI = r"/Users/akirayouky/Downloads/Listino_TA_PRODOTTI_2026-10.pdf"
PDF_RICAMBI  = r"/Users/akirayouky/Downloads/Listino_TA_RICAMBI_2026-10_ita.pdf"

OUT_PRODOTTI = "/Users/akirayouky/Downloads/tecnoalarm_listino_prodotti_2026-10_import_form.csv"
OUT_RICAMBI  = "/Users/akirayouky/Downloads/tecnoalarm_listino_ricambi_2026-10_import_form.csv"

# Prezzo (formato IT)
PRICE_PAT = r'([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:,[0-9]{2}))'
price_re  = re.compile(r'\u20ac\s*' + PRICE_PAT)
code_br_re = re.compile(r'\[([A-Z0-9][A-Z0-9/._\-]{3,})\]')
code_re    = re.compile(r'([A-Z0-9][A-Z0-9/._\-]{3,})')

def norm_price(s: str) -> str:
    n = float(s.replace('.', '').replace(',', '.'))
    return f"{n:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')

def ocr_page(doc, pno, dpi=170, timeout=30):
    pix = doc.load_page(pno).get_pixmap(dpi=dpi)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
    # riduci un po' se enorme (velocizza)
    if max(img.size) > 1800:
        scale = 1800 / max(img.size)
        img = img.resize((int(img.size[0]*scale), int(img.size[1]*scale)))
    return pytesseract.image_to_string(img, lang="ita", config="--oem 1 --psm 6", timeout=timeout)

def parse_pdf(pdf_path: str, note_prefix: str) -> pd.DataFrame:
    doc = fitz.open(pdf_path)
    rows = []

    for p in range(doc.page_count):
        try:
            txt = ocr_page(doc, p)
        except Exception:
            continue

        for ln in [x.strip() for x in txt.splitlines() if x.strip()]:
            low = ln.lower()
            # filtra intestazioni "di tabella"
            if any(k in low for k in ["listino", "codice articolo", "descrizione", "prezzo", "foto", "rel."]):
                continue

            pm = price_re.search(ln)
            if not pm:
                continue
            price = norm_price(pm.group(1))

            # SKU: prima prova codice tra [ ... ], altrimenti ultimo token "codice-like" prima del prezzo
            sku = ""
            bm = code_br_re.findall(ln)
            if bm:
                sku = bm[0]
            else:
                left = ln[:pm.start()]
                toks = code_re.findall(left)
                if toks:
                    sku = toks[-1]

            if not sku:
                continue

            # Nome: testo prima dello SKU
            left = ln[:pm.start()].replace("|", " ").strip()
            # se lo SKU era in [ ], taglia prima della prima parentesi
            if "[" in left:
                name = left.split("[", 1)[0].strip(" -|")
            else:
                name = left.rsplit(sku, 1)[0].strip(" -|")

            # Descrizione: quello che resta fra SKU e prezzo (ripulito)
            middle = ln
            if pm:
                middle = ln[:pm.start()]
            desc = middle.replace("|", " ")
            # prova a togliere nome e sku dal desc
            desc = desc.replace(name, "").replace(sku, "").replace("[", " ").replace("]", " ")
            desc = re.sub(r"\s{2,}", " ", desc).strip(" -|")

            if not name:
                name = desc or sku

            rows.append({
                "Nome Prodotto": f"Tecnoalarm {name}" if not name.lower().startswith("tecnoalarm") else name,
                "SKU": sku,
                "Categoria": "",
                "Marca": "Tecnoalarm",
                "Modello": sku,
                "Descrizione": desc,
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
                "Note": f"{note_prefix} (pag. {p+1})"
            })

    df = pd.DataFrame(rows)
    if df.empty:
        return df

    df = df.drop_duplicates(subset=["SKU"], keep="first").reset_index(drop=True)
    return df

if __name__ == "__main__":
    import os
    
    if os.path.exists(PDF_PRODOTTI):
        df_prod = parse_pdf(PDF_PRODOTTI, "Listino TA PRODOTTI 2026-10")
        df_prod.to_csv(OUT_PRODOTTI, sep=";", index=False, encoding="utf-8-sig")
        print("OK:", OUT_PRODOTTI, len(df_prod), "righe")
    else:
        print(f"File non trovato: {PDF_PRODOTTI}")
        print("Metti i PDF Tecnoalarm nella cartella Downloads e riprova.")
    
    if os.path.exists(PDF_RICAMBI):
        df_ric = parse_pdf(PDF_RICAMBI, "Listino TA RICAMBI 2026-10")
        df_ric.to_csv(OUT_RICAMBI, sep=";", index=False, encoding="utf-8-sig")
        print("OK:", OUT_RICAMBI, len(df_ric), "righe")
    else:
        print(f"File non trovato: {PDF_RICAMBI}")
