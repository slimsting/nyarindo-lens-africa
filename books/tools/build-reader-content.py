"""Build responsive reader data from the canonical book PDFs.

The PDFs remain the downloadable source of truth. This script extracts their
selectable text into semantic blocks so the online reader can reflow without
scaling or cropping fixed page images.
"""

from __future__ import annotations

import json
import re
import statistics
from collections import Counter
from pathlib import Path
from typing import Iterable

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "pdfs"
OUTPUT_DIR = ROOT / "reader-content"

BOOKS = {
    "introduction": "general-introduction.pdf",
    "the-nyarindo-lens": "book-01-nyarindo-lens.pdf",
    "the-pulse-reports": "book-02-pulse-reports.pdf",
    "stories-we-tell-about-the-pulse": "book-03-stories-we-tell-about-the-pulse.pdf",
    "the-method-in-the-waves": "book-04-method-in-the-waves.pdf",
    "attention": "book-05-attention.pdf",
    "teaching-the-wave-mind": "book-06-teaching-the-wave-mind.pdf",
    "the-vacuum-experiment": "book-07-vacuum-experiment.pdf",
    "collection": "collection-spiral-of-reach-and-return.pdf",
    "end-note": "end-note.pdf",
}


def group_lines(words: Iterable[dict]) -> list[dict]:
    """Group positioned PDF words into readable visual lines."""
    ordered = sorted(words, key=lambda word: (word["top"], word["x0"]))
    grouped: list[list[dict]] = []
    for word in ordered:
        if not grouped or abs(word["top"] - grouped[-1][0]["top"]) > 2.5:
            grouped.append([word])
        else:
            grouped[-1].append(word)

    lines = []
    for row in grouped:
        row.sort(key=lambda word: word["x0"])
        text = " ".join(word["text"] for word in row).strip()
        if not text:
            continue
        fonts = [word.get("fontname", "") for word in row]
        sizes = [float(word.get("size", 12)) for word in row]
        char_weight = sum(len(word["text"]) for word in row) or 1
        bold_weight = sum(
            len(word["text"]) for word in row if "Bold" in word.get("fontname", "")
        )
        lines.append(
            {
                "text": text,
                "x0": min(float(word["x0"]) for word in row),
                "x1": max(float(word["x1"]) for word in row),
                "top": statistics.median(float(word["top"]) for word in row),
                "bottom": max(float(word["bottom"]) for word in row),
                "size": statistics.median(sizes),
                "bold": bold_weight / char_weight >= 0.55,
                "italic": sum("Italic" in font for font in fonts)
                >= max(1, len(fonts) / 2),
            }
        )
    return lines


def is_page_furniture(line: dict, page_height: float) -> bool:
    text = line["text"].strip()
    if line["top"] > page_height * 0.9 and re.fullmatch(
        r"Page\s+\d+\s+of\s+\d+", text
    ):
        return True
    return bool(
        line["top"] > page_height * 0.94 and re.fullmatch(r"\d+", text)
    )


def build_page(page) -> list[dict]:
    words = page.extract_words(
        x_tolerance=1.5,
        y_tolerance=3,
        keep_blank_chars=False,
        use_text_flow=False,
        extra_attrs=["fontname", "size"],
    )
    lines = [
        line
        for line in group_lines(words)
        if not is_page_furniture(line, page.height)
    ]
    if not lines:
        return [
            {
                "type": "empty",
                "text": "This page contains a full-page illustration. Use the PDF download to view the original artwork.",
            }
        ]

    body_candidates = [
        round(line["x0"] / 4) * 4 for line in lines if not line["bold"]
    ]
    body_x = Counter(body_candidates).most_common(1)[0][0] if body_candidates else 72

    blocks: list[dict] = []
    paragraph: list[str] = []

    def flush_paragraph() -> None:
        if not paragraph:
            return
        text = " ".join(part.strip() for part in paragraph if part.strip())
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            blocks.append({"type": "paragraph", "text": text})
        paragraph.clear()

    previous = None
    for line in lines:
        text = line["text"].strip()
        if not text:
            continue
        gap = None if previous is None else line["top"] - previous["top"]
        indented = line["x0"] > body_x + 18
        centered = line["x0"] > body_x + 45
        short = len(text) <= 110
        figure = text.lower().startswith(("figure ", "table ")) or "figure:" in text.lower()
        list_item = bool(re.match(r"^(?:\d+[.)]|[-•])\s+", text))
        heading = short and (line["bold"] or (centered and len(text) < 80))

        if heading:
            flush_paragraph()
            blocks.append({"type": "heading", "text": text})
        elif figure:
            flush_paragraph()
            blocks.append({"type": "caption", "text": text})
        elif list_item:
            flush_paragraph()
            blocks.append({"type": "list-item", "text": text})
        else:
            if paragraph and (
                indented
                or (gap is not None and gap > max(19.0, line["size"] * 1.55))
            ):
                flush_paragraph()
            paragraph.append(text)
        previous = line

    flush_paragraph()
    return blocks


def build_book(book_id: str, filename: str) -> dict:
    source = PDF_DIR / filename
    with pdfplumber.open(source) as pdf:
        pages = []
        for number, page in enumerate(pdf.pages, start=1):
            pages.append({"number": number, "blocks": build_page(page)})
    return {
        "id": book_id,
        "source": f"/books/pdfs/{filename}",
        "pageCount": len(pages),
        "pages": pages,
    }


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for book_id, filename in BOOKS.items():
        book = build_book(book_id, filename)
        output = OUTPUT_DIR / f"{book_id}.json"
        output.write_text(
            json.dumps(book, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        manifest[book_id] = {
            "file": f"/books/reader-content/{book_id}.json",
            "pageCount": book["pageCount"],
            "bytes": output.stat().st_size,
        }
        print(
            f"{book_id}: {book['pageCount']} pages, "
            f"{output.stat().st_size:,} bytes"
        )
    (OUTPUT_DIR / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
