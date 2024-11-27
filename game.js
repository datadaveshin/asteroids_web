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
        this.isThrusting = false;  // Track if thrust key is pressed
        this.bulletsRemaining = 5;
        this.canShoot = true;  // Prevent holding space to rapid fire
    }

    shoot() {
        if (this.bulletsRemaining > 0 && this.canShoot && this.game.keys[' ']) {
            console.log('Ship position at shot:', this.x, this.y, 'rotation:', this.rotation);  // Debug
            console.log('Shooting bullet!');  // Debug log
            const bullet = new Bullet(
                this.game,
                this.x + Math.cos(this.rotation) * this.size,
                this.y + Math.sin(this.rotation) * this.size,
                this.rotation
            );
            console.log('Bullet created at:', bullet.x, bullet.y);  // Debug log
            this.game.entities.push(bullet);
            console.log('Total entities:', this.game.entities.length);  // Debug log
            this.bulletsRemaining--;
            this.canShoot = false;  // Prevent next shot until space is released
        }
        
        // Reset shooting ability when space is released
        if (!this.game.keys[' ']) {
            this.canShoot = true;
        }

        // Reset bullets if all are used and no bullets are in flight
        if (this.bulletsRemaining === 0 && !this.game.entities.some(e => e instanceof Bullet)) {
            this.bulletsRemaining = 5;
        }
    }

    update(deltaTime) {
        // Rotation
        if (this.game.keys['ArrowLeft']) {
            this.rotation -= this.rotationSpeed;
            // Normalize rotation to stay between 0 and 2π
            if (this.rotation < 0) this.rotation += Math.PI * 2;
        }
        if (this.game.keys['ArrowRight']) {
            this.rotation += this.rotationSpeed;
            // Normalize rotation to stay between 0 and 2π
            if (this.rotation > Math.PI * 2) this.rotation -= Math.PI * 2;
        }

        // Thrust
        this.isThrusting = this.game.keys['ArrowUp'];
        if (this.isThrusting) {
            this.velocity.x += Math.cos(this.rotation) * this.thrust;
            this.velocity.y += Math.sin(this.rotation) * this.thrust;
        }

        // Shooting
        this.shoot();

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
        ctx.moveTo(this.size, 0);  // Front of ship
        ctx.lineTo(-this.size/2, -this.size/2);  // Top rear
        ctx.lineTo(-this.size/3, 0);  // Notch
        ctx.lineTo(-this.size/2, this.size/2);  // Bottom rear
        ctx.lineTo(this.size, 0);  // Back to front
        ctx.stroke();
        ctx.closePath();

        // Draw thruster
        if (this.isThrusting) {
            ctx.beginPath();
            ctx.moveTo(-this.size/3, -this.size/4);  // Top of thruster
            ctx.lineTo(-this.size * 1.2, 0);  // Tip of flame
            ctx.lineTo(-this.size/3, this.size/4);  // Bottom of thruster
            ctx.strokeStyle = '#fff';  // Changed to white
            ctx.stroke();
            ctx.closePath();
        }

        ctx.restore();
    }
}

class Bullet {
    constructor(game, x, y, rotation) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.speed = 10;
        this.size = 1.5;
        this.velocity = {
            x: Math.cos(rotation) * this.speed,
            y: Math.sin(rotation) * this.speed
        };
        this.lifespan = 50;
        console.log('New bullet velocity:', this.velocity.x, this.velocity.y);  // Debug
    }

    update(deltaTime) {
        // Move bullet
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        console.log('Bullet position:', this.x, this.y);  // Debug

        // Wrap around screen
        if (this.x < 0) this.x = this.game.canvas.width;
        if (this.x > this.game.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.game.canvas.height;
        if (this.y > this.game.canvas.height) this.y = 0;

        // Decrease lifespan
        this.lifespan--;
        return this.lifespan > 0;
    }

    render(ctx) {
        // Draw a dot for the bullet
        ctx.save();
        ctx.fillStyle = '#fff';  // Changed from strokeStyle to fillStyle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
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
        this.canvas.width = 1280;
        this.canvas.height = 960;

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
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                console.log('Space pressed');  // Debug log
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (e.key === ' ') {
                console.log('Space released');  // Debug log
            }
        });
    }

    update(deltaTime) {
        // First update all entities
        this.entities.forEach(entity => {
            if (entity instanceof Bullet) {
                const alive = entity.update(deltaTime);
                if (!alive) {
                    console.log('Bullet died');  // Debug
                }
            } else {
                entity.update(deltaTime);
            }
        });

        // Then remove dead bullets
        this.entities = this.entities.filter(entity => {
            if (entity instanceof Bullet) {
                return entity.lifespan > 0;
            }
            return true;
        });
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
