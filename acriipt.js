const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

let chaser = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speed: 0.5,  // Adjust speed as needed
};

let score = 0;
let gameOver = false;

let shieldActive = false;
let stealthActive = false;
let cursorVisible = true;

let paintMode = false;
let paintStartTime = 0;
let paints = [];

let isDrawing = false;
let currentPaint = [];

const blockTypes = [
  { type: "teleport", color: "cyan" },
  { type: "swap", color: "yellow" },
  { type: "stealth", color: "magenta" },
  { type: "shield", color: "lime" }
];

let blocks = [];

// Win mode variables
let beatGame = false;
let fakeCursors = [];
let clickCount = 0;
let ballCracked = false;
let ballBroken = false;

// Movement variables
let moveUp = false;
let moveDown = false;
let moveLeft = false;
let moveRight = false;

// Power-ups and blocks
let invincible = false;

// Listen for keyboard input (WASD, Arrow keys)
window.addEventListener("keydown", (e) => {
  if (!gameOver && !beatGame) {
    switch (e.key) {
      case 'w': case 'ArrowUp':
        moveUp = true;
        break;
      case 's': case 'ArrowDown':
        moveDown = true;
        break;
      case 'a': case 'ArrowLeft':
        moveLeft = true;
        break;
      case 'd': case 'ArrowRight':
        moveRight = true;
        break;
    }
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.key) {
    case 'w': case 'ArrowUp':
      moveUp = false;
      break;
    case 's': case 'ArrowDown':
      moveDown = false;
      break;
    case 'a': case 'ArrowLeft':
      moveLeft = false;
      break;
    case 'd': case 'ArrowRight':
      moveRight = false;
      break;
  }
});

// Spawn regular power-ups every 4 seconds
setInterval(() => {
  if (!gameOver && !beatGame) {
    const block = {
      x: Math.random() * (canvas.width - 40) + 20,
      y: Math.random() * (canvas.height - 40) + 20,
      size: 20,
      ...blockTypes[Math.floor(Math.random() * blockTypes.length)],
      active: true
    };
    blocks.push(block);
  }
}, 4000);

// Speed up chaser every 3 seconds
let speedInterval = setInterval(() => {
  if (!gameOver && !beatGame) {
    chaser.speed += 0.005;  // Increment speed
  }
}, 3000);

// Increase score every second
let scoreInterval = setInterval(() => {
  if (!gameOver && !beatGame) {
    score++;
  }
}, 1000);

// Handle block collision effects (like invincibility)
function applyBlockEffect(block) {
  if (beatGame || gameOver) return;

  switch (block.type) {
    case "teleport":
      mouse.x = Math.random() * canvas.width;
      mouse.y = Math.random() * canvas.height;
      break;
    case "swap":
      [mouse.x, chaser.x] = [chaser.x, mouse.x];
      [mouse.y, chaser.y] = [chaser.y, mouse.y];
      // Grant invincibility for 1 second
      invincible = true;
      setTimeout(() => {
        invincible = false;
      }, 1000);
      break;
    case "stealth":
      cursorVisible = false;
      stealthActive = true;
      setTimeout(() => {
        cursorVisible = true;
        stealthActive = false;
      }, 3000);
      break;
    case "shield":
      shieldActive = true;
      setTimeout(() => (shieldActive = false), 8000);
      break;
    case "paint":
      paintMode = true;
      paintStartTime = Date.now();
      setTimeout(() => {
        paintMode = false;
      }, 5000);
      break;
  }

  // Check for win mode trigger:
  if ((stealthActive || !cursorVisible) && shieldActive && paintMode) {
    if (block.type === "swap" || block.type === "teleport") {
      triggerWinMode();
    }
  }
}

function triggerWinMode() {
  beatGame = true;
  fakeCursors = [];
  clickCount = 0;
  ballCracked = false;
  ballBroken = false;

  for (let i = 0; i < 20; i++) {
    fakeCursors.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      clicked: false
    });
  }

  document.addEventListener("click", handleWinClick);
}

function handleWinClick() {
  if (!beatGame || ballBroken) return;

  clickCount++;

  // All fake cursors "click" with you
  fakeCursors.forEach(c => (c.clicked = true));

  if (clickCount === 5) {
    ballCracked = true;
  }

  if (clickCount >= 10) {
    ballBroken = true;
    document.removeEventListener("click", handleWinClick);
  }
}

function update() {
  if (gameOver || beatGame) return;

  // Move chaser with WASD/Arrow keys
  if (moveUp) chaser.y -= chaser.speed;
  if (moveDown) chaser.y += chaser.speed;
  if (moveLeft) chaser.x -= chaser.speed;
  if (moveRight) chaser.x += chaser.speed;

  // Check for collisions and apply effects
  blocks.forEach(block => {
    if (block.active && checkBlockCollision(block)) {
      block.active = false;
      applyBlockEffect(block);
    }
  });

  // Handle collision with chaser and cursor
  if (checkCollision() && !invincible) {
    if (shieldActive) {
      shieldActive = false;
    } else {
      gameOver = true;
      clearInterval(scoreInterval);
      clearInterval(speedInterval);
      showRestartButton();
    }
  }
}

function checkBlockCollision(block) {
  return getDistance(mouse.x, mouse.y, block.x, block.y) < block.size + 5;
}

function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function checkCollision() {
  const distance = getDistance(chaser.x, chaser.y, mouse.x, mouse.y);
  return distance < chaser.radius + 5;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw power-up blocks
  drawBlocks();

  // Draw chaser
  ctx.beginPath();
  ctx.arc(chaser.x, chaser.y, chaser.radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  // Draw score and game status
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 40);

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "32px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
  }

  if (beatGame) {
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CLICK!", canvas.width / 2, canvas.height / 2);
  }
}

function drawBlocks() {
  blocks.forEach(block => {
    if (block.active) {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size);
    }
  });
}

function showRestartButton() {
  const button = document.createElement("button");
  button.innerText = "Restart";
  button.style.position = "absolute";
  button.style.top = "65%";
  button.style.left = "50%";
  button.style.transform = "translate(-50%, -50%)";
  button.style.padding = "15px 30px";
  button.style.fontSize = "20px";
  button.style.background = "#fff";
  button.style.color = "#111";
  button.style.border = "none";
  button.style.borderRadius = "10px";
  button.style.cursor = "pointer";
  button.onclick = () => location.reload();
  document.body.appendChild(button);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
