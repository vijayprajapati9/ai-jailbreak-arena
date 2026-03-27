# 🔓 AI Jailbreak Arena

An interactive AI hacking simulation game where players attempt to break a highly secured AI system using clever prompts, logic, and creativity.

---

## 🚀 Live Demo

🌐 https://ai-jailbreak-arena.onrender.com

---

## 📦 GitHub Repository

🔗 https://github.com/vijayprajapati9/ai-jailbreak-arena

---

## 🎮 Game Overview

* Players log in using Team ID & Password
* Each team gets limited attempts
* Goal: Extract the hidden secret code from AI
* AI is protected by advanced security logic
* Only smart and strategic prompts can break it

---

## 🧠 Features

* ⚡ Real-time AI responses (Groq API)
* 🔐 Secure AI system with anti-bypass logic
* 👥 Multi-team login system
* ⏳ Timer-based gameplay
* 🎯 Attempt-limited challenge
* 🏆 Leaderboard system (projector-friendly)
* 🛠 Admin panel to create teams
* 🌌 Animated cyberpunk UI

---

## 🛠 Tech Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Node.js
* Express.js

### AI Integration

* Groq API (LLaMA 3.3 70B)

### Data Storage

* JSON file (`data.json`) for teams and leaderboard

### Hosting

* Render (Full-stack deployment)

---

## 📂 Project Structure

```bash id="q5r9kg"
ai-jailbreak-arena/
├── server.js
├── package.json
├── data.json
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── leaderboard.html
│   ├── style.css
│   └── script.js
```

---

## ⚙️ Installation (Local Setup)

### 1. Clone Repository

```bash id="r0z7l1"
git clone https://github.com/vijayprajapati9/ai-jailbreak-arena.git
cd ai-jailbreak-arena
```

---

### 2. Install Dependencies

```bash id="2mbk3f"
npm install
```

---

### 3. Setup Environment Variables

Create a `.env` file:

```env id="rg9pld"
GROQ_API_KEY=your_groq_api_key
```

---

### 4. Run Server

```bash id="bxt9ci"
node server.js
```

---

### 5. Open in Browser

```bash id="y1qz4o"
http://localhost:3000
```

---

## 🔐 Game Rules

* You have limited attempts
* Each prompt is counted
* AI resists basic tricks
* Use logic, creativity, and strategy
* Extract the secret code to win

---

## 🏆 Leaderboard

* Displays top-performing teams
* Based on attempts + time
* Ideal for projector display during events

---

## 🛠 Admin Panel

Access:

```bash id="x7kz2n"
/admin
```

Use it to:

* Create teams
* Manage participants

---

## ⚠️ Important Notes

* Data is stored in a local JSON file (`data.json`)
* On some hosting platforms (like Render free tier), data may reset after server restarts
* It is recommended to keep backups during live events

---

## 🔮 Future Improvements

* 🔄 Real-time leaderboard (WebSockets)
* 🎮 Multiplayer competitive mode
* 🧠 Database integration (MongoDB)
* 🎨 Advanced animations
* 📊 Analytics dashboard

---

## 👨‍💻 Author

**Vijay** 🚀

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

---

## 💡 Inspiration

Inspired by cybersecurity challenges and AI prompt engineering concepts.
