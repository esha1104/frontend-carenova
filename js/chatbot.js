// ============================================================
// chatbot.js — CareNova with Follow-up Questions Flow
// ============================================================

const BACKEND_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", function() {
  const token = localStorage.getItem("carenova_auth_token");
  if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }
  initChat();
});

// ── State ─────────────────────────────────────────────────────
let currentSymptoms = "";
let currentQuestions = [];
let chatPhase = "idle"; // idle | followup | done

// ── Init ──────────────────────────────────────────────────────
function initChat() {
  document.getElementById("sendBtn").addEventListener("click", handleSend);
  document.getElementById("messageInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
  addBotMessage("👋 Hello! I'm CareNova, your AI health assistant. Please describe your symptoms and I'll help you understand what might be going on.");
}

// ── Main handler ──────────────────────────────────────────────
function handleSend() {
  if (chatPhase === "idle") startSymptomFlow();
}

// ── STEP 1: Get follow-up questions ──────────────────────────
async function startSymptomFlow() {
  const input = document.getElementById("messageInput");
  const symptoms = input.value.trim();
  if (!symptoms) return;

  currentSymptoms = symptoms;
  input.value = "";
  setSendBtn(true);

  addUserMessage(symptoms);
  const typingId = showTyping();

  try {
    const response = await fetch(BACKEND_URL + "/api/followup/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: symptoms })
    });

    removeTyping(typingId);

    if (!response.ok) throw new Error("Followup failed");

    const data = await response.json();
    currentQuestions = data.questions || [];

    if (currentQuestions.length === 0) {
      // No questions — go straight to analysis
      await runAnalysis([]);
    } else {
      chatPhase = "followup";
      showFollowupForm(currentQuestions);
    }

  } catch (error) {
    removeTyping(typingId);
    addBotMessage("⚠️ Could not connect to the server. Please make sure the backend is running on port 8000.");
    setSendBtn(false);
    chatPhase = "idle";
    console.error(error);
  }
}

// ── STEP 2: Show follow-up questions form ────────────────────
function showFollowupForm(questions) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "msg bot";
  div.id = "followup-form";

  const qHTML = questions.map((q, i) => `
    <div class="followup-q">
      <strong>${i + 1}. ${esc(q)}</strong>
      <input type="text" id="fq-${i}" placeholder="Your answer…" />
    </div>
  `).join("");

  div.innerHTML = `
    <div class="msg-avatar">🩺</div>
    <div class="followup-card">
      <p class="followup-intro">To better understand your situation, I have a few follow-up questions:</p>
      <div class="followup-questions">${qHTML}</div>
      <button class="followup-submit" onclick="submitFollowup()">Submit Answers ➤</button>
    </div>
  `;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ── STEP 3: Submit answers ────────────────────────────────────
async function submitFollowup() {
  const answers = currentQuestions.map((_, i) => {
    const val = document.getElementById(`fq-${i}`)?.value.trim();
    return val || "(no answer)";
  });

  // Show answers as user message
  const summary = answers.map((a, i) => `Q${i+1}: ${a}`).join(" · ");
  addUserMessage(summary);

  // Remove form
  const form = document.getElementById("followup-form");
  if (form) form.remove();

  chatPhase = "done";
  await runAnalysis(answers);
}

// ── STEP 4: RAG analysis ──────────────────────────────────────
async function runAnalysis(answers) {
  const typingId = showTyping();

  // Combine symptoms + answers into one query
  const fullQuery = answers.length > 0
    ? currentSymptoms + " | " + answers.join(" | ")
    : currentSymptoms;

  try {
    const token = localStorage.getItem("carenova_auth_token");
    const isDemo = token && token.startsWith('demo_token_');
    const headers = { "Content-Type": "application/json" };
    if (!isDemo) { headers["Authorization"] = "Bearer " + token; }

    const response = await fetch(BACKEND_URL + "/api/chat/message", {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ message: fullQuery, conversation_history: [] })
    });

    removeTyping(typingId);

    if (response.status === 401) {
      localStorage.removeItem("carenova_auth_token");
      alert("Session expired. Please login again.");
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();
    showAnalysisCard(data);

  } catch (error) {
    removeTyping(typingId);
    addBotMessage("⚠️ Analysis failed. Please check that the backend server is running.");
    console.error(error);
  } finally {
    // Reset for new conversation
    chatPhase = "idle";
    setSendBtn(false);
    currentSymptoms = "";
    currentQuestions = [];
    addBotMessage("You can describe new symptoms above to start another assessment. 🌱");
  }
}

// ── Render analysis card ──────────────────────────────────────
function showAnalysisCard(data) {
  const severity = guessSeverity(data);
  const badgeClass =
    severity === "Low"      ? "severity-low" :
    severity === "Moderate" ? "severity-moderate" :
    severity === "High"     ? "severity-high" : "severity-default";

  const conditions  = (data.possible_conditions || []).map(c => `<li>${esc(c)}</li>`).join("");
  const explanation = (data.explanation || []).join(" ");
  const tips        = (data.home_care_tips || []).map(t => `<li>${esc(t)}</li>`).join("");
  const doctor      = (data.when_to_see_doctor || []).map(d => `<li>${esc(d)}</li>`).join("");

  const cardHTML = `
    <div class="analysis-card">
      <h4>🔍 Analysis Results</h4>
      <span class="severity-badge ${badgeClass}">${esc(severity)}</span>
      ${explanation ? `<p style="margin:8px 0;color:#444;">${esc(explanation)}</p>` : ""}
      ${conditions  ? `<p class="section-title">Possible Conditions</p><ul>${conditions}</ul>` : ""}
      ${tips        ? `<p class="section-title">Home Care Tips</p><ul>${tips}</ul>` : ""}
      ${doctor      ? `<p class="section-title red">When to See a Doctor</p><ul>${doctor}</ul>` : ""}
      <p class="disclaimer">⚠️ ${esc(data.disclaimer || "This is not a medical diagnosis. Always consult a qualified healthcare provider.")}</p>
    </div>
  `;

  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "msg bot";
  div.innerHTML = `<div class="msg-avatar">🩺</div>${cardHTML}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function guessSeverity(data) {
  const text = JSON.stringify(data).toLowerCase();
  if (text.includes("severe") || text.includes("emergency") || text.includes("immediate")) return "High";
  if (text.includes("moderate") || text.includes("persistent") || text.includes("worsen")) return "Moderate";
  return "Low";
}

// ── UI helpers ────────────────────────────────────────────────
function addBotMessage(text) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "msg bot";
  div.innerHTML = `<div class="msg-avatar">🩺</div><div class="msg-bubble">${esc(text)}</div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addUserMessage(text) {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = "msg user";
  div.innerHTML = `<div class="msg-bubble">${esc(text)}</div><div class="msg-avatar">You</div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  const id = "typing-" + Date.now();
  div.id = id;
  div.className = "msg bot";
  div.innerHTML = `
    <div class="msg-avatar">🩺</div>
    <div class="msg-bubble">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function setSendBtn(disabled) {
  document.getElementById("sendBtn").disabled = disabled;
}

function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}