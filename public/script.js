let attempts = 15;
let timer = 600;
let currentTeam = "";
let countdown;
let gameActive = false;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, type, duration, vol = 0.1) {
    if (!audioCtx) return;
    try {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playTypingSound() { playTone(Math.random() * 200 + 600, 'square', 0.05, 0.05); }
function playTypeBeep()    { playTone(800, 'sine', 0.1, 0.05); }

function playErrorSound() {
    playTone(150, 'sawtooth', 0.5, 0.2);
    setTimeout(() => playTone(120, 'sawtooth', 0.5, 0.2), 150);
}

function playWinSound() {
    playTone(220, 'sine', 0.2, 0.15);
    setTimeout(() => playTone(330, 'sine', 0.2, 0.15), 120);
    setTimeout(() => playTone(440, 'square', 0.3, 0.2), 260);
    setTimeout(() => playTone(550, 'sine', 0.4, 0.25), 420);
    setTimeout(() => playTone(660, 'sine', 0.5, 0.3), 620);
    setTimeout(() => { playTone(880, 'sine', 0.8, 0.3); playTone(660, 'square', 0.4, 0.2); }, 900);
    setTimeout(() => playTone(1100, 'sine', 1.2, 0.35), 1300);
}

const canvas  = document.getElementById("matrixCanvas");
const ctx     = canvas.getContext("2d");
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$#%&*";
const fontSize = 16;
const matrixColors = ["#15ff00", "#00ff88"];
let columns = 0;
let drops   = [];

function resizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width  = window.innerWidth;
    columns = Math.floor(canvas.width / fontSize);
    drops   = Array(columns).fill(1);
}

function drawMatrix() {
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < drops.length; i++) {
        ctx.fillStyle = matrixColors[Math.floor(Math.random() * matrixColors.length)];
        ctx.fillText(letters[Math.floor(Math.random() * letters.length)], i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    }
}

resizeCanvas();
setInterval(drawMatrix, 35);
window.addEventListener("resize", resizeCanvas);

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function escapeHTML(str) {
    return str.replace(/[&<>"]/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])
    );
}

const SCREENS = ["welcomeScreen", "loginScreen", "rulesScreen", "gameScreen"];

function showScreen(screenId) {
    SCREENS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.toggle("hidden", id !== screenId);
    });
}

function goToLogin()   { showScreen("loginScreen"); }
function backToLogin() { showScreen("loginScreen"); }

function login() {
    const teamId   = document.getElementById("teamId").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!teamId || !password) { alert("Enter Team ID and Password"); return; }

    fetch("/team/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ teamId, password })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            currentTeam = data.teamId;
            attempts    = data.attempts;
            document.getElementById("displayTeam").innerText = currentTeam;
            document.getElementById("count").innerText       = attempts;
            showScreen("rulesScreen");
            const agree    = document.getElementById("rulesAgree");
            const startBtn = document.getElementById("startGameBtn");
            if (agree)    agree.checked    = false;
            if (startBtn) startBtn.disabled = true;
        } else {
            alert("Invalid credentials!");
        }
    })
    .catch(() => alert("Error connecting to server!"));
}

function startGame() {
    initAudio();
    showScreen("gameScreen");
    clearInterval(countdown);
    gameActive = true;
    timer = 600;
    document.getElementById("timer").innerText              = formatTime(timer);
    document.getElementById("chat").innerHTML               = "";
    document.getElementById("finishBtn").style.display      = "none";
    addMessageToChat("ai", "🔓 System online. You have 15 attempts. Break the AI.");
    startTimer();
    fetch("/team/start", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ teamId: currentTeam })
    });
    renderAttempts(attempts);
    updateStability(attempts);
    const input = document.getElementById("input");
    if (input) input.focus();
}

function logout() {
    clearInterval(countdown);
    gameActive = false;
    showScreen("welcomeScreen");
    document.getElementById("chat").innerHTML          = "";
    document.getElementById("teamId").value           = "";
    document.getElementById("password").value         = "";
    document.getElementById("finishBtn").style.display = "none";
    document.getElementById("timer").innerText        = formatTime(600);
    currentTeam = "";
    timer = 600;
    stopWinMatrix();
    const winPopup = document.getElementById("winPopup");
    if (winPopup) winPopup.classList.add("hidden");
    const scrambleEl = document.getElementById("winKeyScramble");
    const valueEl    = document.getElementById("winKeyValue");
    if (scrambleEl) { scrambleEl.textContent = "DECRYPTING..."; scrambleEl.classList.remove("hidden"); }
    if (valueEl)    { valueEl.textContent = ""; valueEl.classList.add("hidden"); }
    const agree    = document.getElementById("rulesAgree");
    const startBtn = document.getElementById("startGameBtn");
    if (agree)    agree.checked    = false;
    if (startBtn) startBtn.disabled = true;
}

