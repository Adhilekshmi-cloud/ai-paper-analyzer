const API_URL = "http://localhost:8000";

const analyzeBtn = document.getElementById("analyzeBtn");
const pdfInput = document.getElementById("pdfInput");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const results = document.getElementById("results");

analyzeBtn.addEventListener("click", async () => {
  const file = pdfInput.files[0];
  if (!file) {
    showError("Please select a PDF file first.");
    return;
  }

  hide(errorBox);
  hide(results);
  show(loading);
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Analysis failed.");
    }

    const data = await res.json();
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

function showError(msg) {
  errorBox.textContent = msg;
  show(errorBox);
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }