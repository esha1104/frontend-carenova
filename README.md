# CareNova — Frontend

## 📋 Overview

CareNova is a RAG-based healthcare chatbot that provides preliminary health guidance based on user-reported symptoms. This repository contains the **frontend website** for the CareNova project.

> ⚠️ This is the **frontend only**. You must also run the [CareNova Backend](https://github.com/esha1104/backend-carenova) for the chatbot to work.

---

## 🗂️ File Structure

```
WEBSITE/
├── index.html          # Main landing page
├── login.html          # Firebase magic link login
├── chatbot.html        # Chat interface (opens after login)
├── features.html       # Features page
├── dashboard.html      # Redirects to chatbot.html
├── style.css           # Global styles
├── images/
│   └── logo-new.jpg    # CareNova logo
└── js/
    └── chatbot.js      # Chat logic + backend API calls
```

---

## ⚙️ Prerequisites

Before running the frontend, make sure you have:

- [ ] [VS Code](https://code.visualstudio.com/) installed
- [ ] [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) installed in VS Code
- [ ] The [CareNova Backend](https://github.com/esha1104/backend-carenova) running on `http://127.0.0.1:8000`

---

## 🚀 How to Run

### Step 1 — Clone this repository
```bash
git clone https://github.com/esha1104/frontend-carenova.git
cd frontend-carenova
```

### Step 2 — Make sure the backend is running
Follow the setup instructions in the [Backend README](https://github.com/esha1104/backend-carenova) first.

### Step 3 — Open with Live Server
1. Open the `WEBSITE` folder in VS Code
2. Right-click on `index.html`
3. Click **"Open with Live Server"**
4. The website opens at `http://127.0.0.1:5500/index.html`

---

## 🔐 Login

CareNova uses **Firebase Magic Link** authentication (passwordless login).

### For normal use:
1. Enter your email on the login page
2. Click **"Send Secure Login Link"**
3. Check your email and click the link
4. The chatbot opens in a new window

### For testing/demo (developers only):
1. Open `http://127.0.0.1:5500/login.html?dev=true`
2. Enter any email
3. Click **"Demo Login"**

---

## 💬 How the Chatbot Works

1. User describes symptoms
2. CareNova asks **3 follow-up questions** (AI-generated)
3. User submits answers
4. RAG pipeline analyzes everything
5. Structured health guidance is displayed:
   - Severity level
   - Possible conditions
   - Home care tips
   - When to see a doctor
   - Medical disclaimer

---

## 🔧 Configuration

To change the backend URL (e.g. when using ngrok), update this line in `js/chatbot.js`:

```javascript
const BACKEND_URL = "http://127.0.0.1:8000"; // ← change this
```

---

## 🤝 Related Repositories

- 🔗 **Backend**: [backend-carenova](https://github.com/esha1104/backend-carenova)

---

## ⚕️ Disclaimer

CareNova provides **preliminary guidance only** and is **not a substitute** for professional medical advice. Always consult a qualified healthcare provider for medical decisions.

---

## 👩‍💻 Author

Made with 💙 by **Esha Srivastava**
