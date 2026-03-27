// MATRIX BG (same as admin panel)
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

// Leaderboard functions
async function loadLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboardBody");
    
    try {
        // Change this line in loadLeaderboard function:
        const response = await fetch("/api/leaderboard");  // instead of "/admin/leaderboard"
        const leaderboard = await response.json();
        
        leaderboardBody.innerHTML = "";
        
        if (leaderboard.length === 0) {
            leaderboardBody.innerHTML = '<div class="no-winners">🏆 No winners yet! Be the first! 🏆</div>';
            updateStats([]);
        } else {
            leaderboard.forEach((entry, index) => {
                const row = document.createElement("div");
                row.className = "leaderboard-row";
                
                // Add top 3 class
                if (index === 0) row.classList.add("top-1");
                else if (index === 1) row.classList.add("top-2");
                else if (index === 2) row.classList.add("top-3");
                
                // Format date
                const date = new Date(entry.timestamp);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                // Add medal emoji for top 3
                let rankDisplay = `#${index + 1}`;
                if (index === 0) rankDisplay = "🥇 #1";
                else if (index === 1) rankDisplay = "🥈 #2";
                else if (index === 2) rankDisplay = "🥉 #3";
                
                row.innerHTML = `
                    <div class="rank">${rankDisplay}</div>
                    <div class="team">${escapeHTML(entry.teamId)}</div>
                    <div class="attempts">${entry.attemptsUsed}</div>
                    <div class="time">${formatTime(entry.timeTaken)}</div>
                `;
                
                leaderboardBody.appendChild(row);
            });
            
            updateStats(leaderboard);
        }
    } catch (error) {
        console.error("Error loading leaderboard:", error);
        leaderboardBody.innerHTML = '<div class="no-winners">⚠️ Error loading leaderboard. Check connection.</div>';
    }
}

function updateStats(leaderboard) {
    // Total winners
    document.getElementById("totalWinners").innerText = leaderboard.length;
    
    // Average attempts
    if (leaderboard.length > 0) {
        const totalAttempts = leaderboard.reduce((sum, entry) => sum + entry.attemptsUsed, 0);
        const avgAttempts = (totalAttempts / leaderboard.length).toFixed(1);
        document.getElementById("avgAttempts").innerText = avgAttempts;
        
        // Last winner
        const lastWinner = leaderboard[0]; // Assuming most recent first
        document.getElementById("lastWinner").innerText = lastWinner.teamId;
    } else {
        document.getElementById("avgAttempts").innerText = "0";
        document.getElementById("lastWinner").innerText = "-";
    }
}

function refreshLeaderboard() {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.innerHTML = '⟳ REFRESHING...';
    refreshBtn.disabled = true;
    
    loadLeaderboard().finally(() => {
        setTimeout(() => {
            refreshBtn.innerHTML = '⟳ REFRESH';
            refreshBtn.disabled = false;
        }, 500);
    });
}

function goBack() {
    window.location.href = '/';  // Redirect to main game page
}

// Simple escape function
function escapeHTML(str) {
    if (!str) return str;
    return str.replace(/[&<>"]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

// Auto-refresh every 30 seconds
setInterval(() => {
    loadLeaderboard();
}, 30000);

function formatTime(seconds) {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Load leaderboard on page load
document.addEventListener("DOMContentLoaded", loadLeaderboard);