function showSystemLockout(reason) {
    playErrorSound();
    const overlay = document.createElement("div");
    overlay.className = "system-lockout";
    overlay.innerHTML = `<div class="system-lockout-alert">SYSTEM LOCKOUT</div><div style="font-size:30px;margin-top:20px;">${reason}</div>`;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.remove(); logout(); }, 4000);
}

function startTimer() {
    gameActive = true;
    countdown = setInterval(() => {
        if (!gameActive) return;
        timer--;
        document.getElementById("timer").innerText = formatTime(timer);
        if (timer <= 0) {
            clearInterval(countdown);
            gameActive = false;
            showSystemLockout("TIME EXPIRED");
        }
    }, 1000);
}

function renderAttempts(current) {
    const container = document.getElementById("attemptsVisual");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 15; i++) {
        const box = document.createElement("div");
        box.className = "attempt-box";
        if (i >= current) box.classList.add("used");
        container.appendChild(box);
    }
}

function updateStability(current) {
    const base = 100 - ((15 - current) * 6);
    const jitter = current === 15 ? 0 : (Math.random() * 10) - 5;
    const pct  = Math.max(0, Math.min(100, Math.floor(base + jitter)));
    const txt  = document.getElementById("stabilityText");
    const bar  = document.getElementById("stabilityBar");
    if (txt) txt.innerText = pct + "%";
    if (bar) {
        bar.style.width = pct + "%";
        bar.className   = pct <= 30 ? "meter-fill critical-stability" : "meter-fill";
    }
}

function addMessageToChat(sender, text) {
    const chatBox    = document.getElementById("chat");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender === "user" ? "message-user" : "message-ai");
    const timeStr    = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatarIcon = sender === "user" ? "👤" : "🤖";
    const senderName = sender === "user" ? currentTeam : "SYS_ADMIN";
    messageDiv.innerHTML = `
        <div class="chat-card">
            <div class="chat-header">
                <div class="avatar">${avatarIcon}</div>
                <div class="sender-name">${senderName}</div>
                <div class="timestamp">${timeStr}</div>
            </div>
            <div class="msg-text">${escapeHTML(text)}</div>
        </div>`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function typeWriterResponse(text) {
    const chatBox    = document.getElementById("chat");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "message-ai");
    chatBox.appendChild(messageDiv);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        <div class="chat-card">
            <div class="chat-header">
                <div class="avatar">🤖</div>
                <div class="sender-name">SYS_ADMIN</div>
                <div class="timestamp">${timeStr}</div>
            </div>
            <div class="msg-text"></div>
        </div>`;
    const textContainer = messageDiv.querySelector('.msg-text');
    let currentHtml = "";
    for (let i = 0; i < text.length; i++) {
        currentHtml += escapeHTML(text[i]);
        textContainer.innerHTML = `${currentHtml}█`;
        chatBox.scrollTop = chatBox.scrollHeight;
        if (text[i] !== ' ') playTypingSound();
        await new Promise(r => setTimeout(r, 10));
    }
    textContainer.innerHTML = currentHtml;
}

async function sendMessage() {
    if (!gameActive) { alert("Game is not active!"); return; }
    if (attempts <= 0) { showSystemLockout("NO ATTEMPTS LEFT"); return; }
    const input   = document.getElementById("input");
    const message = input.value.trim();
    if (!message) return;
    input.disabled = true;
    addMessageToChat("user", message);
    input.value = "";
    try {
        const response = await fetch("/chat", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ message, teamId: currentTeam })
        });
        const data = await response.json();
        await typeWriterResponse(data.reply);
        if (data.win) {
            playWinSound();
            triggerWinOverlay(data);
            clearInterval(countdown);
            gameActive = false;
            document.getElementById("finishBtn").style.display = "block";
            return;
        }
        attempts = data.attemptsLeft;
        document.getElementById("count").innerText = attempts;
        renderAttempts(attempts);
        updateStability(attempts);
        if (attempts <= 0) {
            showSystemLockout("NO ATTEMPTS LEFT");
            gameActive = false;
            clearInterval(countdown);
        }
    } catch (error) {
        alert("Error sending message! Backend unavailable.");
    } finally {
        if (gameActive) { input.disabled = false; input.focus(); }
    }
}

let winMatrixInterval = null;

function startWinMatrix() {
    const canvas = document.getElementById("winMatrix");
    if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const chars  = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*!<>[]{}|/\\~`ΩΨΦΔΣΠΛ";
    const colors = ["#15ff00", "#00ff41", "#00ffea", "#00cc33", "#00dd88"];
    const fSize  = 14;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cols  = Math.floor(canvas.width / fSize);
    const drops = Array(cols).fill(1);
    winMatrixInterval = setInterval(() => {
        ctx.fillStyle = "rgba(0,10,3,0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = fSize + "px monospace";
        for (let i = 0; i < drops.length; i++) {
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * fSize, drops[i] * fSize);
            if (drops[i] * fSize > canvas.height && Math.random() > 0.97) drops[i] = 0;
            drops[i]++;
        }
    }, 60);
}

