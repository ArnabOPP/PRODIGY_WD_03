// Screens and elements
const startScreen = document.getElementById('start-screen');
const modeScreen = document.getElementById('mode-screen');
const nameScreen = document.getElementById('name-screen');
const difficultyScreen = document.getElementById('difficulty-screen');
const symbolScreen = document.getElementById('symbol-screen');
const gameScreen = document.getElementById('game-screen');
const boardEls = document.querySelectorAll('.cell');
const statusEl = document.getElementById('status');
const playersTitle = document.getElementById('players-title');

// Game state variables
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameActive = false;
let mode = '';
let player1 = '';
let player2 = '';
let playerX = '';
let playerO = '';
let randomChooser = '';
let roundCount = 1;
let scoreP1 = 0;
let scoreP2 = 0;
let difficulty = 'easy';

// Switch screens
function switchScreen(hideEl, showEl) {
  const blur = document.getElementById('blur-overlay');
  const fade = document.getElementById('fade-overlay');

  blur.classList.add('active');
  setTimeout(() => fade.classList.add('active'), 300);
  setTimeout(() => {
    if (hideEl) hideEl.classList.remove('active');
    showEl.classList.add('active');
  }, 700);
  setTimeout(() => fade.classList.remove('active'), 1000);
  setTimeout(() => blur.classList.remove('active'), 1300);
}

// Start Game Click
document.getElementById('btn-start').onclick = () => {
  if (!musicStarted) {
    backgroundMusic.play().then(() => musicStarted = true);
  }
  switchScreen(startScreen, modeScreen);
};

// Choose AI or 2P mode
document.getElementById('btn-ai').onclick = () => {
  mode = 'AI';
  player1 = 'You';
  player2 = 'Computer';
  switchScreen(modeScreen, difficultyScreen);
};

document.querySelectorAll('.btn-difficulty').forEach(btn => {
  btn.onclick = () => {
    difficulty = btn.dataset.level;
    randomChooser = player1;
    document.getElementById('player-symbol-name').textContent = randomChooser;
    switchScreen(difficultyScreen, symbolScreen);
  };
});

document.getElementById('btn-2p').onclick = () => switchScreen(modeScreen, nameScreen);

document.getElementById('btn-name-submit').onclick = () => {
  player1 = document.getElementById('player1-input').value.trim() || 'Player 1';
  player2 = document.getElementById('player2-input').value.trim() || 'Player 2';
  mode = '2P';
  randomChooser = Math.random() < 0.5 ? player1 : player2;
  document.getElementById('player-symbol-name').textContent = randomChooser;
  switchScreen(nameScreen, symbolScreen);
};

document.querySelector('.symbol-options').addEventListener('click', (e) => {
  const box = e.target.closest('.symbol-box');
  if (!box) return;
  const chosen = box.dataset.symbol;
  if (randomChooser === player1) {
    playerX = chosen;
    playerO = chosen === 'X' ? 'O' : 'X';
  } else {
    playerO = chosen;
    playerX = chosen === 'X' ? 'O' : 'X';
  }
  document.getElementById('chooser-name').textContent = randomChooser;
  document.getElementById('other-name').textContent = (randomChooser === player1) ? player2 : player1;
  document.getElementById('chooser-symbol').src = chosen === 'X' ? 'cross.png' : 'circle.png';
  document.getElementById('other-symbol').src = chosen === 'X' ? 'circle.png' : 'cross.png';
  playersTitle.innerHTML = `
    <span class="${playerX === 'X' ? 'player-red' : 'player-blue'}">${player1}</span> vs 
    <span class="${playerO === 'X' ? 'player-red' : 'player-blue'}">${player2}</span>`;
  const scoreNameP1 = document.getElementById('score-name-p1');
  const scoreNameP2 = document.getElementById('score-name-p2');
  if (scoreNameP1 && scoreNameP2) {
    scoreNameP1.textContent = player1;
    scoreNameP2.textContent = player2;
    scoreNameP1.className = playerX === 'X' ? 'player-red' : 'player-blue';
    scoreNameP2.className = playerO === 'X' ? 'player-red' : 'player-blue';
  }
  setTimeout(() => {
    switchScreen(symbolScreen, gameScreen);
    startGame();
  }, 200);
});

