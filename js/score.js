function saveScoreHistory(score, moves) {
    let history = JSON.parse(localStorage.getItem("scoreHistory")) || [];
    const duration = Math.floor((Date.now() - startTime) / 1000); // saniye cinsinden süre
    const nickname = localStorage.getItem("deckoNickname");
    history.push({
        nickname,
        score,
        moves,
        duration, // yeni eklenen alan
        date: new Date().toLocaleString()
    });
    localStorage.setItem("scoreHistory", JSON.stringify(history));
}

function showScoreHistory() {
    const modal = document.getElementById("scoreHistoryModal");
    const tableDiv = document.getElementById("scoreHistoryTable");
    const history = JSON.parse(localStorage.getItem("scoreHistory")) || [];

    if (history.length === 0) {
        tableDiv.innerHTML = "<p>Henüz skor kaydı yok.</p>";
    } else {
        history.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.duration - b.duration;
        });
        const top10 = history.slice(0, 10);

        let html = `
          <table>
            <tr>
              <th>#</th>
              <th>Nickname</th>
              <th>Skor</th>
              <th>Hamle</th>
              <th>Süre</th>
            </tr>
        `;
        top10.forEach((h, idx) => {
            const minutes = Math.floor(h.duration / 60);
            const seconds = h.duration % 60;
            html += `
              <tr>
                <td>${idx + 1}</td>
                <td>${h.nickname}</td>   <!-- added -->
                <td>${h.score}</td>
                <td>${h.moves}</td>
                <td>${minutes}:${seconds.toString().padStart(2, '0')}</td>
              </tr>
            `;
        });
        html += "</table>";
        tableDiv.innerHTML = html;
    }

    modal.style.display = "flex";
}

function closeScoreHistory() {
    document.getElementById("scoreHistoryModal").style.display = "none";
}

function clearScoreHistory() {
    localStorage.removeItem("scoreHistory");
    showScoreHistory();
}