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
window.onload = () => {
    new Game();
};