function startGame() {
  board.fill('');
  currentPlayer = 'X';
  gameActive = true;

  boardEls.forEach(cell => {
    cell.innerHTML = '';
    cell.classList.remove('win-cell'); // Reset any glowing win cell
  });

  updateTurnStatus();
  startTimer();

  if (mode === 'AI' && currentPlayer !== playerX) {
    setTimeout(() => playMove(bestAIMove()), 400);
  }
}


function updateTurnStatus() {
  const currentPlayerName = currentPlayer === playerX ? player1 : player2;
  const currentPlayerClass = (currentPlayer === playerX && playerX === 'X') || (currentPlayer === playerO && playerO === 'X') ? 'player-red' : 'player-blue';
  statusEl.innerHTML = `<span class="player-name ${currentPlayerClass}">${currentPlayerName}</span>'s Turn`;
}

boardEls.forEach(cell => cell.addEventListener('click', onCellClick));

function onCellClick(e) {
  const idx = +e.target.dataset.index;
  if (!gameActive || board[idx] || (mode === 'AI' && currentPlayer !== playerX)) return;
  playMove(idx);
  if (mode === 'AI' && gameActive && currentPlayer !== playerX) {
    setTimeout(() => playMove(bestAIMove()), 400);
  }
}

function playMove(idx) {
  board[idx] = currentPlayer;
  const img = document.createElement('img');
  img.src = currentPlayer === 'X' ? 'cross.png' : 'circle.png';
  img.alt = currentPlayer;
  img.classList.add('symbol-img');
  boardEls[idx].appendChild(img);
  const winnerName = currentPlayer === playerX ? player1 : player2;
  const winnerClass = currentPlayer === 'X' ? 'player-red' : 'player-blue';
  if (isWin(currentPlayer)) {
    statusEl.innerHTML = `<span class="player-name ${winnerClass}">${winnerName}</span> Wins!`;
    if (winnerName === player1) {
      scoreP1++;
      document.getElementById('score-value-p1').textContent = scoreP1;
    } else {
      scoreP2++;
      document.getElementById('score-value-p2').textContent = scoreP2;
    }
    gameActive = false;
  } else if (!board.includes('')) {
    statusEl.textContent = "It's a Draw!";
    gameActive = false;
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnStatus();
  }
}

function isWin(p) {
  return [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ].some(pattern => pattern.every(i => board[i] === p));
}

function bestAIMove() {
  const empty = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
  if (difficulty === 'easy') return empty[Math.floor(Math.random() * empty.length)];
  if (difficulty === 'normal') return Math.random() < 0.5 ? getBestMove() : empty[Math.floor(Math.random() * empty.length)];
  return getBestMove();
}

function getBestMove() {
  let bestScore = -Infinity, move;
  for (let i = 0; i < 9; i++) {
    if (board[i] === '') {
      board[i] = playerO;
      const score = minimax(board, 0, false);
      board[i] = '';
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function minimax(newBoard, depth, isMaximizing) {
  const scores = { [playerO]: 10, [playerX]: -10, tie: 0 };
  const result = checkWinnerForAI();
  if (result !== null) return scores[result];
  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === '') {
        newBoard[i] = playerO;
        let score = minimax(newBoard, depth + 1, false);
        newBoard[i] = '';
        best = Math.max(score, best);
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (newBoard[i] === '') {
        newBoard[i] = playerX;
        let score = minimax(newBoard, depth + 1, true);
        newBoard[i] = '';
        best = Math.min(score, best);
      }
    }
    return best;
  }
}

function checkWinnerForAI() {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let combo of wins) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (!board.includes('')) return 'tie';
  return null;
}

