function checkNickname() {
    const nickname = localStorage.getItem('deckoNickname');
    if (!nickname) {
        document.getElementById('nicknameModal').style.display = 'block';
    } else {
        createDeck();
    }
}

function submitNickname() {
    const input = document.getElementById('nicknameInput').value.trim();
    if (input.length > 0) {
        localStorage.setItem('deckoNickname', input);
        document.getElementById('nicknameModal').style.display = 'none';
        createDeck();
    } else {
        alert('❗Please enter a valid nickname.');
    }
}

window.addEventListener("DOMContentLoaded", checkNickname);