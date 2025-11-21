const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI Elements
const scoreElement = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Game State
let gameState = 'START'; // START, PLAYING, GAMEOVER
let frames = 0;
let score = 0;

// Physics Constants
const DESKTOP_PHYSICS = {
    gravity: 0.165,
    jumpStrength: -4.95,
    pipeSpeed: 2.2,
    pipeGap: 180
};

// Mobile: 80% slower means 20% of the speed
const MOBILE_PHYSICS = {
    gravity: 0.165 * 0.2,
    jumpStrength: -4.95 * 0.6, // Jump needs less reduction or it won't clear pipes, tuning to 60%
    pipeSpeed: 2.2 * 0.2,
    pipeGap: 200 // Wider gap for easier mobile play
};

let physics = DESKTOP_PHYSICS;

// Resize Canvas & Update Physics
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Check if mobile (width < 768px)
    if (window.innerWidth < 768) {
        physics = MOBILE_PHYSICS;
    } else {
        physics = DESKTOP_PHYSICS;
    }

    // Update active objects if they exist
    if (bird) {
        bird.gravity = physics.gravity;
        bird.jumpStrength = physics.jumpStrength;
    }
    if (pipes) {
        pipes.dx = physics.pipeSpeed;
        pipes.gap = physics.pipeGap;
    }
}
window.addEventListener('resize', resizeCanvas);

// Bird Object
const bird = {
    x: 50,
    y: 150,
    radius: 15,
    velocity: 0,
    gravity: physics.gravity,
    jumpStrength: physics.jumpStrength,
    color: '#ff7675',

    draw: function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Add a little shine/eye
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        ctx.closePath();
    },

    update: function () {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Floor collision
        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            gameOver();
        }

        // Ceiling collision
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.velocity = 0;
        }
    },

    jump: function () {
        this.velocity = this.jumpStrength;
    },

    reset: function () {
        this.y = canvas.height / 2;
        this.velocity = 0;
        // Ensure physics are up to date on reset
        this.gravity = physics.gravity;
        this.jumpStrength = physics.jumpStrength;
    }
};

// Pipes
const pipes = {
    position: [],
    width: 60,
    gap: physics.pipeGap,
    dx: physics.pipeSpeed,

    draw: function () {
        ctx.fillStyle = '#00b894'; // Aesthetic green/teal

        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.gap;

            // Top Pipe
            ctx.fillRect(p.x, 0, this.width, topY);

            // Bottom Pipe
            ctx.fillRect(p.x, bottomY, this.width, canvas.height - bottomY);

            // Decorative caps
            ctx.fillStyle = '#55efc4';
            ctx.fillRect(p.x - 2, topY - 20, this.width + 4, 20);
            ctx.fillRect(p.x - 2, bottomY, this.width + 4, 20);
            ctx.fillStyle = '#00b894'; // Reset for next pipe body
        }
    },

    update: function () {
        // Add new pipe every 250 frames (adjusted for speed)
        // If speed is slower, we might need to spawn less frequently or distance based
        // Using distance based spawning is better for variable speeds

        if (this.position.length === 0 || canvas.width - this.position[this.position.length - 1].x >= 300) {
            // Random position for gap
            const min = canvas.height * 0.1;
            const max = canvas.height * 0.6;
            const y = Math.floor(Math.random() * (max - min + 1) + min);

            this.position.push({
                x: canvas.width,
                y: y
            });
        }

        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;

            // Collision Detection
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.width) {
                if (bird.y - bird.radius < p.y || bird.y + bird.radius > p.y + this.gap) {
                    gameOver();
                }
            }

            // Score update
            if (p.x + this.width < bird.x - bird.radius && !p.passed) {
                score++;
                scoreElement.innerText = score;
                p.passed = true;
            }

            // Remove off-screen pipes
            if (p.x + this.width <= 0) {
                this.position.shift();
                i--;
            }
        }
    },

    reset: function () {
        this.position = [];
        this.dx = physics.pipeSpeed;
        this.gap = physics.pipeGap;
    }
};

// Background
const background = {
    draw: function () {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(100, 100, 30, 0, Math.PI * 2);
        ctx.arc(140, 100, 40, 0, Math.PI * 2);
        ctx.arc(180, 100, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(canvas.width - 150, 200, 40, 0, Math.PI * 2);
        ctx.arc(canvas.width - 100, 220, 50, 0, Math.PI * 2);
        ctx.arc(canvas.width - 50, 200, 30, 0, Math.PI * 2);
        ctx.fill();
    }
};

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.draw();

    if (gameState === 'PLAYING') {
        pipes.update();
        pipes.draw();
        bird.update();
        bird.draw();
        frames++;
        requestAnimationFrame(loop);
    } else if (gameState === 'START') {
        bird.y = canvas.height / 2 + Math.sin(Date.now() / 500) * 10;
        bird.draw();
        requestAnimationFrame(loop);
    }
}

function startGame() {
    gameState = 'PLAYING';
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    score = 0;
    scoreElement.innerText = score;
    scoreElement.style.display = 'block';
    frames = 0;
    bird.reset();
    pipes.reset();
    loop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    finalScoreElement.innerText = score;
    scoreElement.style.display = 'none';
    gameOverScreen.classList.add('active');
}

function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    if (e.type === 'keydown') e.preventDefault();

    switch (gameState) {
        case 'START':
            startGame();
            bird.jump();
            break;
        case 'PLAYING':
            bird.jump();
            break;
        case 'GAMEOVER':
            break;
    }
}

window.addEventListener('keydown', handleInput);
window.addEventListener('mousedown', handleInput);
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(e);
}, { passive: false });

restartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startGame();
});

// Initial Start
resizeCanvas();
bird.reset();
loop();
