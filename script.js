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
  maxSpeed: 0.5,
  speedIncrement: 0.005
};

let score = 0;

// Resize canvas if window changes
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Track mouse movement
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Increase chaser speed every 3 seconds
setInterval(() => {
  if (chaser.speed < chaser.maxSpeed) {
    chaser.speed += chaser.speedIncrement;
  }
}, 3000);

// Increase score every second
setInterval(() => {
  score += 1;
}, 1000);

function update() {
  // Move chaser toward mouse
  chaser.x += (mouse.x - chaser.x) * chaser.speed;
  chaser.y += (mouse.y - chaser.y) * chaser.speed;
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
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
