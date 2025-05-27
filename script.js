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
  speed: 0.05
};

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

function update() {
  // Move chaser toward mouse
  chaser.x += (mouse.x - chaser.x) * chaser.speed;
  chaser.y += (mouse.y - chaser.y) * chaser.speed;
}

function draw() {
  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw chaser
  ctx.beginPath();
  ctx.arc(chaser.x, chaser.y, chaser.radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  // Optionally draw mouse position
  // ctx.beginPath();
  // ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
  // ctx.fillStyle = "white";
  // ctx.fill();
  // ctx.closePath();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
