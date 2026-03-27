let attempts = 15;
let timer = 600;
let currentTeam = "";
let countdown;
let gameActive = true;

// MATRIX BG (2 COLOR PERFECT VERSION)
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}
resizeCanvas();

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$#%&*";
const fontSize = 16;
let columns = Math.floor(canvas.width / fontSize);
let drops = Array(columns).fill(1);

// 🎨 Two hacker colors
const colors = ["#15ff00", "#00ff88"];

function drawMatrix(){
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.font = fontSize + "px monospace";

    for(let i=0;i<drops.length;i++){
        const text = letters[Math.floor(Math.random()*letters.length)];
        const color = colors[Math.floor(Math.random()*colors.length)];
        ctx.fillStyle = color;

        ctx.fillText(text, i*fontSize, drops[i]*fontSize);

        if(drops[i]*fontSize > canvas.height && Math.random() > 0.975){
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 35);

window.addEventListener("resize", ()=>{
    resizeCanvas();
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
});

// Helper function to format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ---------- helper: add message to chat as bubble ----------
function addMessageToChat(sender, text) {
    const chatBox = document.getElementById("chat");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    if (sender === "user") {
        messageDiv.classList.add("message-user");
    } else {
        messageDiv.classList.add("message-ai");
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    messageDiv.innerHTML = `
        <div class="msg-text">${escapeHTML(text)}</div>
    `;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// simple escape to avoid XSS
function escapeHTML(str) {
    return str.replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

/* ----------------------------
   NEW: Screen navigation helpers
-----------------------------*/
function showScreen(screenId){
    const screens = ["welcomeScreen", "loginScreen", "rulesScreen", "gameScreen"];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === screenId) el.classList.remove("hidden");
        else el.classList.add("hidden");
    });
}

// Welcome -> Login
function goToLogin(){
    showScreen("loginScreen");
}

// Rules -> Back to Login
function backToLogin(){
    showScreen("loginScreen");
}

/* ----------------------------
   main: login (NOW goes to Rules)
-----------------------------*/
function login() {
    const teamId = document.getElementById("teamId").value;
    const password = document.getElementById("password").value;

    if (!teamId || !password) {
        alert("Enter Team ID and Password");
        return;
    }

    fetch("/team/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentTeam = data.teamId;
            attempts = data.attempts;

            document.getElementById("displayTeam").innerText = currentTeam;
            document.getElementById("count").innerText = attempts;

            // IMPORTANT: after login go to Rules screen (NOT game yet)
            showScreen("rulesScreen");

            // Reset rules checkbox state
            const agree = document.getElementById("rulesAgree");
            const startBtn = document.getElementById("startGameBtn");
            if (agree) agree.checked = false;
            if (startBtn) startBtn.disabled = true;

            // Timer must start only when the final game starts (so no startTimer() here)
        } else {
            alert("Invalid credentials!");
        }
    })
    .catch(error => {
        alert("Error connecting to server!");
    });
}

/* ----------------------------
   NEW: Start game after Rules
-----------------------------*/
function startGame(){
    // Show game screen
    showScreen("gameScreen");

    // Reset game state for a fresh start
    clearInterval(countdown);
    gameActive = true;

    // Reset timer display (so timeTaken works correctly)
    timer = 600;
    document.getElementById("timer").innerText = timer;

    // Clear previous chat + hide finish button (in case)
    document.getElementById("chat").innerHTML = "";
    document.getElementById("finishBtn").style.display = "none";

    // Add welcome message
    addMessageToChat("ai", "🔓 System online. You have 15 attempts. Break the AI.");

    // NOW start timer (as you asked)
    startTimer();

    // Focus input
    const input = document.getElementById("input");
    if (input) input.focus();
}

function logout() {
    clearInterval(countdown);
    gameActive = false;

    // Go back to Welcome (flow starts from beginning)
    showScreen("welcomeScreen");

    document.getElementById("chat").innerHTML = "";
    document.getElementById("teamId").value = "";
    document.getElementById("password").value = "";
    currentTeam = "";

    timer = 600;
    document.getElementById("timer").innerText = timer;

    // Hide finish button again
    document.getElementById("finishBtn").style.display = "none";

    // Reset rules
    const agree = document.getElementById("rulesAgree");
    const startBtn = document.getElementById("startGameBtn");
    if (agree) agree.checked = false;
    if (startBtn) startBtn.disabled = true;
}

function startTimer() {
    gameActive = true;
    countdown = setInterval(() => {
        if (!gameActive) return;

        timer--;
        document.getElementById("timer").innerText = timer;

        if (timer <= 0) {
            clearInterval(countdown);
            alert("⏳ TIME OVER! Game Over!");
            gameActive = false;
            logout();
        }
    }, 1000);
}

async function sendMessage() {
    if (!gameActive) {
        alert("Game is not active!");
        return;
    }

    if (attempts <= 0) {
        alert("No attempts left!");
        return;
    }

    const input = document.getElementById("input");
    const message = input.value;

    if (!message) return;

    input.disabled = true;
    addMessageToChat("user", message);

    try {
        const timeTaken = 600 - timer;

        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message,
                teamId: currentTeam,
                timeTaken: timeTaken
            })
        });

        const data = await response.json();

        addMessageToChat("ai", data.reply);

        if (data.win) {
            alert(`🔥 SECRET CODE FOUND! YOU WIN!\nAttempts used: ${data.attemptsUsed}\nTime taken: ${formatTime(timeTaken)}`);
            clearInterval(countdown);
            gameActive = false;

            document.getElementById("finishBtn").style.display = "block";
            return;
        }

        attempts--;
        document.getElementById("count").innerText = attempts;

        await fetch("/team/update-attempts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId: currentTeam, attempts })
        });

        input.value = "";

    } catch (error) {
        alert("Error sending message!");
    } finally {
        input.disabled = false;
        input.focus();
    }
}

// Event listeners for Enter key + rules checkbox enable
document.addEventListener("DOMContentLoaded", function() {
    // Initial screen should be Welcome
    showScreen("welcomeScreen");

    const teamIdInput = document.getElementById("teamId");
    const passwordInput = document.getElementById("password");
    const chatInput = document.getElementById("input");

    if (teamIdInput) {
        teamIdInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                login();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                login();
            }
        });
    }

    if (chatInput) {
        chatInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                sendMessage();
            }
        });
    }

    // Rules checkbox -> enable Start Game button
    const rulesAgree = document.getElementById("rulesAgree");
    const startGameBtn = document.getElementById("startGameBtn");
    if (rulesAgree && startGameBtn) {
        rulesAgree.addEventListener("change", function() {
            startGameBtn.disabled = !rulesAgree.checked;
        });
    }

    // Optional: Enter on welcome start
    const welcomeBtn = document.getElementById("welcomeStartBtn");
    if (welcomeBtn) {
        document.addEventListener("keypress", function(e) {
            if (e.key === "Enter" && !document.getElementById("welcomeScreen").classList.contains("hidden")) {
                goToLogin();
            }
        });
    }
});