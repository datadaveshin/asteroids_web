class Ship {
    constructor(game, x, y) {
        this.game = game;  // Store reference to game instance
        this.x = x;
        this.y = y;
        this.rotation = 0; // radians
        this.velocity = { x: 0, y: 0 };
        this.thrust = 0.5;
        this.rotationSpeed = 0.1;
        this.friction = 0.99;
        this.size = 20;
    }

    update(deltaTime) {
        // Rotation
        if (this.game.keys['ArrowLeft']) this.rotation -= this.rotationSpeed;
        if (this.game.keys['ArrowRight']) this.rotation += this.rotationSpeed;

        // Thrust
        if (this.game.keys['ArrowUp']) {
            this.velocity.x += Math.cos(this.rotation) * this.thrust;
            this.velocity.y += Math.sin(this.rotation) * this.thrust;
        }

        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Wrap around screen
        if (this.x < 0) this.x = this.game.canvas.width;
        if (this.x > this.game.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.game.canvas.height;
        if (this.y > this.game.canvas.height) this.y = 0;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw ship
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size/2, -this.size/2);
        ctx.lineTo(-this.size/2, this.size/2);
        ctx.lineTo(this.size, 0);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;

        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Game state
        this.entities = [];
        this.keys = {};

        // Create ship
        this.ship = new Ship(this, this.canvas.width / 2, this.canvas.height / 2);
        this.entities.push(this.ship);

        // Bind event listeners
        this.bindEvents();

        // Start game loop
        this.lastTime = 0;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
    }

    update(deltaTime) {
        // Update game state
        this.entities.forEach(entity => entity.update(deltaTime));
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Debug info
        console.log('Rendering entities:', this.entities.length);
        console.log('Ship position:', this.ship.x, this.ship.y);

        // Render all entities
        this.entities.forEach(entity => entity.render(this.ctx));
        
        // Update score and lives display
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
    }

    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Start the game when the page loads
let game;
window.onload = () => {
    game = new Game();
};
