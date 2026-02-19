"""Analizza la struttura del PDF Dahua Wireless per capire il formato dei dati"""
import fitz
import io
from PIL import Image
import pytesseract

PDF_PATH = "/Users/akirayouky/Downloads/Dahua - Listino videosorveglianza wireless Ottobre 2025.pdf"

doc = fitz.open(PDF_PATH)
print(f"Pagine totali: {doc.page_count}")
print("=" * 80)

# Prova prima il testo nativo (non OCR)
for p in range(min(5, doc.page_count)):
    page = doc.load_page(p)
    text = page.get_text()
    if text.strip():
        print(f"\n--- PAGINA {p+1} (testo nativo) ---")
        print(text[:2000])
        print("...")
    else:
        print(f"\n--- PAGINA {p+1} (vuota/immagine, provo OCR) ---")
        pix = page.get_pixmap(dpi=170)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("L")
        if max(img.size) > 1800:
            scale = 1800 / max(img.size)
            img = img.resize((int(img.size[0]*scale), int(img.size[1]*scale)))
        ocr_text = pytesseract.image_to_string(img, lang="ita", config="--oem 1 --psm 6", timeout=30)
        print(ocr_text[:2000])
        print("...")
