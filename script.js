const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
let cursorVisible = true;

let paintMode = false;
let paintStartTime = 0;
let paints = []; // stores drawn paint lines

let isDrawing = false;
let currentPaint = [];

// Power-up block definitions
const blockTypes = [
  { type: "teleport", color: "cyan" },
  { type: "swap", color: "yellow" },
  { type: "stealth", color: "magenta" },
  { type: "shield", color: "lime" }
];

let blocks = [];

// Special: paintbrush spawns every 30s and lasts 3s
setInterval(() => {
  if (!gameOver) {
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

// Spawn regular power-ups
setInterval(() => {
  if (!gameOver) {
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

// Resize canvas
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Mouse tracking
window.addEventListener("mousemove", (e) => {
  if (!gameOver) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (paintMode && isDrawing) {
      currentPaint.push({ x: e.clientX, y: e.clientY });
    }
  }
});

window.addEventListener("mousedown", () => {
  if (paintMode) {
    isDrawing = true;
    currentPaint = [];
  }
});

window.addEventListener("mouseup", () => {
  if (paintMode && isDrawing) {
    isDrawing = false;
    if (currentPaint.length > 1) {
      paints.push({
        path: currentPaint,
        createdAt: Date.now()
      });
    }
  }
});

// Speed and score intervals
let speedInterval = setInterval(() => {
  chaser.speed += chaser.speedIncrement;
}, 3000);

let scoreInterval = setInterval(() => {
  if (!gameOver) score += 1;
}, 1000);

// Utility
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

function checkPaintCollision() {
  for (const paint of paints) {
    const path = paint.path;
    for (let i = 1; i < path.length; i++) {
      const p1 = path[i - 1];
      const p2 = path[i];
      // Treat line as circle area (buffered)
      const closest = closestPointOnLine(chaser.x, chaser.y, p1, p2);
      const dist = getDistance(chaser.x, chaser.y, closest.x, closest.y);
      if (dist < chaser.radius) {
        return true;
      }
    }
  }
  return false;
}

function closestPointOnLine(px, py, p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: p1.x + t * dx, y: p1.y + t * dy };
}

function applyBlockEffect(block) {
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
      setTimeout(() => (cursorVisible = true), 3000);
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

function update() {
  if (gameOver) return;

  // Expire blocks
  blocks.forEach((b) => {
    if (b.type === "paint" && b.expiresAt && Date.now() > b.expiresAt) {
      b.active = false;
    }
  });

  // Remove expired paint
  paints = paints.filter((p) => Date.now() - p.createdAt < 10000);

  // Move chaser
  if (cursorVisible) {
    const nextX = chaser.x + (mouse.x - chaser.x) * chaser.speed;
    const nextY = chaser.y + (mouse.y - chaser.y) * chaser.speed;

    const dx = nextX - chaser.x;
    const dy = nextY - chaser.y;

    chaser.x += dx;
    chaser.y += dy;

    if (checkPaintCollision()) {
      chaser.x -= dx; // bounce back
      chaser.y -= dy;
    }
  }

  // Check collision
  if (checkCollision()) {
    if (shieldActive) {
      shieldActive = false;
    } else {
      gameOver = true;
      clearInterval(scoreInterval);
      clearInterval(speedInterval);
      showRestartButton();
    }
  }

  // Check block collisions
  blocks.forEach((block) => {
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
  blocks.forEach((block) => {
    if (block.active) {
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x - block.size / 2, block.y - block.size / 2, block.size, block.size);
    }
  });
}

function drawPaint() {
  paints.forEach((paint) => {
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

  // Draw chaser
  ctx.beginPath();
  ctx.arc(chaser.x, chaser.y, chaser.radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  drawCursorEffect();

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
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
