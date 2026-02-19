"""Analizza la struttura dei PDF Tecnoalarm per capire se hanno testo nativo o servono OCR"""
import fitz

for pdf_name, pdf_path in [
    ("PRODOTTI", "/Users/akirayouky/Downloads/Listino_TA_PRODOTTI_2026-10.pdf"),
    ("RICAMBI", "/Users/akirayouky/Downloads/Listino_TA_RICAMBI_2026-10_ita.pdf"),
]:
    doc = fitz.open(pdf_path)
    print(f"\n{'='*80}")
    print(f"PDF: {pdf_name} - Pagine: {doc.page_count}")
    print(f"{'='*80}")
    
    native_pages = 0
    empty_pages = 0
    
    for p in range(min(5, doc.page_count)):
        page = doc.load_page(p)
        text = page.get_text()
        if text.strip():
            native_pages += 1
            print(f"\n--- Pag. {p+1} (testo nativo: {len(text)} chars) ---")
            print(text[:1500])
            print("...")
        else:
            empty_pages += 1
            print(f"\n--- Pag. {p+1} (vuota/immagine - servira OCR) ---")
    
    # Conta totale pagine con testo
    total_native = sum(1 for p in range(doc.page_count) if doc.load_page(p).get_text().strip())
    print(f"\nTOTALE: {total_native}/{doc.page_count} pagine con testo nativo")
    doc.close()
