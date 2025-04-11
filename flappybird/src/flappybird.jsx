import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const FlappyBird = () => {
  // Canvas and game state refs
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const pipeSpawnTimerRef = useRef(0);
  
  // Game state
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'gameover'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Bird properties
  const birdRef = useRef({
    x: 100,
    y: 300,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.5,
    jumpForce: -10,
    color: '#ffcc00'
  });

  // Pipes
  const pipesRef = useRef([]);
  const pipeWidth = 60;
  const pipeGap = 150;
  const pipeSpeed = 2;
  const pipeSpawnInterval = 1500; // milliseconds

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = 400;
      canvas.height = 600;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Game loop
  const gameLoop = (timestamp) => {
    if (!previousTimeRef.current) {
      previousTimeRef.current = timestamp;
    }
    
    const deltaTime = timestamp - previousTimeRef.current;
    previousTimeRef.current = timestamp;
    
    update(deltaTime);
    render();
    
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Update game state
  const update = (deltaTime) => {
    const bird = birdRef.current;
    const pipes = pipesRef.current;
    
    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Check bird boundaries
    if (bird.y < 0) {
      bird.y = 0;
      bird.velocity = 0;
    }
    
    if (bird.y + bird.height > canvasRef.current.height) {
      endGame();
      return;
    }
    
    // Spawn new pipes
    pipeSpawnTimerRef.current += deltaTime;
    if (pipeSpawnTimerRef.current >= pipeSpawnInterval) {
      createPipe();
      pipeSpawnTimerRef.current = 0;
    }
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= pipeSpeed;
      
      // Check if bird passed the pipe
      if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
        pipes[i].passed = true;
        setScore(prevScore => prevScore + 1);
      }
      
      // Remove pipes that are off screen
      if (pipes[i].x + pipeWidth < 0) {
        pipes.splice(i, 1);
      }
      
      // Check collision with pipes
      if (
        bird.x + bird.width > pipes[i].x && 
        bird.x < pipes[i].x + pipeWidth && 
        (bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].bottomY)
      ) {
        endGame();
        return;
      }
    }
  };

  // Render game
  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bird = birdRef.current;
    const pipes = pipesRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw bird
    ctx.fillStyle = bird.color;
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    
    // Draw bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + 30, bird.y + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw bird beak
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(bird.x + 40, bird.y + 15);
    ctx.lineTo(bird.x + 50, bird.y + 15);
    ctx.lineTo(bird.x + 40, bird.y + 20);
    ctx.fill();
    
    // Draw pipes
    ctx.fillStyle = '#4CAF50';
    for (const pipe of pipes) {
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
      
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
      
      // Pipe edges
      ctx.fillStyle = '#388E3C';
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
      ctx.fillStyle = '#4CAF50';
    }
  };

  // Create new pipe
  const createPipe = () => {
    const canvas = canvasRef.current;
    const gapPosition = Math.random() * (canvas.height - pipeGap - 100) + 50;
    pipesRef.current.push({
      x: canvas.width,
      topHeight: gapPosition,
      bottomY: gapPosition + pipeGap,
      passed: false
    });
  };

  // Bird jump
  const birdJump = () => {
    if (gameState === 'playing') {
      birdRef.current.velocity = birdRef.current.jumpForce;
    }
  };

  // Start game
  const startGame = () => {
    // Reset game state
    setGameState('playing');
    setScore(0);
    
    // Reset bird position
    birdRef.current = {
      ...birdRef.current,
      y: canvasRef.current.height / 2,
      velocity: 0
    };
    
    // Clear pipes
    pipesRef.current = [];
    pipeSpawnTimerRef.current = 0;
    
    // Reset animation frame references
    previousTimeRef.current = undefined;
    cancelAnimationFrame(requestRef.current);
    
    // Start game loop
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // End game
  const endGame = () => {
    setGameState('gameover');
    setHighScore(prevHighScore => Math.max(prevHighScore, score));
    cancelAnimationFrame(requestRef.current);
  };

  // Event handlers
  const handleKeyDown = (e) => {
    if (e.code === 'Space') {
      if (gameState === 'playing') {
        birdJump();
      } else if (gameState === 'start' || gameState === 'gameover') {
        startGame();
      }
    }
  };

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  return (
    <div className="game-container">
      <canvas 
        ref={canvasRef} 
        className="game-canvas"
        onClick={() => {
          if (gameState === 'playing') {
            birdJump();
          } else {
            startGame();
          }
        }}
      />
      
      <div className="score-display">{score}</div>
      
      {gameState === 'start' && (
        <div className="screen start-screen">
          <h1>Flappy Bird</h1>
          <p>Click or press space to jump</p>
          <button className="game-button" onClick={startGame}>Start Game</button>
        </div>
      )}
      
      {gameState === 'gameover' && (
        <div className="screen game-over-screen">
          <h1>Game Over</h1>
          <p className="final-score">Score: {score}</p>
          <p className="high-score">High Score: {highScore}</p>
          <button className="game-button" onClick={startGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <FlappyBird />
    </div>
  );
}

export default App;