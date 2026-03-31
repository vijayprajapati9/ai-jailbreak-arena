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

let ADMIN_PASSWORD = "";

async function adminLogin() {
    ADMIN_PASSWORD = document.getElementById("adminPassword").value;
    try {
        const res = await fetch("/admin/teams", {
            headers: { "Authorization": `Bearer ${ADMIN_PASSWORD}` }
        });
        if (res.ok) {
            document.getElementById("adminLogin").classList.add("hidden");
            document.getElementById("adminDashboard").classList.remove("hidden");
            loadTeams();
        } else {
            alert("Invalid admin password!");
        }
    } catch (e) {
        alert("Server connection error!");
    }
}

function logout() {
    document.getElementById("adminLogin").classList.remove("hidden");
    document.getElementById("adminDashboard").classList.add("hidden");
    document.getElementById("adminPassword").value = "";
    ADMIN_PASSWORD = "";
}

async function loadTeams() {
    try {
        const res   = await fetch("/admin/teams", { headers: { "Authorization": `Bearer ${ADMIN_PASSWORD}` } });
        const teams = await res.json();
        const grid  = document.getElementById("teamsList");
        document.getElementById("totalTeams").innerText  = teams.length;
        document.getElementById("activeGames").innerText = teams.filter(t => t.attempts < 15 && t.attempts > 0).length;
        grid.innerHTML = "";
        teams.forEach(team => {
            const card = document.createElement("div");
            card.className = "team-card";
            const status = team.attempts === 15 ? "🟢 Fresh"
                         : team.attempts === 0  ? "🔴 No Attempts"
                         : "🟡 In Progress";
            card.innerHTML = `
                <div class="team-card-header">
                    <span class="team-id">${team.teamId}</span>
                    <div class="team-actions">
                        <button onclick="resetTeam('${team.teamId}')" title="Reset Attempts">🔄</button>
                        <button onclick="deleteTeam('${team.teamId}')" class="danger-btn" title="Delete Team">🗑️</button>
                    </div>
                </div>
                <div class="team-info">
                    <div>Status: ${status}</div>
                    <div>Attempts Left: ${team.attempts}/15</div>
                    <div>Created: ${new Date(team.createdAt).toLocaleDateString()}</div>
                </div>`;
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading teams:", err);
    }
}

async function createTeam() {
    const teamId   = document.getElementById("newTeamId").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    if (!teamId || !password) { alert("Please enter both Team ID and Password"); return; }
    const res  = await fetch("/admin/create-team", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ADMIN_PASSWORD}` },
        body:    JSON.stringify({ teamId, password })
    });
    const data = await res.json();
    if (data.success) {
        document.getElementById("newTeamId").value  = "";
        document.getElementById("newPassword").value = "";
        loadTeams();
    } else {
        alert("Error: " + data.error);
    }
}

async function deleteTeam(teamId) {
    if (!confirm(`Delete team ${teamId}?`)) return;
    const res = await fetch(`/admin/delete-team/${teamId}`, {
        method:  "DELETE",
        headers: { "Authorization": `Bearer ${ADMIN_PASSWORD}` }
    });
    if (res.ok) loadTeams();
}

async function resetTeam(teamId) {
    if (!confirm(`Reset attempts for ${teamId}?`)) return;
    const res = await fetch(`/admin/reset-team/${teamId}`, {
        method:  "POST",
        headers: { "Authorization": `Bearer ${ADMIN_PASSWORD}` }
    });
    if (res.ok) loadTeams();
}

async function resetAllTeams() {
    if (!confirm("Reset ALL teams to 15 attempts?")) return;
    const res   = await fetch("/admin/teams", { headers: { "Authorization": `Bearer ${ADMIN_PASSWORD}` } });
    const teams = await res.json();
    for (const team of teams) {
        await fetch(`/admin/reset-team/${team.teamId}`, {
            method:  "POST",
            headers: { "Authorization": `Bearer ${ADMIN_PASSWORD}` }
        });
    }
    alert("All teams reset!");
    loadTeams();
}

setInterval(() => {
    if (!document.getElementById("adminDashboard").classList.contains("hidden")) loadTeams();
}, 30000);