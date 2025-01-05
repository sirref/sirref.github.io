function OnDocumentKeydown(event) {
    if (event.code == 'F8') {
        window.location.href = './leaderboard.html';
    }
}
document.addEventListener('keydown', OnDocumentKeydown);
