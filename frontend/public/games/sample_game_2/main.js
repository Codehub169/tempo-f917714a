document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('neonCipherGameContainer');
    if (!gameContainer) {
        console.error('Neon Cipher: Game container not found!');
        return;
    }

    const config = {
        gridSize: 4, // 4x4 grid
        tileSize: 80, // pixels
        tileSpacing: 10, // pixels
        glowColor: 'var(--primary-accent, #00FFFF)',
        activeColor: 'var(--secondary-accent, #FF00FF)',
        baseColor: 'rgba(51, 51, 51, 0.7)',
        flashDuration: 500, // ms
        levelUpDelay: 1000, // ms
        maxSequenceLength: 10 // Max sequence length for a win
    };

    let canvas, ctx;
    let sequence = [];
    let playerSequence = [];
    let currentLevel = 1;
    let score = 0;
    let highScore = localStorage.getItem('neonCipherHighScore') || 0;
    let canPlayerClick = false;
    let gameActive = false;
    let tiles = [];

    function initGame() {
        gameContainer.innerHTML = ''; // Clear placeholder text
        canvas = document.createElement('canvas');
        const canvasSize = config.gridSize * config.tileSize + (config.gridSize + 1) * config.tileSpacing;
        canvas.width = canvasSize;
        canvas.height = canvasSize + 120; // Extra space for score/level text
        ctx = canvas.getContext('2d');
        gameContainer.appendChild(canvas);

        createTiles();
        drawInitialScreen();
        canvas.addEventListener('click', handleCanvasClick);
    }

    function createTiles() {
        tiles = [];
        for (let row = 0; row < config.gridSize; row++) {
            for (let col = 0; col < config.gridSize; col++) {
                const x = config.tileSpacing + col * (config.tileSize + config.tileSpacing);
                const y = config.tileSpacing + row * (config.tileSize + config.tileSpacing);
                tiles.push({ x, y, width: config.tileSize, height: config.tileSize, id: row * config.gridSize + col, color: config.baseColor });
            }
        }
    }

    function drawTiles(flashingTileId = -1, flashColor = config.activeColor) {
        tiles.forEach(tile => {
            ctx.fillStyle = (tile.id === flashingTileId) ? flashColor : tile.color;
            ctx.strokeStyle = config.glowColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = config.glowColor;
            
            ctx.beginPath();
            ctx.roundRect(tile.x, tile.y, tile.width, tile.height, [10]); // Rounded corners
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow for text
        });
    }

    function drawText() {
        ctx.fillStyle = 'var(--text-color, #CCCCCC)';
        ctx.font = '24px Orbitron';
        ctx.textAlign = 'center';
        const textY = config.gridSize * (config.tileSize + config.tileSpacing) + config.tileSpacing + 40;
        ctx.fillText(`Level: ${currentLevel}`, canvas.width / 2, textY);
        ctx.font = '18px Rajdhani';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, textY + 30);
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, textY + 55);
    }

    function drawInitialScreen() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTiles();
        drawText();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0, canvas.width, canvas.height - 120);

        ctx.font = '36px Orbitron';
        ctx.fillStyle = config.glowColor;
        ctx.textAlign = 'center';
        ctx.fillText('Neon Cipher', canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = '20px Rajdhani';
        ctx.fillStyle = 'var(--text-color, #CCCCCC)';
        ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '14px Rajdhani';
        ctx.fillText('Memorize the sequence.', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Reproduce it to advance.', canvas.width / 2, canvas.height / 2 + 20);
    }

    function startGame() {
        gameActive = true;
        currentLevel = 1;
        score = 0;
        sequence = [];
        nextLevel();
    }

    function nextLevel() {
        playerSequence = [];
        canPlayerClick = false;
        addToSequence();
        flashSequence();
        drawGameScreen(); // Update score/level display
    }

    function addToSequence() {
        if (sequence.length < config.maxSequenceLength) {
            const randomTileIndex = Math.floor(Math.random() * (config.gridSize * config.gridSize));
            sequence.push(randomTileIndex);
        } else {
            // Potentially a win condition if max sequence is reached
            // For now, just continues but doesn't add more
        }
    }

    async function flashSequence() {
        canPlayerClick = false;
        for (let i = 0; i < sequence.length; i++) {
            const tileId = sequence[i];
            await flashTile(tileId, config.activeColor, config.flashDuration);
            await delay(config.flashDuration / 2);
        }
        canPlayerClick = true;
    }

    async function flashTile(tileId, color, duration) {
        return new Promise(resolve => {
            const originalColor = tiles[tileId].color;
            tiles[tileId].color = color;
            drawGameScreen();
            setTimeout(() => {
                tiles[tileId].color = originalColor;
                drawGameScreen();
                resolve();
            }, duration);
        });
    }
    
    function drawGameScreen(flashingTileId = -1, flashColor = config.activeColor) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTiles(flashingTileId, flashColor);
        drawText();
    }

    function handleCanvasClick(event) {
        if (!gameActive) {
            startGame();
            return;
        }

        if (!canPlayerClick) return;

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        for (const tile of tiles) {
            if (clickX > tile.x && clickX < tile.x + tile.width &&
                clickY > tile.y && clickY < tile.y + tile.height) {
                processPlayerInput(tile.id);
                break;
            }
        }
    }

    async function processPlayerInput(tileId) {
        if (!canPlayerClick) return;

        playerSequence.push(tileId);
        await flashTile(tileId, config.glowColor, config.flashDuration / 2); // Player click feedback

        const currentStep = playerSequence.length - 1;
        if (playerSequence[currentStep] !== sequence[currentStep]) {
            gameOver('System Breach: Sequence Mismatch!');
            return;
        }

        if (playerSequence.length === sequence.length) {
            if (sequence.length >= config.maxSequenceLength) {
                 gameOver('System Integrity Maintained: Full Sequence Decrypted!', true);
                 return;
            }
            score += currentLevel * 10;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('neonCipherHighScore', highScore);
            }
            currentLevel++;
            canPlayerClick = false;
            setTimeout(nextLevel, config.levelUpDelay);
        }
    }

    function gameOver(message, win = false) {
        gameActive = false;
        canPlayerClick = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawTiles(); // Draw grid in base state
        drawText(); // Draw final score

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0,0, canvas.width, canvas.height - 120);

        ctx.font = '30px Orbitron';
        ctx.fillStyle = win ? config.glowColor : 'var(--secondary-accent, #FF00FF)';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = '20px Rajdhani';
        ctx.fillStyle = 'var(--text-color, #CCCCCC)';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2);
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Ensure fonts are loaded before starting, or use document.fonts.ready if available
    // For simplicity, we'll assume they are available from the HTML's <link>
    // A more robust solution might use FontFaceObserver or document.fonts.ready
    setTimeout(initGame, 100); // Small delay to help with font loading race condition

    // Get CSS variables
    // Note: This is a simplified way. For dynamic updates if CSS vars change, a more complex setup is needed.
    const rootStyles = getComputedStyle(document.documentElement);
    config.glowColor = rootStyles.getPropertyValue('--primary-accent').trim() || config.glowColor;
    config.activeColor = rootStyles.getPropertyValue('--secondary-accent').trim() || config.activeColor;
    const textColor = rootStyles.getPropertyValue('--text-color').trim();
    if(textColor) {
      // Update text color if needed, though it's mostly handled by CSS vars in drawText
    }

});
