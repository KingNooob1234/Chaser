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
  if (!gameOver) {
    score += 1;
  }
}, 1000);

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkCollision() {
  const distance = getDistance(chaser.x, chaser.y, mouse.x, mouse.y);
  return distance < chaser.radius + 5; // 5 = mouse "hitbox" radius
}

function update() {
  if (gameOver) return;

  // Move chaser toward mouse
  chaser.x += (mouse.x - chaser.x) * chaser.speed;
  chaser.y += (mouse.y - chaser.y) * chaser.speed;

  // Check for collision
  if (checkCollision()) {
    gameOver = true;
    clearInterval(scoreInterval);
    clearInterval(speedInterval);
    showRestartButton();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw chaser
  ctx.beginPath();
  ctx.arc(chaser.x, chaser.y, chaser.radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

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
  button.style.top = "50%";
  button.style.left = "50%";
  button.style.transform = "translate(-50%, -50%)";
  button.style.padding = "15px 30px";
  button.style.fontSize = "20px";
  button.style.background = "#fff";
  button.style.color = "#111";
  button.style.border = "none";
  button.style.borderRadius = "10px";
  button.style.cursor = "pointer";
  button.onclick = () => {
    location.reload(); // Restart the game
  };
  document.body.appendChild(button);
}

gameLoop();
