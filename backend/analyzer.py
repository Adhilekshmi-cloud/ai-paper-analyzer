import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are a research paper analysis assistant. Given the raw
text of an academic paper, extract structured information and return it as
STRICT JSON only — no markdown, no preamble, no explanation outside the JSON.

Return this exact schema:
{
  "title": "paper title if identifiable, else null",
  "summary": "3-5 sentence plain-language summary",
  "key_findings": ["finding 1", "finding 2", ...],
  "methodology": "brief description of methods/approach used",
  "citations_mentioned": ["notable cited work 1", "notable cited work 2", ...],
  "limitations": ["limitation 1", "limitation 2", ...]
}

If a field cannot be determined, use null or an empty array. Do not invent
information not present in the text."""


def _clean_json(raw_text: str) -> str:
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()
    return raw_text


def analyze_paper(paper_text: str) -> dict:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this research paper:\n\n{paper_text}"},
        ],
        temperature=0.3,
        max_tokens=2000,
        response_format={"type": "json_object"},  # Groq supports forced JSON mode
    )
    raw_text = response.choices[0].message.content

    try:
        return json.loads(_clean_json(raw_text))
    except json.JSONDecodeError:
        return {
            "title": None,
            "summary": "Could not parse structured analysis. Raw output below.",
            "key_findings": [],
            "methodology": raw_text,
            "citations_mentioned": [],
            "limitations": [],
        }


def compare_papers(paper_texts: list[str]) -> dict:
    combined = "\n\n---PAPER BREAK---\n\n".join(
        f"PAPER {i+1}:\n{text}" for i, text in enumerate(paper_texts)
    )
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": """You compare multiple research papers. Return STRICT JSON only:
{
  "common_themes": ["..."],
  "key_differences": ["..."],
  "comparison_summary": "2-4 sentences"
}""",
            },
            {"role": "user", "content": combined},
        ],
        temperature=0.3,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )
    raw_text = response.choices[0].message.content
    try:
        return json.loads(_clean_json(raw_text))
    except json.JSONDecodeError:
        return {"common_themes": [], "key_differences": [], "comparison_summary": raw_text}