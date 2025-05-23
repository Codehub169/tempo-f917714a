// frontend/public/games/sample_game_1/main.js
document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.querySelector('.game-container');
    if (!gameContainer) {
        console.error('Game container not found for Void Runner!');
        // Attempt to create a fallback container if critical
        const fallbackContainer = document.createElement('div');
        fallbackContainer.className = 'game-container';
        document.body.appendChild(fallbackContainer);
        // gameContainer = fallbackContainer; // This line was problematic, querySelector is static
        if (document.querySelector('.game-container')) { // Re-query if fallback was added
             console.warn('Fallback game container created. Ensure .game-container exists in HTML.');
        }
        else {
            console.error('Failed to find or create game container. Void Runner cannot start.');
            return;
        }
    }

    // Clear placeholder text from the specific game container for Void Runner
    const voidRunnerContainer = document.getElementById('voidRunnerGameContainer') || gameContainer; // Prefer specific ID if available
    voidRunnerContainer.innerHTML = ''; 

    const canvas = document.createElement('canvas');
    canvas.id = 'voidRunnerCanvas';
    const canvasWidth = 600;
    const canvasHeight = 400;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    voidRunnerContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Game constants
    const PLAYER_WIDTH = 30;
    const PLAYER_HEIGHT = 20;
    const PLAYER_COLOR = '#00FFFF'; // Cyan Neon
    const OBSTACLE_WIDTH = 40;
    const OBSTACLE_HEIGHT = 40;
    const OBSTACLE_COLOR = '#FF00FF'; // Magenta Neon
    let obstacleSpeed = 2;
    const OBSTACLE_SPAWN_INTERVAL = 1500; // ms
    let scoreIncrement = 1;

    // Player state
    let player = {
        x: canvas.width / 2 - PLAYER_WIDTH / 2,
        y: canvas.height - PLAYER_HEIGHT - 10,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        dx: 5 // horizontal speed
    };

    // Obstacles state
    let obstacles = [];
    let lastObstacleSpawnTime = 0;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('voidRunnerHighScore')) || 0;
    let gameOver = false;
    let gameLoopId;
    let gameStartTime = 0;

    // --- Player Controls ---
    let rightPressed = false;
    let leftPressed = false;

    const keyDownHandler = (e) => {
        if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = true;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = true;
        }
        if (gameOver && e.key === 'Enter') {
            resetGame();
            gameLoop(performance.now());
        }
    };

    const keyUpHandler = (e) => {
        if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            rightPressed = false;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            leftPressed = false;
        }
    };
    
    // Touch controls
    let touchStartX = null;
    const touchStartHandler = (e) => {
        e.preventDefault(); 
        if (gameOver) {
            resetGame();
            gameLoop(performance.now());
            return;
        }
        if (e.touches.length > 0) touchStartX = e.touches[0].clientX;
    };

    const touchMoveHandler = (e) => {
        e.preventDefault(); 
        if (gameOver || touchStartX === null || e.touches.length === 0) return;
        let touchCurrentX = e.touches[0].clientX;
        let diffX = touchCurrentX - touchStartX;

        const sensitivity = player.dx * 1.5; // Adjust sensitivity as needed

        if (diffX > 5) { // Swipe right threshold
            player.x += sensitivity;
        } else if (diffX < -5) { // Swipe left threshold
            player.x -= sensitivity;
        }
        
        // Keep player within bounds
        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }
        if (player.x < 0) {
            player.x = 0;
        }
        touchStartX = e.touches[0].clientX; 
    };

    const touchEndHandler = (e) => {
        e.preventDefault();
        touchStartX = null;
    };

    function addInputListeners() {
        document.addEventListener('keydown', keyDownHandler);
        document.addEventListener('keyup', keyUpHandler);
        canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
        canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
        canvas.addEventListener('touchend', touchEndHandler, { passive: false });
    }

    function removeInputListeners() {
        document.removeEventListener('keydown', keyDownHandler);
        document.removeEventListener('keyup', keyUpHandler);
        canvas.removeEventListener('touchstart', touchStartHandler);
        canvas.removeEventListener('touchmove', touchMoveHandler);
        canvas.removeEventListener('touchend', touchEndHandler);
    }

    // --- Game Logic ---
    function drawPlayer() {
        ctx.fillStyle = PLAYER_COLOR;
        ctx.shadowColor = PLAYER_COLOR;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0; 
    }

    function drawObstacles() {
        obstacles.forEach(obstacle => {
            ctx.fillStyle = OBSTACLE_COLOR;
            ctx.shadowColor = OBSTACLE_COLOR;
            ctx.shadowBlur = 10;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            // Add a highlight or inner detail
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
            ctx.shadowBlur = 0;
        });
    }

    function updatePlayerPosition() {
        if (rightPressed && player.x < canvas.width - player.width) {
            player.x += player.dx;
        }
        if (leftPressed && player.x > 0) {
            player.x -= player.dx;
        }
    }

    function spawnObstacle(currentTime) {
        if (currentTime - lastObstacleSpawnTime > OBSTACLE_SPAWN_INTERVAL) {
            const x = Math.random() * (canvas.width - OBSTACLE_WIDTH);
            obstacles.push({ x: x, y: -OBSTACLE_HEIGHT, width: OBSTACLE_WIDTH, height: OBSTACLE_HEIGHT });
            lastObstacleSpawnTime = currentTime;
        }
    }

    function updateObstacles() {
        // Increase difficulty over time
        const elapsedTime = (performance.now() - gameStartTime) / 1000; // in seconds
        obstacleSpeed = 2 + Math.floor(elapsedTime / 15) * 0.5; // Increase speed every 15s
        scoreIncrement = 1 + Math.floor(elapsedTime / 30); // Increase score value every 30s

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.y += obstacleSpeed;
            if (obstacle.y > canvas.height) {
                obstacles.splice(i, 1);
                score += scoreIncrement;
            }
        }
    }

    function checkCollisions() {
        obstacles.forEach(obstacle => {
            if (player.x < obstacle.x + obstacle.width &&
                player.x + player.width > obstacle.x &&
                player.y < obstacle.y + obstacle.height &&
                player.y + player.height > obstacle.y) {
                gameOver = true;
                if (gameLoopId) cancelAnimationFrame(gameLoopId);
                drawGameOverScreen();
                removeInputListeners(); // Remove game input listeners
                // Add listeners for restart
                document.addEventListener('keydown', startGameListener);
                canvas.addEventListener('touchstart', startGameListener, { passive: false });
            }
        });
    }

    function drawScore() {
        ctx.fillStyle = '#CCCCCC';
        ctx.font = '22px Rajdhani, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 20, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`HI-SCORE: ${highScore}`, canvas.width - 20, 30);
    }
    
    function drawStarfield() {
        if (!window.voidRunnerStars) {
            window.voidRunnerStars = [];
            for (let i = 0; i < 100; i++) {
                window.voidRunnerStars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5,
                    alpha: Math.random() * 0.5 + 0.5, 
                    speed: Math.random() * 0.3 + 0.1 
                });
            }
        }

        ctx.fillStyle = '#0A0A0A'; 
        ctx.fillRect(0,0,canvas.width, canvas.height);

        window.voidRunnerStars.forEach(star => {
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width; 
            }
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(204, 204, 204, ${star.alpha})`; 
            ctx.fill();
        });
    }

    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.85)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '48px Orbitron, sans-serif';
        ctx.fillStyle = '#FF00FF'; 
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 10;
        ctx.fillText('SYSTEM OFFLINE', canvas.width / 2, canvas.height / 2 - 70);
        ctx.shadowBlur = 0;

        ctx.font = '28px Rajdhani, sans-serif';
        ctx.fillStyle = '#00FFFF'; 
        ctx.fillText(`FINAL SCORE: ${score}`, canvas.width / 2, canvas.height / 2 -10);
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('voidRunnerHighScore', highScore.toString());
            ctx.fillStyle = '#FFFF00'; 
            ctx.font = '24px Orbitron, sans-serif';
            ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 + 40);
        }

        ctx.font = '20px Rajdhani, sans-serif';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('Press Enter or Tap to Reboot', canvas.width / 2, canvas.height / 2 + 90);
    }
    
    function resetGame() {
        player.x = canvas.width / 2 - PLAYER_WIDTH / 2;
        player.y = canvas.height - PLAYER_HEIGHT - 10;
        obstacles = [];
        score = 0;
        obstacleSpeed = 2;
        scoreIncrement = 1;
        lastObstacleSpawnTime = performance.now();
        gameStartTime = performance.now();
        gameOver = false;
        rightPressed = false;
        leftPressed = false;
        
        removeInputListeners(); // Clean up any lingering restart listeners
        addInputListeners();    // Add game input listeners
    }

    function gameLoop(timestamp) {
        if (gameOver) return;

        drawStarfield();
        spawnObstacle(timestamp);
        updatePlayerPosition();
        updateObstacles();
        drawPlayer();
        drawObstacles();
        drawScore();
        checkCollisions(); // Check collisions after drawing everything else, before next frame
        
        if (!gameOver) { // Only request next frame if game is not over
             gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    function showStartMessage() {
        drawStarfield();
        ctx.font = '36px Orbitron, sans-serif';
        ctx.fillStyle = '#00FFFF';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.fillText('VOID RUNNER', canvas.width / 2, canvas.height / 2 - 60);
        ctx.shadowBlur = 0;

        ctx.font = '20px Rajdhani, sans-serif';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('A/D or Arrow Keys to Navigate', canvas.width / 2, canvas.height / 2);
        ctx.fillText('Tap/Swipe on Mobile Devices', canvas.width / 2, canvas.height / 2 + 30);
        ctx.font = '22px Rajdhani, sans-serif';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('Press Enter or Tap to Initialize', canvas.width / 2, canvas.height / 2 + 70);
    }
    
    const startGameListener = (e) => {
        if (e.key === 'Enter' || e.type === 'touchstart') {
            e.preventDefault();
            document.removeEventListener('keydown', startGameListener);
            canvas.removeEventListener('touchstart', startGameListener);
            resetGame();
            gameLoop(performance.now());
        }
    };

    showStartMessage();
    document.addEventListener('keydown', startGameListener);
    canvas.addEventListener('touchstart', startGameListener, { passive: false });

});
