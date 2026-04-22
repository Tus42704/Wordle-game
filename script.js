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
const customWordInput = document.getElementById("custom-word");
const setWordButton = document.getElementById("set-word");
const shareLinkButton = document.getElementById("share-link");
const shareStatus = document.getElementById("share-status");

const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"]
];

let answer = "";
let guesses = [];
let currentGuess = "";
let gameOver = false;
let letterStates = {};
let confettiTimeoutId = null;
let customAnswer = "";
let loadedFromSharedLink = false;

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function normalizeWord(value) {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, "");
}

function encodeWord(word) {
  return btoa(word).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeWord(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - normalized.length % 4) % 4);

  try {
    return atob(normalized + padding);
  } catch {
    return "";
  }
}

function getWordFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encodedWord = params.get("word");
  if (!encodedWord) {
    return "";
  }

  const decodedWord = normalizeWord(decodeWord(encodedWord));
  return decodedWord.length === WORD_LENGTH ? decodedWord : "";
}

function buildShareUrl(word) {
  const url = new URL(window.location.href);
  url.searchParams.set("word", encodeWord(word));
  return url.toString();
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

      key.addEventListener("click", () => handleInput(keyValue));
      row.appendChild(key);
    });

    keyboard.appendChild(row);
  });
}

function updateBoard() {
  for (let rowIndex = 0; rowIndex < MAX_ATTEMPTS; rowIndex += 1) {
    const guess = guesses[rowIndex] || "";
    const activeWord = rowIndex === guesses.length ? currentGuess : guess;

    for (let colIndex = 0; colIndex < WORD_LENGTH; colIndex += 1) {
      const tile = document.getElementById(`tile-${rowIndex}-${colIndex}`);
      tile.textContent = activeWord[colIndex] || "";
      tile.classList.toggle("filled", Boolean(activeWord[colIndex]));
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

    const existing = letterStates[guess[colIndex]];
    if (!existing || statePriority(state) > statePriority(existing)) {
      letterStates[guess[colIndex]] = state;
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

function setShareStatus(text) {
  shareStatus.textContent = text;
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

function updateShareInput() {
  customWordInput.value = loadedFromSharedLink ? "" : customAnswer;
}

function applyCustomWord(word) {
  customAnswer = word;
  loadedFromSharedLink = false;
  const url = new URL(window.location.href);

  if (word) {
    url.searchParams.set("word", encodeWord(word));
    window.history.replaceState({}, "", url);
    setShareStatus("Custom puzzle loaded. Use Copy Link to share it.");
  } else {
    url.searchParams.delete("word");
    window.history.replaceState({}, "", url);
    setShareStatus("Random puzzle loaded. Leave blank to play a random puzzle.");
  }

  updateShareInput();
  resetGame();
}

async function copyShareLink() {
  const nextWord = normalizeWord(customWordInput.value);
  const wordToShare = nextWord.length === WORD_LENGTH ? nextWord : customAnswer || answer;

  if (!wordToShare || wordToShare.length !== WORD_LENGTH) {
    setShareStatus("Enter a valid 5-letter word first.");
    return;
  }

  const shareUrl = buildShareUrl(wordToShare);

  try {
    await navigator.clipboard.writeText(shareUrl);
    setShareStatus("Share link copied. Send it to your friends.");
  } catch {
    setShareStatus(`Copy failed. Share this URL: ${shareUrl}`);
  }
}

function handleSetWord() {
  const nextWord = normalizeWord(customWordInput.value);

  if (nextWord.length !== WORD_LENGTH) {
    setShareStatus("Custom words must be exactly 5 letters.");
    return;
  }

  applyCustomWord(nextWord);
}

function submitGuess() {
  if (currentGuess.length < WORD_LENGTH) {
    setMessage("Your guess needs 5 letters.");
    return;
  }

  const guess = currentGuess;
  const rowIndex = guesses.length;
  guesses.push(guess);
  currentGuess = "";
  updateBoard();

  const score = scoreGuess(guess);
  applyGuessColors(guess, score, rowIndex);

  if (guess === answer) {
    gameOver = true;
    setMessage(`You got it. The word was ${answer}.`);
    launchConfetti();
    return;
  }

  if (guesses.length === MAX_ATTEMPTS) {
    gameOver = true;
    setMessage(`Out of tries. The word was ${answer}.`);
    return;
  }

  setMessage(`${MAX_ATTEMPTS - guesses.length} tries left.`);
}

function handleInput(input) {
  if (gameOver) {
    return;
  }

  if (input === "ENTER") {
    submitGuess();
    return;
  }

  if (input === "BACK") {
    currentGuess = currentGuess.slice(0, -1);
    updateBoard();
    return;
  }

  if (/^[A-Z]$/.test(input) && currentGuess.length < WORD_LENGTH) {
    currentGuess += input;
    updateBoard();
  }
}

function handlePhysicalKeyboard(event) {
  if (document.activeElement === customWordInput) {
    if (event.key === "Enter") {
      handleSetWord();
    }
    return;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  const key = event.key.toUpperCase();

  if (key === "ENTER") {
    handleInput("ENTER");
    return;
  }

  if (key === "BACKSPACE") {
    handleInput("BACK");
    return;
  }

  if (/^[A-Z]$/.test(key)) {
    handleInput(key);
  }
}

function resetGame() {
  clearConfetti();
  answer = customAnswer || randomWord();
  guesses = [];
  currentGuess = "";
  gameOver = false;
  letterStates = {};
  setMessage("Start with any 5-letter word.");
  createBoard();
  createKeyboard();
  updateBoard();
}

document.addEventListener("keydown", handlePhysicalKeyboard);
newGameButton.addEventListener("click", resetGame);
setWordButton.addEventListener("click", handleSetWord);
shareLinkButton.addEventListener("click", copyShareLink);
customWordInput.addEventListener("input", () => {
  customWordInput.value = normalizeWord(customWordInput.value);
});

customAnswer = getWordFromUrl();
loadedFromSharedLink = Boolean(customAnswer);
updateShareInput();
if (customAnswer) {
  setShareStatus("Shared puzzle loaded. The answer is hidden until the game ends.");
}
resetGame();