function stopWinMatrix() {
    if (winMatrixInterval) { clearInterval(winMatrixInterval); winMatrixInterval = null; }
}

function scrambleRevealKey(secretKey) {
    const scrambleEl = document.getElementById("winKeyScramble");
    const valueEl    = document.getElementById("winKeyValue");
    if (!scrambleEl || !valueEl) return;
    const chars         = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%!";
    const totalDuration = 2200;
    const frameInterval = 60;
    let elapsed = 0;
    const interval = setInterval(() => {
        elapsed += frameInterval;
        let scrambled = "";
        for (let i = 0; i < Math.max(secretKey.length, 8); i++) {
            scrambled += chars[Math.floor(Math.random() * chars.length)];
        }
        scrambleEl.textContent = scrambled;
        if (elapsed >= totalDuration) {
            clearInterval(interval);
            scrambleEl.classList.add("hidden");
            valueEl.classList.remove("hidden");
            valueEl.textContent = "";
            let charIdx = 0;
            const lockIn = setInterval(() => {
                valueEl.textContent = secretKey.slice(0, charIdx + 1) +
                    (charIdx < secretKey.length - 1
                        ? chars[Math.floor(Math.random() * chars.length)].repeat(secretKey.length - charIdx - 1)
                        : "");
                charIdx++;
                if (charIdx >= secretKey.length) {
                    clearInterval(lockIn);
                    valueEl.textContent = secretKey;
                    playTone(1200, 'sine', 0.3, 0.08);
                }
            }, 80);
        }
    }, frameInterval);
}

function triggerWinOverlay(data) {
    document.getElementById("winTeamName").innerText     = currentTeam;
    document.getElementById("winAttemptsUsed").innerText = data.attemptsUsed;
    document.getElementById("winTimeTaken").innerText    = formatTime(data.timeTaken);
    const scrambleEl = document.getElementById("winKeyScramble");
    const valueEl    = document.getElementById("winKeyValue");
    if (scrambleEl) { scrambleEl.textContent = "DECRYPTING..."; scrambleEl.classList.remove("hidden"); }
    if (valueEl)    { valueEl.textContent = ""; valueEl.classList.add("hidden"); }
    const popup = document.getElementById("winPopup");
    popup.classList.remove("hidden");
    stopWinMatrix();
    startWinMatrix();
    const secret = data.secretKey || "REDACTED";
    setTimeout(() => scrambleRevealKey(secret), 700);
}

document.addEventListener("DOMContentLoaded", () => {
    showScreen("welcomeScreen");
    const teamIdInput   = document.getElementById("teamId");
    const passwordInput = document.getElementById("password");
    const chatInput     = document.getElementById("input");
    const rulesAgree    = document.getElementById("rulesAgree");
    const startGameBtn  = document.getElementById("startGameBtn");
    if (teamIdInput)   teamIdInput.addEventListener("keypress",  e => { if (e.key === "Enter") login(); });
    if (passwordInput) passwordInput.addEventListener("keypress", e => { if (e.key === "Enter") login(); });
    if (chatInput) {
        chatInput.addEventListener("keydown",  e => { initAudio(); if (e.key !== "Enter") playTypeBeep(); });
        chatInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });
    }
    if (rulesAgree && startGameBtn) {
        rulesAgree.addEventListener("change", () => {
            startGameBtn.disabled = !rulesAgree.checked;
        });
    }
    document.addEventListener("keypress", e => {
        if (e.key === "Enter" && !document.getElementById("welcomeScreen").classList.contains("hidden")) {
            goToLogin();
        }
    });
});