# InternAI — AI-Powered Internship Platform

A React + Vite application with Google Firebase Authentication, Firestore, Gemini AI Resume Analyzer, and live job search integration.

---

## 🚀 Getting Started (After Cloning)

### 1. Install dependencies

```bash
npm install
```

### 2. Environment Variables (.env)

The `.env` file is already included in the repository with **Firebase Authentication**, **Firestore**, **Adzuna Job Search**, and **RapidAPI** pre-configured. You can run the app immediately out of the box!

> **Note on Gemini AI (Resume Analyzer):**
> Due to GitHub security policies, the Gemini API key is left as a placeholder in `.env`.
> To enable the AI Resume Analyzer, get a free key at [Google AI Studio](https://aistudio.google.com/apikey) and paste it into `.env`:
> ```env
> GEMINI_API_KEY=your_gemini_api_key_here
> VITE_GEMINI_API_KEY=your_gemini_api_key_here
> ```

---

## 🔑 How to Get Each API Key

### Firebase (Authentication + Firestore)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or open an existing one
3. Click ⚙️ **Project Settings** → **Your Apps** → **Web App** (`</>`)
4. Copy the `firebaseConfig` object values into your `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

5. Enable **Authentication** → **Sign-in methods** → Turn on **Google** and **Email/Password**
6. Enable **Firestore Database** → Create database (start in test mode for dev)
7. Go to **Authentication → Settings → Authorized Domains** → Add `localhost`

### Google Gemini AI

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API Key** and paste it into your `.env`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Adzuna Jobs API

1. Register at [Adzuna Developer Portal](https://developer.adzuna.com/)
2. Create an app and copy the **App ID** and **App Key**:

```env
VITE_ADZUNA_APP_ID=your_adzuna_app_id
VITE_ADZUNA_APP_KEY=your_adzuna_app_key
```

### RapidAPI (JSearch / LinkedIn Jobs)

1. Sign up at [RapidAPI](https://rapidapi.com/)
2. Search for **JSearch** and subscribe (free tier available)
3. Copy your API key:

```env
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
```

---

## 🏃 Running the App

### Frontend (Vite dev server)

```bash
npm run dev
```

App runs at: `http://localhost:5173`

### Backend server (for resume parsing)

```bash
npm run server
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8 |
| Auth & DB | Firebase v12 (Google Auth, Email/Password, Firestore) |
| AI | Google Gemini AI |
| Job Search | Adzuna API, RapidAPI (JSearch) |
| Linting | Oxlint |

---

## ❓ Troubleshooting

### Firebase auth not working after clone

> **Cause:** The `.env` file is gitignored and not committed to the repo.  
> **Fix:** Follow the setup steps above to create your own `.env` with real Firebase credentials.

### `auth/unauthorized-domain` error

> **Fix:** Go to Firebase Console → Authentication → Settings → Authorized Domains → Add `localhost`.

### Blank page / app not loading

> **Fix:** Make sure all `VITE_FIREBASE_*` variables in `.env` are filled in and restart the dev server with `npm run dev`.
