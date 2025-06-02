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

const cursorSpeed = 8; // Pixels per frame

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

// Spawn paintbrush power-up every 30 seconds (lasts 3s)
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
    chaser.speed += chaser.speedIncrement;
  }
}, 3000);

// Increase score every second
let scoreInterval = setInterval(() => {
  if (!gameOver && !beatGame) {
    score++;
  }
}, 1000);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

window.addEventListener("mousemove", (e) => {
  if (!gameOver && !beatGame) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (paintMode && isDrawing) {
      currentPaint.push({ x: e.clientX, y: e.clientY });
    }
  }
});

window.addEventListener("mousedown", () => {
  if (paintMode && !gameOver && !beatGame) {
    isDrawing = true;
    currentPaint = [];
  }
});

window.addEventListener("mouseup", () => {
  if (paintMode && isDrawing && !gameOver && !beatGame) {
    isDrawing = false;
    if (currentPaint.length > 1) {
      paints.push({
        path: currentPaint,
        createdAt: Date.now()
      });
    }
  }
});

function getDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function closestPointOnLine(px, py, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: p1.x + t * dx, y: p1.y + t * dy };
}

function checkCollision() {
  if (!cursorVisible) return false;
  const distance = getDistance(chaser.x, chaser.y, mouse.x, mouse.y);
  return distance < chaser.radius + 5;
}

function checkBlockCollision(block) {
  return getDistance(mouse.x, mouse.y, block.x, block.y) < block.size + 5;
}

function checkPaintCollision() {
  for (const paint of paints) {
    const path = paint.path;
    for (let i = 1; i < path.length; i++) {
      const p1 = path[i - 1];
      const p2 = path[i];
      const closest = closestPointOnLine(chaser.x, chaser.y, p1, p2);
      const dist = getDistance(chaser.x, chaser.y, closest.x, closest.y);
      if (dist < chaser.radius) {
        return true;
      }
    }
  }
  return false;
}

function applyBlockEffect(block) {
  if (beatGame || gameOver) return;

  // If paintMode is active and you get any other powerup, trigger end sequence
  if (paintMode && block.type !== "paint") {
    triggerWinMode();
    return;
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
      paintStartTime = Date.now();
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

  // Expire paintbrush blocks
  blocks.forEach((b) => {
    if (b.type === "paint" && b.expiresAt && Date.now() > b.expiresAt) {
      b.active = false;
    }
  });

  // Remove old paint
  paints = paints.filter(p => Date.now() - p.createdAt < 10000);

  // Move cursor with keyboard
  if (!gameOver && !beatGame) {
    if (keys.up) mouse.y -= cursorSpeed;
    if (keys.down) mouse.y += cursorSpeed;
    if (keys.left) mouse.x -= cursorSpeed;
    if (keys.right) mouse.x += cursorSpeed;

    // Clamp cursor position inside canvas
    mouse.x = Math.max(0, Math.min(canvas.width, mouse.x));
    mouse.y = Math.max(0, Math.min(canvas.height, mouse.y));
  }

  // Move chaser towards cursor if visible
  if (cursorVisible) {
    const dx = mouse.x - chaser.x;
    const dy = mouse.y - chaser.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 1) { // Avoid jitter when extremely close
      const moveX = (dx / distance) * chaser.speed * 60; // 60 is approximate FPS
      const moveY = (dy / distance) * chaser.speed * 60;

      chaser.x += moveX;
      chaser.y += moveY;

      if (checkPaintCollision()) {
        // Bounce back if hitting paint
        chaser.x -= moveX;
        chaser.y -= moveY;
      }
    }

    if (checkPaintCollision()) {
      // Bounce back if hitting paint
      chaser.x -= dx;
      chaser.y -= dy;
    }
  }

  // Check collision with cursor
  if (checkCollision()) {
    if (shieldActive) {
      // Shield breaks: teleport player randomly and remove shield
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

  // Check collisions with power-up blocks
  blocks.forEach(block => {
    if (block.active && checkBlockCollision(block)) {
      block.active = false;
      applyBlockEffect(block);
    }
  });
}

function drawCursorEffect() {
  if (!cursorVisible) return;
  ctx.beginPath();
  ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = shieldActive ? "blue" : "white";
  ctx.fill();
  ctx.closePath();
}

function drawBlocks() {
  blocks.forEach(block => {
    if (block.active) {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size);
    }
  });
}

function drawPaint() {
  paints.forEach(paint => {
    ctx.beginPath();
    const path = paint.path;
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.stroke();
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPaint();
  drawBlocks();

  // Draw chaser (with cracks if cracked/broken)
  ctx.beginPath();
  ctx.arc(chaser.x, chaser.y, chaser.radius, 0, Math.PI * 2);
  if (ballBroken) {
    // Broken ball - draw as shattered (simple)
    ctx.fillStyle = "gray";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 4;
    ctx.moveTo(chaser.x - 10, chaser.y - 10);
    ctx.lineTo(chaser.x + 10, chaser.y + 10);
    ctx.moveTo(chaser.x + 10, chaser.y - 10);
    ctx.lineTo(chaser.x - 10, chaser.y + 10);
    ctx.stroke();
  } else if (ballCracked) {
    ctx.fillStyle = "darkred";
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.moveTo(chaser.x - 5, chaser.y);
    ctx.lineTo(chaser.x + 5, chaser.y);
    ctx.stroke();
  } else {
    ctx.fillStyle = "red";
    ctx.fill();
  }
  ctx.closePath();

  drawCursorEffect();

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 40);

  if (paintMode) {
    ctx.fillStyle = "orange";
    ctx.font = "20px Arial";
    ctx.fillText("PAINT MODE!", 20, 70);
  }

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "32px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
  }

  // Win mode UI
  if (beatGame) {
    fakeCursors.forEach(cursor => {
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = cursor.clicked ? "lime" : "white";
      ctx.fill();
      ctx.closePath();
    });

    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";

    if (!ballCracked && !ballBroken) {
      ctx.fillText("Click 5 times to crack the ball!", canvas.width / 2, 50);
    } else if (ballCracked && !ballBroken) {
      ctx.fillText("Click 5 more times to break it!", canvas.width / 2, 50);
    } else if (ballBroken) {
      ctx.fillText("You broke the ball! You win!", canvas.width / 2, 50);
    }
  }
}

function showRestartButton() {
  const restartBtn = document.getElementById("restartBtn");
  restartBtn.style.display = "block";
  restartBtn.onclick = () => {
    restartGame();
    restartBtn.style.display = "none";
  };
}

function restartGame() {
  score = 0;
  gameOver = false;
  shieldActive = false;
  stealthActive = false;
  cursorVisible = true;
  paintMode = false;
  paints = [];
  blocks = [];
  chaser.x = 100;
  chaser.y = 100;
  chaser.speed = 0.05;
  fakeCursors = [];
  beatGame = false;
  clickCount = 0;
  ballCracked = false;
  ballBroken = false;

  scoreInterval = setInterval(() => {
    if (!gameOver && !beatGame) {
      score++;
    }
  }, 1000);

  speedInterval = setInterval(() => {
    if (!gameOver && !beatGame) {
      chaser.speed += chaser.speedIncrement;
    }
  }, 3000);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
