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

    // fade effect (trail)
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.font = fontSize + "px monospace";

    for(let i=0;i<drops.length;i++){

        const text = letters[Math.floor(Math.random()*letters.length)];

        // pick random color per character
        const color = colors[Math.floor(Math.random()*colors.length)];
        ctx.fillStyle = color;

        ctx.fillText(text, i*fontSize, drops[i]*fontSize);

        // reset drop randomly after reaching bottom
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

// Admin password (you can change this)
const ADMIN_PASSWORD = "GICSA";

function adminLogin() {
    const password = document.getElementById("adminPassword").value;
    
    if (password === ADMIN_PASSWORD) {
        document.getElementById("adminLogin").classList.add("hidden");
        document.getElementById("adminDashboard").classList.remove("hidden");
        loadAdminData();
    } else {
        alert("Invalid admin password!");
    }
}

async function loadAdminData() {
    await loadLeaderboard();
    await loadTeams();
}

async function loadLeaderboard() {
    try {
        const response = await fetch("/admin/leaderboard");
        const leaderboard = await response.json();
        
        const tbody = document.getElementById("leaderboardBody");
        tbody.innerHTML = "";
        
        if (leaderboard.length === 0) {
            const row = tbody.insertRow();
            row.innerHTML = '<td colspan="4" style="text-align: center;">No winners yet!</td>';
        } else {
            leaderboard.forEach((entry, index) => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>#${index + 1}</td>
                    <td>${entry.teamId}</td>
                    <td>${entry.attemptsUsed}</td>
                    <td>${new Date(entry.timestamp).toLocaleString()}</td>
                `;
            });
        }
    } catch (error) {
        console.error("Error loading leaderboard:", error);
    }
}

async function loadTeams() {
    try {
        const response = await fetch("/admin/teams");
        const teams = await response.json();
        
        const teamsGrid = document.getElementById("teamsList");
        document.getElementById("totalTeams").innerText = teams.length;
        
        // Count teams with attempts < 15 (active games)
        const activeGames = teams.filter(t => t.attempts < 15 && t.attempts > 0).length;
        document.getElementById("activeGames").innerText = activeGames;
        
        teamsGrid.innerHTML = "";
        
        teams.forEach(team => {
            const teamCard = document.createElement("div");
            teamCard.className = "team-card";
            
            const attemptsLeft = team.attempts;
            const status = attemptsLeft === 15 ? "🟢 Fresh" : 
                          attemptsLeft === 0 ? "🔴 No attempts" : 
                          "🟡 In Progress";
            
            teamCard.innerHTML = `
                <div class="team-card-header">
                    <span class="team-id">${team.teamId}</span>
                    <div class="team-actions">
                        <button onclick="resetTeam('${team.teamId}')" title="Reset Attempts">🔄</button>
                        <button onclick="deleteTeam('${team.teamId}')" class="danger-btn" title="Delete Team">🗑️</button>
                    </div>
                </div>
                <div class="team-info">
                    <div>Status: ${status}</div>
                    <div>Attempts Left: ${attemptsLeft}/15</div>
                    <div>Created: ${new Date(team.createdAt).toLocaleDateString()}</div>
                </div>
            `;
            
            teamsGrid.appendChild(teamCard);
        });
    } catch (error) {
        console.error("Error loading teams:", error);
    }
}

async function createTeam() {
    const teamId = document.getElementById("newTeamId").value;
    const password = document.getElementById("newPassword").value;
    
    if (!teamId || !password) {
        alert("Please enter both Team ID and Password");
        return;
    }
    
    const response = await fetch("/admin/create-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert("Team created successfully!");
        document.getElementById("newTeamId").value = "";
        document.getElementById("newPassword").value = "";
        loadTeams();
    } else {
        alert("Error: " + data.error);
    }
}

async function deleteTeam(teamId) {
    if (confirm(`Are you sure you want to delete team ${teamId}?`)) {
        const response = await fetch(`/admin/delete-team/${teamId}`, {
            method: "DELETE"
        });
        
        if (response.ok) {
            alert("Team deleted successfully!");
            loadTeams();
            loadLeaderboard();
        }
    }
}

async function resetTeam(teamId) {
    if (confirm(`Reset attempts for team ${teamId}?`)) {
        const response = await fetch(`/admin/reset-team/${teamId}`, {
            method: "POST"
        });
        
        if (response.ok) {
            alert("Team attempts reset to 15!");
            loadTeams();
        }
    }
}

async function resetAllTeams() {
    if (confirm("Are you sure you want to reset ALL teams? This will set all attempts to 15.")) {
        const response = await fetch("/admin/teams");
        const teams = await response.json();
        
        for (const team of teams) {
            await fetch(`/admin/reset-team/${team.teamId}`, {
                method: "POST"
            });
        }
        
        alert("All teams have been reset!");
        loadTeams();
    }
}

function logout() {
    document.getElementById("adminLogin").classList.remove("hidden");
    document.getElementById("adminDashboard").classList.add("hidden");
    document.getElementById("adminPassword").value = "";
}

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (!document.getElementById("adminDashboard").classList.contains("hidden")) {
        loadTeams();
        loadLeaderboard();
    }
}, 30000);
