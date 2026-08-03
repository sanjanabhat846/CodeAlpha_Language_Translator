# 🌍 LinguaPulse AI – AI-Powered Language Translator

An AI-powered Language Translator built using **Flask**, **JavaScript**, and **Google Translate (deep-translator)**. It provides fast, accurate translations across 100+ languages with a modern glassmorphism interface and advanced accessibility features.

---

## 📌 Features

- 🌍 Translate text between 100+ languages
- 🤖 Auto Language Detection
- 🔄 Swap Source & Target Languages
- 🎤 Speech-to-Text (Voice Input)
- 🔊 Text-to-Speech
- ⭐ Favorite Language Pairs
- 📜 Translation History (Local Storage)
- 📋 Copy Translation
- ⌨️ Keyboard Shortcut (Ctrl + Enter)
- ⚡ Fast Flask REST API
- 📱 Responsive Modern UI
- ♿ Accessibility Support

---

## 🖼️ Screenshots

### Home Page

![Home](screenshots/home.png)

---

### Translation Example

![Translation](screenshots/translation.png)

---

### Translation History & Favorites

![Features](screenshots/features.png)

---

## 🏗️ Project Structure

```
CodeAlpha_Language_Translator/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── translator.py
│   ├── utils.py
│   ├── requirements.txt
│   └── services/
│       └── translation_service.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── assets/
│   └── sounds/
│
├── screenshots/
├── docs/
├── README.md
├── LICENSE
└── run.py
```

---

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript (ES6)
- Glassmorphism UI

### Backend
- Python
- Flask
- Flask-CORS
- deep-translator

### APIs
- Google Translate (via deep-translator)
- Web Speech API
- SpeechSynthesis API

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/CodeAlpha_Language_Translator.git
```

Move into project

```bash
cd CodeAlpha_Language_Translator
```

Install dependencies

```bash
pip install -r backend/requirements.txt
```

Start Backend

```bash
python -m backend.app
```

Open Frontend

```bash
cd frontend
python -m http.server 5500
```

Visit

```
http://127.0.0.1:5500
```

---

## 📡 API Endpoints

### Home

```
GET /
```

---

### Health

```
GET /health
```

---

### Translate

```
POST /translate
```

Example Request

```json
{
    "text":"Hello",
    "source":"en",
    "target":"fr"
}
```

Example Response

```json
{
    "translated_text":"Bonjour"
}
```

---

### Supported Languages

```
GET /languages
```

---

## 🎯 Future Improvements

- AI-powered context-aware translation
- OCR image translation
- PDF translation
- User authentication
- Translation export
- Cloud deployment

---

## 📹 Demo

A demonstration video is included as part of the CodeAlpha AI Internship submission.

---

## 👩‍💻 Author

**Sanjana Jairam Bhat**

GitHub:
https://github.com/sanjanabhat846

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements

- CodeAlpha AI Internship
- Flask
- Google Translate
- deep-translator
- Web Speech API