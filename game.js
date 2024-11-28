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
        this.isInvulnerable = false;
        this.invulnerableTime = 0;
        this.maxInvulnerableTime = 120;  // 2 seconds at 60fps
        this.lives = 3;
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

        // Update invulnerability
        if (this.isInvulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.isInvulnerable = false;
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Make ship blink when invulnerable
        if (!this.isInvulnerable || Math.floor(this.invulnerableTime / 4) % 2) {
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
        }

        ctx.restore();
    }

    getVertices() {
        const vertices = [
            { x: this.size, y: 0 },  // Nose
            { x: -this.size/2, y: -this.size/2 },  // Left wing
            { x: -this.size/3, y: 0 },  // Notch
            { x: -this.size/2, y: this.size/2 }  // Right wing
        ];

        // Transform vertices based on ship's position and rotation
        return vertices.map(v => {
            const rotatedX = v.x * Math.cos(this.rotation) - v.y * Math.sin(this.rotation);
            const rotatedY = v.x * Math.sin(this.rotation) + v.y * Math.cos(this.rotation);
            return {
                x: rotatedX + this.x,
                y: rotatedY + this.y
            };
        });
    }

    checkCollision(asteroid) {
        if (this.isInvulnerable) return false;

        const shipVertices = this.getVertices();
        
        // Check if any ship vertex is inside the asteroid
        for (const vertex of shipVertices) {
            if (asteroid.containsPoint(vertex)) {
                return true;
            }
        }
        return false;
    }

    destroy() {
        this.lives--;
        
        // Create explosion at ship's position
        this.game.particleSystem.createExplosion(
            this.x, 
            this.y, 
            20,  // number of particles
            '#fff'  // white particles
        );
        
        if (this.lives > 0) {
            this.respawn();
        }
    }

    respawn() {
        // Reset position to center
        this.x = this.game.canvas.width / 2;
        this.y = this.game.canvas.height / 2;
        
        // Reset movement
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;
        
        // Make invulnerable
        this.isInvulnerable = true;
        this.invulnerableTime = this.maxInvulnerableTime;
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

class Asteroid {
    constructor(game, x, y, size = 40) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = size;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;  // Random rotation
        
        // Random velocity
        const speed = 1 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };

        // Create irregular shape
        this.vertices = [];
        const vertices = 10;  // Number of vertices
        for (let i = 0; i < vertices; i++) {
            const angle = (i / vertices) * Math.PI * 2;
            const variance = 0.5;  // How irregular the shape is
            const radius = this.size * (1 + (Math.random() - 0.5) * variance);
            this.vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
    }

    update() {
        // Rotate
        this.rotation += this.rotationSpeed;

        // Move
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Wrap around screen
        if (this.x < -this.size) this.x = this.game.canvas.width + this.size;
        if (this.x > this.game.canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = this.game.canvas.height + this.size;
        if (this.y > this.game.canvas.height + this.size) this.y = -this.size;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw asteroid
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }

    containsPoint(point) {
        // Transform point to asteroid's local space
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        
        // Rotate point opposite to asteroid's rotation
        const rotatedX = dx * Math.cos(-this.rotation) - dy * Math.sin(-this.rotation);
        const rotatedY = dx * Math.sin(-this.rotation) + dy * Math.cos(-this.rotation);

        // Ray casting algorithm
        let inside = false;
        for (let i = 0, j = this.vertices.length - 1; i < this.vertices.length; j = i++) {
            const vi = this.vertices[i];
            const vj = this.vertices[j];
            
            if (((vi.y > rotatedY) !== (vj.y > rotatedY)) &&
                (rotatedX < (vj.x - vi.x) * (rotatedY - vi.y) / (vj.y - vi.y) + vi.x)) {
                inside = !inside;
            }
        }
        return inside;
    }

    split() {
        if (this.size < 20) {  // Minimum size before destruction
            return [];
        }

        // Create two smaller asteroids
        const newSize = this.size / 2;
        const newAsteroids = [];

        for (let i = 0; i < 2; i++) {
            // Add some random offset to position
            const offset = 20;
            const newX = this.x + (Math.random() - 0.5) * offset;
            const newY = this.y + (Math.random() - 0.5) * offset;
            
            const asteroid = new Asteroid(this.game, newX, newY, newSize);
            // Add some velocity based on the impact
            asteroid.velocity.x = this.velocity.x + (Math.random() - 0.5) * 2;
            asteroid.velocity.y = this.velocity.y + (Math.random() - 0.5) * 2;
            newAsteroids.push(asteroid);
        }

        return newAsteroids;
    }
}

class Particle {
    constructor(x, y, velocity, color, lifespan = 60) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.color = color;
        this.lifespan = lifespan;
        this.originalLifespan = lifespan;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.lifespan--;
        return this.lifespan > 0;
    }

    render(ctx) {
        const alpha = this.lifespan / this.originalLifespan;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 1 + Math.random() * 3;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            this.particles.push(new Particle(x, y, velocity, color));
        }
    }

    update() {
        this.particles = this.particles.filter(particle => particle.update());
    }

    render(ctx) {
        this.particles.forEach(particle => particle.render(ctx));
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;

        // Set canvas size
        this.canvas.width = 960;
        this.canvas.height = 720;

        // Game state
        this.entities = [];
        this.keys = {};
        this.gameState = 'splash'; // 'splash', 'playing', 'gameover'
        this.highScore = 0;

        // Create particle system
        this.particleSystem = new ParticleSystem();

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
            
            // Start game on any key from splash screen
            if (this.gameState === 'splash' && e.key !== ' ') {
                this.startGame();
            }
            
            // Restart game on Enter from game over screen
            if (this.gameState === 'gameover' && e.key === 'Enter') {
                this.startGame();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (e.key === ' ') {
                console.log('Space released');  // Debug log
            }
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.entities = [];
        
        // Create ship
        this.ship = new Ship(this, this.canvas.width / 2, this.canvas.height / 2);
        this.ship.lives = 3;
        this.entities.push(this.ship);
        
        // Create asteroids
        this.createAsteroids(4);
    }

    gameOver() {
        this.gameState = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }
        // Update lives display to show 0
        document.getElementById('lives').textContent = 'Lives: 0';
    }

    createAsteroids(count) {
        for (let i = 0; i < count; i++) {
            // Create asteroids away from the ship
            let x, y;
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (Math.hypot(x - this.ship.x, y - this.ship.y) < 200);  // Keep asteroids away from ship

            const asteroid = new Asteroid(this, x, y);
            this.entities.push(asteroid);
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        // First update all entities
        this.entities.forEach(entity => {
            if (entity instanceof Bullet) {
                const alive = entity.update(deltaTime);
                if (!alive) {
                    console.log('Bullet died');  // Debug
                }
            } else if (entity instanceof Asteroid) {
                entity.update();
            } else {
                entity.update(deltaTime);
            }
        });

        // Update particle system
        this.particleSystem.update();

        // Check for collisions
        const bullets = this.entities.filter(e => e instanceof Bullet);
        const asteroids = this.entities.filter(e => e instanceof Asteroid);
        
        bullets.forEach(bullet => {
            asteroids.forEach(asteroid => {
                if (asteroid.containsPoint(bullet)) {
                    // Remove the bullet
                    this.entities = this.entities.filter(e => e !== bullet);
                    
                    // Remove the hit asteroid
                    this.entities = this.entities.filter(e => e !== asteroid);
                    
                    // Add new asteroids from split
                    const newAsteroids = asteroid.split();
                    this.entities.push(...newAsteroids);
                    
                    // Update score
                    this.score += 100;
                }
            });
        });

        // Ship-asteroid collisions
        asteroids.forEach(asteroid => {
            if (this.ship.checkCollision(asteroid) && this.ship.lives > 0) {  // Only check collision if ship has lives
                this.ship.destroy();
                if (this.ship.lives <= 0) {
                    // Wait for explosion animation before game over
                    setTimeout(() => {
                        this.gameOver();
                    }, 1000);  // 1 second delay
                }
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
        // Clear the canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameState === 'splash') {
            // Render splash screen
            this.ctx.save();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '64px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ASTEROIDS', this.canvas.width / 2, this.canvas.height / 3);
            
            this.ctx.font = '24px "Press Start 2P", monospace';
            this.ctx.fillText('Press Any Key to Start', this.canvas.width / 2, this.canvas.height * 2/3);
            
            this.ctx.font = '16px "Press Start 2P", monospace';
            this.ctx.fillText('Arrow Keys to Move    Space to Shoot', this.canvas.width / 2, this.canvas.height * 3/4);
            this.ctx.restore();
            
        } else if (this.gameState === 'playing') {
            // Render game
            this.entities.forEach(entity => entity.render(this.ctx));
            this.particleSystem.render(this.ctx);
            
            // Update score and lives display
            document.getElementById('score').textContent = `Score: ${this.score}`;
            document.getElementById('lives').textContent = `Lives: ${this.ship.lives}`;
            
        } else if (this.gameState === 'gameover') {
            // Render game over screen
            this.ctx.save();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '64px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 3);
            
            this.ctx.font = '24px "Press Start 2P", monospace';
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            
            this.ctx.fillText('Press Enter to Restart', this.canvas.width / 2, this.canvas.height * 3/4);
            this.ctx.restore();
        }
    }

    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    reset() {
        this.gameState = 'splash';
        this.score = 0;
        this.entities = [];
        this.particleSystem = new ParticleSystem();
    }
}

// Start the game when the page loads
let game;
window.onload = () => {
    game = new Game();
};
