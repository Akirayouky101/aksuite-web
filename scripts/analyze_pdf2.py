"""Analizza pagine 5-12 del PDF Dahua Wireless"""
import fitz

PDF_PATH = "/Users/akirayouky/Downloads/Dahua - Listino videosorveglianza wireless Ottobre 2025.pdf"

doc = fitz.open(PDF_PATH)

for p in range(4, min(20, doc.page_count)):
    page = doc.load_page(p)
    text = page.get_text()
    if text.strip():
        print(f"\n{'='*80}")
        print(f"--- PAGINA {p+1} ---")
        print(f"{'='*80}")
        print(text[:3000])
