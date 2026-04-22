const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const WORDS = [
  "APPLE", "BRAIN", "BRICK", "CHAIR", "CLOUD", "DREAM", "EARTH", "FLAME",
  "FRAME", "FRUIT", "GHOST", "GLASS", "GRAPE", "HOUSE", "JUICE", "LIGHT",
  "MANGO", "MOUSE", "NIGHT", "OCEAN", "PEARL", "PLANT", "PLATE", "QUEST",
  "RADIO", "RIVER", "ROBOT", "SHINE", "SMILE", "SNAKE", "SOLAR", "STONE",
  "STORM", "SUGAR", "SWEET", "TABLE", "TIGER", "TRAIN", "WATER", "WORLD"
];

const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const message = document.getElementById("message");
const newGameButton = document.getElementById("new-game");
const confettiLayer = document.getElementById("confetti-layer");
const guessInput = document.getElementById("guess-input");
const submitGuessButton = document.getElementById("submit-guess");

const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["BACK", "Z", "X", "C", "V", "B", "N", "M", "ENTER"]
];

let answer = "";
let guesses = [];
let guessScores = [];
let gameOver = false;
let confettiTimeoutId = null;
let letterStates = {};

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function createBoard() {
  board.innerHTML = "";

  for (let rowIndex = 0; rowIndex < MAX_ATTEMPTS; rowIndex += 1) {
    const row = document.createElement("div");
    row.className = "row";

    for (let colIndex = 0; colIndex < WORD_LENGTH; colIndex += 1) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${rowIndex}-${colIndex}`;
      row.appendChild(tile);
    }

    board.appendChild(row);
  }
}

function createKeyboard() {
  keyboard.innerHTML = "";

  keyboardRows.forEach((rowLetters) => {
    const row = document.createElement("div");
    row.className = "keyboard-row";

    rowLetters.forEach((keyValue) => {
      const key = document.createElement("button");
      key.type = "button";
      key.className = "key";
      key.dataset.key = keyValue;
      key.textContent = keyValue === "BACK" ? "Back" : keyValue;

      if (keyValue === "ENTER" || keyValue === "BACK") {
        key.classList.add("wide");
      }

      key.addEventListener("click", () => handleKeyboardClick(keyValue));
      row.appendChild(key);
    });

    keyboard.appendChild(row);
  });
}

function updateBoard() {
  for (let rowIndex = 0; rowIndex < MAX_ATTEMPTS; rowIndex += 1) {
    const guess = guesses[rowIndex] || "";
    const score = guessScores[rowIndex] || [];

    for (let colIndex = 0; colIndex < WORD_LENGTH; colIndex += 1) {
      const tile = document.getElementById(`tile-${rowIndex}-${colIndex}`);
      tile.className = "tile";
      tile.textContent = guess[colIndex] || "";
      tile.classList.toggle("filled", Boolean(guess[colIndex]));

      if (score[colIndex]) {
        tile.classList.add(score[colIndex]);
      }
    }
  }
}

function scoreGuess(guess) {
  const result = Array(WORD_LENGTH).fill("absent");
  const remaining = answer.split("");

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = "correct";
      remaining[index] = null;
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === "correct") {
      continue;
    }

    const hitIndex = remaining.indexOf(guess[index]);
    if (hitIndex !== -1) {
      result[index] = "present";
      remaining[hitIndex] = null;
    }
  }

  return result;
}

function applyGuessColors(guess, score, rowIndex) {
  score.forEach((state, colIndex) => {
    const tile = document.getElementById(`tile-${rowIndex}-${colIndex}`);
    tile.classList.add(state);

    const letter = guess[colIndex];
    const existing = letterStates[letter];
    if (!existing || statePriority(state) > statePriority(existing)) {
      letterStates[letter] = state;
    }
  });

  updateKeyboard();
}

function statePriority(state) {
  if (state === "correct") {
    return 3;
  }
  if (state === "present") {
    return 2;
  }
  return 1;
}

function updateKeyboard() {
  document.querySelectorAll(".key").forEach((key) => {
    const value = key.dataset.key;
    if (value.length !== 1) {
      return;
    }

    key.classList.remove("correct", "present", "absent");
    const state = letterStates[value];
    if (state) {
      key.classList.add(state);
    }
  });
}

function setMessage(text) {
  message.textContent = text;
}

function clearConfetti() {
  if (confettiTimeoutId) {
    clearTimeout(confettiTimeoutId);
    confettiTimeoutId = null;
  }

  confettiLayer.innerHTML = "";
}

function launchConfetti() {
  clearConfetti();

  const colors = ["#ff6b6b", "#ffd166", "#06d6a0", "#118ab2", "#8338ec", "#fb8500"];

  for (let index = 0; index < 140; index += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    piece.style.animationDelay = `${Math.random() * 0.45}s`;
    piece.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(piece);
  }

  confettiTimeoutId = setTimeout(clearConfetti, 4200);
}

function handleKeyboardClick(keyValue) {
  if (gameOver) {
    return;
  }

  if (keyValue === "ENTER") {
    submitGuess();
    return;
  }

  if (keyValue === "BACK") {
    guessInput.value = guessInput.value.slice(0, -1);
    guessInput.focus();
    return;
  }

  if (guessInput.value.length < WORD_LENGTH) {
    guessInput.value += keyValue;
    guessInput.focus();
  }
}

function submitGuess() {
  if (gameOver) {
    return;
  }

  const guess = guessInput.value.trim().toUpperCase();

  if (guess.length < WORD_LENGTH) {
    setMessage("Your guess needs 5 letters.");
    return;
  }

  const rowIndex = guesses.length;
  const score = scoreGuess(guess);
  guesses.push(guess);
  guessScores.push(score);
  updateBoard();
  applyGuessColors(guess, score, rowIndex);
  guessInput.value = "";

  if (guess === answer) {
    gameOver = true;
    setMessage(`You got it. The word was ${answer}.`);
    launchConfetti();
    guessInput.disabled = true;
    submitGuessButton.disabled = true;
    return;
  }

  if (guesses.length === MAX_ATTEMPTS) {
    gameOver = true;
    setMessage(`Out of tries. The word was ${answer}.`);
    guessInput.disabled = true;
    submitGuessButton.disabled = true;
    return;
  }

  setMessage(`${MAX_ATTEMPTS - guesses.length} tries left.`);
}

function resetGame() {
  clearConfetti();
  answer = randomWord();
  guesses = [];
  guessScores = [];
  gameOver = false;
  letterStates = {};
  setMessage("Start with any 5-letter word.");
  guessInput.value = "";
  guessInput.disabled = false;
  submitGuessButton.disabled = false;
  createBoard();
  createKeyboard();
  updateBoard();
  updateKeyboard();
  guessInput.focus();
}

guessInput.addEventListener("input", () => {
  guessInput.value = guessInput.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, WORD_LENGTH);
});

guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    submitGuess();
  }
});

submitGuessButton.addEventListener("click", submitGuess);
newGameButton.addEventListener("click", resetGame);

resetGame();
