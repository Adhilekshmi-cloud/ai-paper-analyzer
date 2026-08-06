from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pdf_processor import extract_text_from_pdf, chunk_text
from analyzer import analyze_paper, compare_papers

app = FastAPI(title="AI Research Paper Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this if you deploy publicly
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "running"}


@app.post("/analyze")
async def analyze_single_paper(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)

    if not text or len(text) < 100:
        raise HTTPException(status_code=422, detail="Could not extract readable text from PDF.")

    text = chunk_text(text)
    result = analyze_paper(text)
    return JSONResponse(content=result)


@app.post("/compare")
async def compare_multiple_papers(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Upload at least 2 PDFs to compare.")

    texts = []
    for file in files:
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes)
        texts.append(chunk_text(text))

    result = compare_papers(texts)
    return JSONResponse(content=result)