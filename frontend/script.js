const API_URL = "http://localhost:8000";

// Mode elements
const singleModeBtn = document.getElementById("singleModeBtn");
const compareModeBtn = document.getElementById("compareModeBtn");
const singleUpload = document.getElementById("singleUpload");
const compareUpload = document.getElementById("compareUpload");
const compareHint = document.getElementById("compareHint");

// Single mode elements
const analyzeBtn = document.getElementById("analyzeBtn");
const pdfInput = document.getElementById("pdfInput");
const results = document.getElementById("results");
const downloadBtn = document.getElementById("downloadBtn");

// Compare mode elements
const compareBtn = document.getElementById("compareBtn");
const pdfInputMulti = document.getElementById("pdfInputMulti");
const compareResults = document.getElementById("compareResults");
const downloadCompareBtn = document.getElementById("downloadCompareBtn");

// Shared elements
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");
const errorBox = document.getElementById("error");

let lastSingleResult = null;
let lastCompareResult = null;

// ---------- Mode switching ----------
singleModeBtn.addEventListener("click", () => switchMode("single"));
compareModeBtn.addEventListener("click", () => switchMode("compare"));

function switchMode(mode) {
  hide(errorBox);
  hide(results);
  hide(compareResults);

  if (mode === "single") {
    singleModeBtn.classList.add("active");
    compareModeBtn.classList.remove("active");
    show(singleUpload);
    hide(compareUpload);
    hide(compareHint);
  } else {
    compareModeBtn.classList.add("active");
    singleModeBtn.classList.remove("active");
    hide(singleUpload);
    show(compareUpload);
    show(compareHint);
  }
}

// ---------- Single paper analysis ----------
analyzeBtn.addEventListener("click", async () => {
  const file = pdfInput.files[0];
  if (!file) {
    showError("Please select a PDF file first.");
    return;
  }

  hide(errorBox);
  hide(results);
  loadingText.textContent = "Analyzing... this may take 15-30s";
  show(loading);
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/analyze`, { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Analysis failed.");
    }
    const data = await res.json();
    lastSingleResult = data;
    renderResults(data);
  } catch (err) {
    showError(err.message);
  } finally {
    hide(loading);
    analyzeBtn.disabled = false;
  }
});

function renderResults(data) {
  document.getElementById("paperTitle").textContent = data.title || "Untitled Paper";
  document.getElementById("summary").textContent = data.summary || "N/A";
  document.getElementById("methodology").textContent = data.methodology || "N/A";
  fillList("findings", data.key_findings);
  fillList("citations", data.citations_mentioned);
  fillList("limitations", data.limitations);
  show(results);
}

downloadBtn.addEventListener("click", () => {
  if (!lastSingleResult) return;
  const d = lastSingleResult;
  const text = `PAPER ANALYSIS
==============

Title: ${d.title || "Untitled Paper"}

SUMMARY
-------
${d.summary || "N/A"}

KEY FINDINGS
------------
${(d.key_findings || []).map((f) => `- ${f}`).join("\n") || "None identified"}

METHODOLOGY
-----------
${d.methodology || "N/A"}

CITATIONS MENTIONED
--------------------
${(d.citations_mentioned || []).map((c) => `- ${c}`).join("\n") || "None identified"}

LIMITATIONS
-----------
${(d.limitations || []).map((l) => `- ${l}`).join("\n") || "None identified"}
`;
  downloadTextFile(text, `${(d.title || "paper-analysis").slice(0, 50)}.txt`);
});

// ---------- Compare papers ----------
compareBtn.addEventListener("click", async () => {
  const files = Array.from(pdfInputMulti.files);
  if (files.length < 2) {
    showError("Please select at least 2 PDF files to compare.");
    return;
  }

  hide(errorBox);
  hide(compareResults);
  loadingText.textContent = `Comparing ${files.length} papers... this may take 20-40s`;
  show(loading);
  compareBtn.disabled = true;

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  try {
    const res = await fetch(`${API_URL}/compare`, { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Comparison failed.");
    }
    const data = await res.json();
    lastCompareResult = data;
    renderCompareResults(data);
  } catch (err) {
    showError(err.message);
  } finally {
    hide(loading);
    compareBtn.disabled = false;
  }
});

function renderCompareResults(data) {
  document.getElementById("comparisonSummary").textContent = data.comparison_summary || "N/A";
  fillList("commonThemes", data.common_themes);
  fillList("keyDifferences", data.key_differences);
  show(compareResults);
}

downloadCompareBtn.addEventListener("click", () => {
  if (!lastCompareResult) return;
  const d = lastCompareResult;
  const text = `PAPER COMPARISON
================

COMPARISON SUMMARY
-------------------
${d.comparison_summary || "N/A"}

COMMON THEMES
-------------
${(d.common_themes || []).map((t) => `- ${t}`).join("\n") || "None identified"}

KEY DIFFERENCES
----------------
${(d.key_differences || []).map((k) => `- ${k}`).join("\n") || "None identified"}
`;
  downloadTextFile(text, "paper-comparison.txt");
});

// ---------- Shared helpers ----------
function fillList(id, items) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";
  if (!items || items.length === 0) {
    ul.innerHTML = "<li>None identified</li>";
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
}

function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function showError(msg) {
  errorBox.textContent = msg;
  show(errorBox);
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }