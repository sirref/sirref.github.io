function OnDocumentKeydown(event) {
    if (event.altKey && event.code == 'KeyL') {
        window.location.href = './leaderboard.html';
    } else if (event.code == 'KeyR') {
        window.location.href = './respawn.html';
    } else if (event.code == "KeyC") {
        window.location.href = './capture.html';
    } else if (event.code == 'KeyT') {
        window.location.href = './test.html';
    } else if (event.code == 'KeyW') {
        window.location.href = './warreport.html';
    } else if (event.code == 'KeyP') {
        window.location.href = './playerreport.html';
    }

}
document.addEventListener('keydown', OnDocumentKeydown);
