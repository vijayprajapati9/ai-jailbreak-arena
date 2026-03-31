const canvas  = document.getElementById("matrixCanvas");
const ctx     = canvas.getContext("2d");
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$#%&*";
const fontSize = 16;
const colors   = ["#15ff00", "#00ff88"];
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
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillText(letters[Math.floor(Math.random() * letters.length)], i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    }
}

resizeCanvas();
setInterval(drawMatrix, 60);
window.addEventListener("resize", resizeCanvas);

let lastDataHash = "";

async function loadLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboardBody");
    try {
        const response    = await fetch("/api/leaderboard", { cache: "no-store" });
        const leaderboard = await response.json();

        // Only re-render if data actually changed
        const newHash = JSON.stringify(leaderboard);
        if (newHash === lastDataHash) return;
        lastDataHash = newHash;

        leaderboardBody.innerHTML = "";

        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = '<div class="lb-empty">🏆 No breaches recorded yet. Be the first agent! 🏆</div>';
            updateStats([]);
            updatePodium([]);
        } else {
            updatePodium(leaderboard);
            // Skip top 3 — they are shown on the podium
            const rest = leaderboard.slice(3);
            if (rest.length === 0) {
                leaderboardBody.innerHTML = '<div class="lb-empty" style="color:rgba(0,255,234,0.4);font-size:13px;padding:28px 20px;">▲ TOP 3 AGENTS ON PODIUM ABOVE</div>';
            } else {
                rest.forEach((entry, i) => {
                    const index = i + 3;
                    const row   = document.createElement("div");
                    row.className = "lb-row";

                    const date = new Date(entry.timestamp);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    row.innerHTML = `
                        <div class="lb-col lb-col-rank">#${index + 1}</div>
                        <div class="lb-col lb-col-team">${escapeHTML(entry.teamId)}</div>
                        <div class="lb-col lb-col-attempts">${entry.attemptsUsed} / 15</div>
                        <div class="lb-col lb-col-time">${formatTime(entry.timeTaken)}</div>
                        <div class="lb-col lb-col-date">${formattedDate}</div>
                    `;
                    leaderboardBody.appendChild(row);
                });
            }
            updateStats(leaderboard);
        }
    } catch (error) {
        console.error("Error loading leaderboard:", error);
        leaderboardBody.innerHTML = '<div class="lb-empty">⚠️ Error loading data. Check connection.</div>';
    }
}

function updatePodium(leaderboard) {
    const section = document.getElementById("podiumSection");
    if (!section) return;
    if (leaderboard.length === 0) { section.classList.add("hidden"); return; }
    section.classList.remove("hidden");

    const slots = [
        { teamEl: "podium1Team", metaEl: "podium1Meta" },
        { teamEl: "podium2Team", metaEl: "podium2Meta" },
        { teamEl: "podium3Team", metaEl: "podium3Meta" }
    ];

    slots.forEach((slot, i) => {
        const teamEl = document.getElementById(slot.teamEl);
        const metaEl = document.getElementById(slot.metaEl);
        const entry  = leaderboard[i];
        if (entry) {
            teamEl.textContent = escapeHTML(entry.teamId);
            metaEl.innerHTML  = `${entry.attemptsUsed} uplinks &nbsp;•&nbsp; ${formatTime(entry.timeTaken)}`;
        } else {
            teamEl.textContent = "—";
            metaEl.textContent = "";
            const slotEl = document.getElementById(`podium${i + 1}`);
            if (slotEl) slotEl.style.opacity = "0.3";
        }
    });
}

function updateStats(leaderboard) {
    document.getElementById("totalWinners").innerText = leaderboard.length;
    if (leaderboard.length > 0) {
        const avg = (leaderboard.reduce((sum, e) => sum + e.attemptsUsed, 0) / leaderboard.length).toFixed(1);
        document.getElementById("avgAttempts").innerText = avg;
        document.getElementById("lastWinner").innerText  = leaderboard[0].teamId;
    } else {
        document.getElementById("avgAttempts").innerText = "0";
        document.getElementById("lastWinner").innerText  = "-";
    }
}

function refreshLeaderboard() {
    const btn = document.querySelector('.lb-btn-cyan');
    if (btn) { btn.innerHTML = '⟳ REFRESHING…'; btn.disabled = true; }
    lastDataHash = "";
    loadLeaderboard().finally(() => {
        setTimeout(() => {
            if (btn) { btn.innerHTML = '⟳ REFRESH'; btn.disabled = false; }
        }, 400);
    });
}

function goBack() { window.location.href = '/'; }

function escapeHTML(str) {
    if (!str) return str;
    return str.replace(/[&<>"]/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])
    );
}

function formatTime(seconds) {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Poll every 5 seconds for near real-time updates
setInterval(loadLeaderboard, 3000);

// Refresh immediately when tab is focused
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        lastDataHash = "";
        loadLeaderboard();
    }
});

document.addEventListener("DOMContentLoaded", loadLeaderboard);