let timerInterval;
let secondsElapsed = 0;
const timerDisplay = document.getElementById('timer');
function startTimer() {
  secondsElapsed = 0;
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    secondsElapsed++;
    updateTimerDisplay();
  }, 1000);
}
function updateTimerDisplay() {
  const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
  const s = (secondsElapsed % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${m}:${s}`;
}

const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
const audioToggle = document.getElementById('audio-toggle');
const fullscreenToggle = document.getElementById('fullscreen-toggle');
let audioOn = true;
let musicStarted = false;
const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.4;
const clickSound = new Audio('click.wav');
clickSound.volume = 0.6;
function playClick() { if (audioOn) clickSound.play(); }
settingsToggle.onclick = () => settingsMenu.classList.toggle('hidden');
audioToggle.onclick = () => {
  if (!audioOn) {
    backgroundMusic.play().then(() => {
      audioOn = true;
      audioToggle.textContent = "🔊 Audio: On";
    });
  } else {
    backgroundMusic.pause();
    audioOn = false;
    audioToggle.textContent = "🔇 Audio: Off";
  }
  playClick();
};
fullscreenToggle.onclick = () => {
  playClick();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fullscreenToggle.textContent = "🗗 Exit Fullscreen";
  } else {
    document.exitFullscreen();
    fullscreenToggle.textContent = "⛶ Fullscreen";
  }
};
document.addEventListener("click", (e) => {
  if (e.target.tagName === 'BUTTON' || e.target.closest('button')) playClick();
});
/* --- CSS for paper flakes win animation --- */
const paperRainContainer = document.createElement('div');
paperRainContainer.id = 'paper-rain';
document.body.appendChild(paperRainContainer);

const paperStyles = document.createElement('style');
paperStyles.textContent = `
#paper-rain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 999;
  overflow: hidden;
}

.paper-flake {
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  opacity: 0.8;
  border-radius: 3px;
  animation: fall linear forwards;
}

@keyframes fall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}`;
document.head.appendChild(paperStyles);

function triggerPaperRain() {
  for (let i = 0; i < 60; i++) {
    const flake = document.createElement('div');
    flake.className = 'paper-flake';
    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.animationDuration = (2 + Math.random() * 2) + 's';
    flake.style.animationDelay = Math.random() * 0.5 + 's';
    paperRainContainer.appendChild(flake);

    setTimeout(() => paperRainContainer.removeChild(flake), 4000);
  }
}

// Call this when someone wins
function playMove(idx) {
  board[idx] = currentPlayer;
  const img = document.createElement('img');
  img.src = currentPlayer === 'X' ? 'cross.png' : 'circle.png';
  img.alt = currentPlayer;
  img.classList.add('symbol-img');
  boardEls[idx].appendChild(img);

  const winnerName = currentPlayer === playerX ? player1 : player2;
  const winnerClass = currentPlayer === 'X' ? 'player-red' : 'player-blue';

  if (isWin(currentPlayer)) {
    statusEl.innerHTML = `<span class="player-name ${winnerClass}">${winnerName}</span> Wins!`;
    if (winnerName === player1) {
      scoreP1++;
      document.getElementById('score-value-p1').textContent = scoreP1;
    } else {
      scoreP2++;
      document.getElementById('score-value-p2').textContent = scoreP2;
    }
    gameActive = false;
    triggerPaperRain(); // 🎉 Add paper flakes when win detected
  } else if (!board.includes('')) {
    statusEl.textContent = "It's a Draw!";
    gameActive = false;
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnStatus();
  }
}
document.getElementById('btn-restart').onclick = () => {
  roundCount++;
  document.getElementById('round-counter').textContent = roundCount;

  // Clean up win animation
  const existingFlakes = document.querySelectorAll('.paper-flake');
  existingFlakes.forEach(flake => flake.remove());

  startGame();
};
function showWinFlakes() {
  for (let i = 0; i < 50; i++) {
    const flake = document.createElement('div');
    flake.className = 'paper-flake';
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDelay = `${Math.random() * 0.5}s`;
    document.body.appendChild(flake);
  }

  // Remove flakes after 4 seconds
  setTimeout(() => {
    document.querySelectorAll('.paper-flake').forEach(flake => flake.remove());
  }, 4000);
}
