"""Debug: vediamo il formato delle righe con prezzo nel PDF RICAMBI"""
import re
import fitz

PDF_RICAMBI = "/Users/akirayouky/Downloads/Listino_TA_RICAMBI_2026-10_ita.pdf"
PRICE_RE = re.compile(r'\u20ac\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2})')

doc = fitz.open(PDF_RICAMBI)

for page_num in [4, 5, 6, 7, 8]:  # Prime pagine con dati
    page = doc.load_page(page_num)
    text = page.get_text()
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    print(f"\n=== PAGINA {page_num + 1} ===")
    for i, line in enumerate(lines):
        if PRICE_RE.search(line):
            # Mostra contesto: 3 righe sopra + riga con prezzo
            for k in range(max(0, i-3), i+1):
                marker = ">>>" if k == i else "   "
                print(f"  {marker} [{k}] {lines[k]}")
            print()

doc.close()
