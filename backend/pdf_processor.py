from pypdf import PdfReader
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract raw text from a PDF file's bytes."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        text_parts.append(page.extract_text() or "")
    full_text = "\n".join(text_parts)
    return full_text.strip()


def chunk_text(text: str, max_chars: int = 15000) -> str:
    """
    Simple truncation for now — research papers rarely exceed this
    within Claude's context window, so we just cap it defensively.
    """
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n\n[...truncated for length...]"