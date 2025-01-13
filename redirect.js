function OnDocumentKeydown(event) {
    if (event.altKey && event.code == 'KeyL') {
        window.location.href = './leaderboard.html';
    } else if (event.code == 'KeyR') {
        window.location.href = './respawn.html';
    } else if (event.altKey && event.code == "KeyC") {
        window.location.href = './capture.html';
    } else if (event.code == 'KeyT') {
        window.location.href = './test.html';
    }

}
document.addEventListener('keydown', OnDocumentKeydown);
