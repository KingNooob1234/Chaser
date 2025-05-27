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

// Power-up block definitions
const blockTypes = [
  { type: "teleport", color: "cyan" },
  { type: "swap", color: "yellow" },
  { type: "stealth", color: "magenta" },
  { type: "shield", color: "lime" }
];

let blocks = [];

function spawnBlock() {
  const block = {
    x: Math.random() * (canvas.width - 40) + 20,
    y: Math.random() * (canvas.height - 40) + 20,
    size: 20,
    ...blockTypes[Math.floor(Math.random() * blockTypes.length)],
    active: true
  };
  blocks.push(block);
}

setInterval(() => {
  if (!gameOver) spawnBlock();
}, 4000); // spawn block every 4 seconds

// Resize canvas if window changes
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Track mouse movement
window.addEventListener("mousemove", (e) => {
  if (!gameOver) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }
});

// Speed up every 3 seconds
let speedInterval = setInterval(() => {
  chaser.speed += chaser.speedIncrement;
}, 3000);

// Increase score every second
let scoreInterval = setInterval(() => {
  if (!gameOver) score += 1;
}, 1000);

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
  switch (block.type) {
    case "teleport":
      mouse.x = Math.random() * canvas.width;
      mouse.y = Math.random() * canvas.height;
      break;
    case "swap":
      const tempX = mouse.x;
      const tempY = mouse.y;
      mouse.x = chaser.x;
      mouse.y = chaser.y;
      chaser.x = tempX;
      chaser.y = tempY;
      break;
    case "stealth":
      cursorVisible = false;
      setTimeout(() => {
        cursorVisible = true;
      }, 3000);
      break;
    case "shield":
      shieldActive = true;
      setTimeout(() => {
        shieldActive = false;
      }, 8000); // shield lasts 8 seconds
      break;
  }
}

function update() {
  if (gameOver) return;

  // Move chaser toward cursor if visible
  if (cursorVisible) {
    chaser.x += (mouse.x - chaser.x) * chaser.speed;
    chaser.y += (mouse.y - chaser.y) * chaser.speed;
  }

  // Check for collision
  if (checkCollision()) {
    if (shieldActive) {
      shieldActive = false; // break shield
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw chaser
  ctx.beginPath();
  ctx.arc(chaser.x, chaser.y, chaser.radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  // Draw blocks and cursor
  drawBlocks();
  drawCursorEffect();

  // Draw score
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 20, 40);

  // Game Over screen
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "32px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
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

gameLoop();
