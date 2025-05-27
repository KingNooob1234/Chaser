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
  maxSpeed: 0.5,     // maximum speed limit
  speedIncrement: 0.005  // how much speed increases each interval
};

// Resize canvas on window size change
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Track mouse movement
window.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Speed up every 3 seconds
setInterval(() => {
  if (chaser.speed < chaser.maxSpeed) {
    chaser.speed += chaser.speedIncrement;
    console.log("Speed increased to:", chaser.speed.toFixed(3));
  }
}, 3000); // increase speed every 3 seconds

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
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
