const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

const cursorSpeed = 8;

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === "w") keys.up = true;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = true;
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowUp" || e.key === "w") keys.up = false;
  if (e.key === "ArrowDown" || e.key === "s") keys.down = false;
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

let mouse = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

let chaser = {
  x: 100,
  y: 100,
  radius: 20,
  speed: 0.05,
  speedIncrement: 0.005
};

let score = 0;
let gameOver = false;
let shieldActive = false;
let stealthActive = false;
let cursorVisible = true;
let paintMode = false;
let paints = [];
let isDrawing = false;
let currentPaint = [];
let beatGame = false;
let fakeCursors = [];
let clickCount = 0;
let ballCracked = false;
let ballBroken = false;

const blockTypes = [
  { type: "teleport", color: "cyan" },
  { type: "swap", color: "yellow" },
  { type: "stealth", color: "magenta" },
  { type: "shield", color: "lime" }
];

let blocks = [];

setInterval(() => {
  if (!gameOver && !beatGame) {
    blocks.push({
      x: Math.random() * (canvas.width - 40) + 20,
      y: Math.random() * (canvas.height - 40) + 20,
      size: 24,
      type: "paint",
      color: "orange",
      active: true,
      expiresAt: Date.now() + 3000
    });
  }
}, 30000);

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

let speedInterval = setInterval(() => {
  if (!gameOver && !beatGame) {
    chaser.speed += chaser.speedIncrement;
  }
}, 3000);

let scoreInterval = setInterval(() => {
  if (!gameOver && !beatGame) {
    score++;
  }
}, 1000);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function checkCollision() {
  if (!cursorVisible) return false;
  const distance = getDistance(chaser.x, chaser.y, mouse.x, mouse.y);
  return distance < chaser.radius + 5;
}

function checkBlockCollision(block) {
  return getDistance(mouse.x, mouse.y, block.x, block.y) < block.size + 5;
}

function applyBlockEffect(block) {
  if (beatGame || gameOver) return;

  if (paintMode && block.type !== "paint") {
    triggerWinMode();
  }

  switch (block.type) {
    case "teleport":
      mouse.x = Math.random() * canvas.width;
      mouse.y = Math.random() * canvas.height;
      break;
    case "swap":
      [mouse.x, chaser.x] = [chaser.x, mouse.x];
      [mouse.y, chaser.y] = [chaser.y, mouse.y];
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
      setTimeout(() => {
        paintMode = false;
      }, 5000);
      break;
  }
}

function triggerWinMode() {
  beatGame = true;
  fakeCursors = [];
  clickCount = 0;
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
  fakeCursors.forEach(c => (c.clicked = true));

  if (clickCount === 5) ballCracked = true;
  if (clickCount >= 10) {
    ballBroken = true;
    document.removeEventListener("click", handleWinClick);
  }
}

function update() {
  if (gameOver || beatGame) return;

  // Keyboard movement
  if (keys.up) mouse.y -= cursorSpeed;
  if (keys.down) mouse.y += cursorSpeed;
  if (keys.left) mouse.x -= cursorSpeed;
  if (keys.right) mouse.x += cursorSpeed;

  mouse.x = Math.max(0, Math.min(canvas.width, mouse.x));
  mouse.y = Math.max(0, Math.min(canvas.height, mouse.y));

  // Chaser movement
  const dx = mouse.x - chaser.x;
  const dy = mouse.y - chaser.y;
  const distance = Math.hypot(dx, dy);
  if (distance > 1) {
    const moveX = (dx / distance) * chaser.speed * 60;
    const moveY = (dy / distance) * chaser.speed * 60;
    chaser.x += moveX;
    chaser.y += moveY;
  }

  // Collision with player
  if (checkCollision()) {
    if (shieldActive) {
      shieldActive = false;
      mouse.x = Math.random() * canvas.width;
      mouse.y = Math.random() * canvas.height;
    } else {
      gameOver = true;
      clearInterval(scoreInterval);
      clearInterval(speedInterval);
      showRestartButton();
    }
  }

  blocks.forEach(block => {
    if (block.active && checkBlockCollision(block)) {
      block.active = false;
      applyBlockEffect(block);
    }
  });
}

function drawCursor() {
  if (!cursorVisible) return;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = shieldActive ? "blue" : "white";
  ctx.fill();
}

function drawBlocks() {
  blocks.forEach(block => {
    if (block.active) {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size);
    }
  });
}

function drawChaser() {
  ctx.beginPath();
  ctx.arc(chaser.x, chaser.y, chaser.radius, 0, Math.PI * 2);
  ctx.fillStyle = ballBroken ? "gray" : ballCracked ? "darkred" : "red";
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "32px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
    return;
  }

  drawBlocks();
  drawCursor();
  drawChaser();

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 20, 40);

  if (paintMode) {
    ctx.fillStyle = "orange";
    ctx.font = "20px Arial";
    ctx.fillText("PAINT MODE!", 20, 70);
  }

  if (beatGame) {
    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("You Win! Click to break the ball!", canvas.width / 2, 80);

    fakeCursors.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = c.clicked ? "lightblue" : "white";
      ctx.fill();
    });

    if (ballCracked && !ballBroken) {
      ctx.fillText("The Ball is Cracking!", canvas.width / 2, 130);
    }

    if (ballBroken) {
      ctx.fillText("🎉 YOU WON! 🎉", canvas.width / 2, 180);
    }
  }
}

function showRestartButton() {
  let btn = document.getElementById("restartBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "restartBtn";
    btn.innerText = "Restart";
    btn.style.position = "fixed";
    btn.style.top = "50%";
    btn.style.left = "50%";
    btn.style.transform = "translate(-50%, -50%)";
    btn.style.fontSize = "24px";
    btn.style.padding = "12px 24px";
    btn.style.cursor = "pointer";
    btn.style.zIndex = "1000";
    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      location.reload();
    });
  }
  btn.style.display = "block";
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
