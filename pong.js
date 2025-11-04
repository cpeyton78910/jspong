let init = () => {

  canvas = document.querySelector('#gameCanvas');
  ctx = canvas.getContext('2d');

  // Initialize variables
  canvas.width = 500;
  canvas.height = 400;

  game = {
    fps: 60,
    winningScore: 10,
    state: "startScreen",
    previousState: "startScreen",
    turn: 1,
    difficulty: "impossible",
    ballSpeed: 10,
    ballSpeedRate: 0.1,
    mute: false,
    canvasMidX: canvas.width / 2,
    canvasMidY: canvas.height / 2
  };

  mouseY = 0;

  player1 = {
    score: 0,
    centerY: game.canvasMidY,
    get top() {
      return this.centerY - paddle.height / 2;
    },
    set top(value) {
      this.centerY = value + paddle.height / 2;
    },
    get bottom() {
      return this.centerY + paddle.height / 2;
    },
    set bottom(value) {
      this.centerY = value - paddle.height / 2;
    }
  }

  player2 = {
    score: 0,
    serveTime: 0,
    _centerY: game.canvasMidY,
    get centerY() {
      return this._centerY;
    },
    set centerY(value) {
      this._centerY = Math.max(paddle.height / 2, Math.min(canvas.height - paddle.height / 2, value));
    },
    get top() {
      return this._centerY - paddle.height / 2;
    },
    set top(value) {
      this.centerY = value + paddle.height / 2;
    },
    get bottom() {
      return this._centerY + paddle.height / 2;
    },
    set bottom(value) {
      this.centerY = value - paddle.height / 2;
    }
  }

  paddle = {
    height: 50,
    width: 10,
  };

  ball = {
    _centerX: game.canvasMidX,
    _centerY: game.canvasMidY,
    get centerX() {
      return this._centerX;
    },
    set centerX(value) {
      this._centerX = Math.max(this.size / 2, Math.min(canvas.width - this.size / 2, value));
    },
    get centerY() {
      return this._centerY;
    },
    set centerY(value) {
      this._centerY = Math.max(this.size / 2, Math.min(canvas.height - this.size / 2, value));
    },
    get left() {
      return this.centerX - this.size / 2;
    },
    set left(value) {
      this.centerX = value + this.size / 2;
    },
    get right() {
      return this.centerX + this.size / 2;
    },
    set right(value) {
      this.centerX = value - this.size / 2;
    },
    get top() {
      return this.centerY - this.size / 2;
    },
    set top(value) {
      this.centerY = value + this.size / 2;
    },
    get bottom() {
      return this.centerY + this.size / 2;
    },
    set bottom(value) {
      this.centerY = value - this.size / 2;
    },

    _angle: 90,

    get angle() {
      return this._angle;
    },
    set angle(value) {
      this._angle = value % 360;
    },
    get radians() {
      return this._angle * Math.PI / 180;
    },

    size: 10,
    speed: 5
  };

  // define sounds
  paddleSFX = new Audio('gameAssets/paddle.mp3');
  wallSFX = new Audio('gameAssets/wall.mp3');
  scoreSFX = new Audio('gameAssets/score.mp3');

  paddleSFX.preload = "auto";
  wallSFX.preload = "auto";
  scoreSFX.preload = "auto";

  eventListeners();
  setInterval(gameLoop, 1000 / game.fps);

} // end of init

let eventListeners = () => {

  // DOM Elements
  menuButton = document.querySelector('#menuButton');
  pauseContainer = document.querySelector('#pauseContainer');
  difficultyContainer = document.querySelector('#difficultyContainer');
  resumeButton = pauseContainer.querySelector('#resumeButton');
  restartButton = pauseContainer.querySelector('#restartButton');
  muteButton = pauseContainer.querySelector('#muteButton');

  // Difficulty Settings
  const difficultySettings = {
    easy: { serveTime: 1750, ballSpeed: 4 },
    medium: { serveTime: 1500, ballSpeed: 5 },
    hard: { serveTime: 1000, ballSpeed: 5 },
    impossible: { serveTime: 500, ballSpeed: 5 }
  };

  // Set mouseY
  document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = (e.clientY - rect.top) * canvas.height / rect.height;
  });
  document.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = (e.touches[0].clientY - rect.top) * canvas.height / rect.height;
  });

  // Pause Screen
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
      game.previousState = game.state;
      game.state = "pause";
    }
  });
  menuButton.addEventListener('click', () => {
    game.previousState = game.state;
    game.state = "pause";
  });
  resumeButton.addEventListener('click', () => {
    if (game.state === "pause") {
      if (game.previousState === "pause") {
        game.previousState = "playing";
      }
      game.state = game.previousState;
      pauseContainer.style.display = "none";
    }
  });
  muteButton.addEventListener('click', () => {
    game.mute = !game.mute;
    if (game.mute) {
      paddleSFX.volume = 0;
      wallSFX.volume = 0;
      scoreSFX.volume = 0;
      muteButton.textContent = "Unmute";
    } else {
      paddleSFX.volume = 1;
      wallSFX.volume = 1;
      scoreSFX.volume = 1;
      muteButton.textContent = "Mute";
    }
  });

  // Restart Button
  restartButton.addEventListener('click', () => {
    game.state = "startScreen";
    game.previousState = "startScreen";
    player2.centerY = game.canvasMidY;
    pauseContainer.style.display = "none";
  });

  // Difficulty Buttons
  document.querySelectorAll('.difficultyButton').forEach(button => {
    button.addEventListener('click', () => {
      // Set difficulty
      const difficulty = button.dataset.difficulty;
      game.difficulty = difficulty;

      const settings = difficultySettings[difficulty];
      player2.serveTime = settings.serveTime;

      // Reset and start game
      ball.centerX = game.canvasMidX;
      ball.centerY = game.canvasMidY;
      game.ballSpeed = settings.ballSpeed;
      game.state = "serving";
      game.turn = Math.random() < 0.5 ? 1 : 2;
      player1.score = 0;
      player2.score = 0;
      difficultyContainer.style.display = "none";
      if (game.turn === 2) {
        setTimeout(function() {
          ball.angle = Math.random() < 0.5 ? -60 : -120;
          ball.speed = game.ballSpeed;
          // don't start if paused
          if (game.state === "pause") {
            game.previousState = "playing";
          } else {
            game.state = "playing";
          }
        }, player2.serveTime);
      }
    });
  });

  // Serve Ball on Click
  // Desktop
  canvas.addEventListener('click', () => {
    if (game.state ==="serving" && game.turn === 1) {
      game.state = "playing";
      ball.angle = Math.random() < 0.5 ? 60 : 120;
      ball.speed = game.ballSpeed;
    }
  });
  // Mobile
  canvas.addEventListener('touchstart', () => {
    if (game.state ==="serving" && game.turn === 1) {
      game.state = "playing";
      ball.angle = Math.random() < 0.5 ? 60 : 120;
      ball.speed = game.ballSpeed;
    }
  });

  // Responsive Scaling
  function scaleCanvas() {

    const windowWidth = document.body.clientWidth;
    const windowHeight = document.body.clientHeight;

    const scaleX = windowWidth / canvas.width;
    const scaleY = windowHeight / canvas.height;

    scale = Math.min(scaleX, scaleY);

    const gameContainer = document.querySelector('.gameContainer');
    gameContainer.style.transform = `scale(${scale})`;
    gameContainer.style.transformOrigin = 'top left';

    // center it on screen
    gameContainer.style.position = 'absolute';
    gameContainer.style.left = `${(windowWidth - canvas.width * scale) / 2}px`;
    gameContainer.style.top = `${(windowHeight - canvas.height * scale) / 2}px`;
  }

  window.addEventListener('resize', scaleCanvas);
  scaleCanvas();

}; // end of eventListeners

let gameLoop = () => {

  // Move Ball
  if (game.state === "serving") {
    ball.centerX = game.canvasMidX;
    ball.centerY = game.canvasMidY;
    if (game.turn === 1) {
      canvas.style.cursor = "pointer";
    }
  } else if (game.state === "playing") {
    ball.centerX += ball.speed * Math.sin(ball.radians);
    ball.centerY += ball.speed * Math.cos(ball.radians);
    canvas.style.cursor = "default";
  } else {
    canvas.style.cursor = "default";
  }

  if (game.state === "playing" || game.state === "serving") {
    // Player1 position
    player1.centerY = Math.max(paddle.height / 2, Math.min(canvas.height - paddle.height / 2, mouseY));
    // Player2 position
    if (game.difficulty === "impossible") {

      if (Math.abs(ball.centerY - game.canvasMidY) < ball.size) {
        player2.centerY = game.canvasMidY;
      } else if (ball.centerY > game.canvasMidY) {
        player2.bottom = ball.bottom + ball.size / 2;
      } else {
        player2.top = ball.top - ball.size / 2;
      }
      player2.top = Math.min(ball.bottom, player2.bottom)
      player2.bottom = Math.max(ball.top, player2.top);

    } else {
      let ifBallComingSpeed;
      let ifBallNotComingSpeed;
      if (game.difficulty === "hard") {
        ifBallComingSpeed = (Math.min(Math.abs(ball.centerY-player2.centerY), 15) / 2 + 5 + Math.random() + (ball.speed - 5) * 2) / 3 + Math.random();
        ifBallNotComingSpeed = 4;
      } else if (game.difficulty === "medium") {
        ifBallComingSpeed = (Math.min(Math.abs(ball.centerY-player2.centerY), 5) + Math.random() * 5) / 2;
        ifBallNotComingSpeed = 3;
      } else if (game.difficulty === "easy") {
        ifBallComingSpeed = (Math.min(Math.abs(ball.centerY-player2.centerY), 12) / 2 + 8 * Math.random() + (ball.speed - 5)) / 4 + Math.random();
        ifBallNotComingSpeed = 2;
      }
      if (ball.left >= game.canvasMidX && ball.angle < 180 && ball.angle > 0) {
        if (ball.top < player2.top) {
          player2.centerY -= ifBallComingSpeed;
        } else if (ball.bottom > player2.bottom) {
          player2.centerY += ifBallComingSpeed;
        }
      } else {
        if (player2.centerY < game.canvasMidY - ball.size) {
          player2.centerY += ifBallNotComingSpeed;
        } else if (player2.centerY > game.canvasMidY + ball.size) {
          player2.centerY -= ifBallNotComingSpeed;
        }
      }
    }

    // Ball collision with top and bottom walls
    if (ball.top <= 0 || ball.bottom >= canvas.height) {
      ball.angle = 180 - ball.angle;
      ball.speed += game.ballSpeedRate;
      wallSFX.currentTime = 0;
      wallSFX.play();

      // Player 1 paddle
    } else if (ball.left < paddle.width + 10 &&
        ball.bottom >= player1.top && 
        ball.top <= player1.bottom) {
      ball.left = paddle.width + 10;
      ball.angle = ((player1.centerY - ball.centerY) * 2 + 90);
      ball.speed += game.ballSpeedRate;
      paddleSFX.currentTime = 0;
      paddleSFX.play();

      // Player 2 paddle
    } else if (ball.right > canvas.width - 10 - paddle.width &&
               ball.bottom >= player2.top && 
               ball.top <= player2.bottom) {
      ball.right = canvas.width - 10 - paddle.width;
      ball.angle = ((player2.centerY - ball.centerY) * -2) - 90;
      ball.speed += game.ballSpeedRate;
      paddleSFX.currentTime = 0;
      paddleSFX.play();

      // Player 2 scores
    } else if (ball.left <= 0) {
        player2.score += 1;
        scoreSFX.currentTime = 0;
        scoreSFX.play();
        if (player2.score === game.winningScore) {
          game.state = "gameOver";
        } else {
          game.state = "serving";
          game.turn = 2;
          setTimeout(function() {
            ball.centerX = game.canvasMidX;
            ball.centerY = game.canvasMidY;
            ball.angle = Math.random() < 0.5 ? -60 : -120;
            ball.speed = game.ballSpeed;
            // don't start if paused
            if (game.state === "pause") {
              game.previousState = "playing";
            } else {
              game.state = "playing";
            }
          }, player2.serveTime);
        }

      // Player 1 scores
      } else if (ball.right >= canvas.width) {
        player1.score += 1;
        scoreSFX.currentTime = 0;
        scoreSFX.play();
        if (player1.score === game.winningScore) {
          game.state = "gameOver";
        } else {
          game.state = "serving";
          game.turn = 1;
        }
      }

  } 

  // Start Screen & Game Over Screen

  drawCanvas();

  if (game.state === "startScreen") {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "60px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PONG", game.canvasMidX, 96);
    difficultyContainer.style.display = "block";
    menuButton.style.display = "none";

  } else if (game.state === "gameOver") {

    ctx.fillStyle = "white";
    ctx.font = "60px Orbitron, sans-serif";
    ctx.textAlign = "center";
    if (player1.score === game.winningScore) {
    ctx.fillText("You Win!", game.canvasMidX, 128);
    } else {
      ctx.fillText("You Lose!", game.canvasMidX, 128);
    }
    pauseContainer.style.display = "block";
    resumeButton.style.display =
      muteButton.style.display = 
      menuButton.style.display = "none";

  } else {

    // Draw canvas


    if (game.state === "pause") {
      menuButton.style.display = "none";
      ctx.fillStyle = "white";
      ctx.font = "60px Orbitron, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Paused", canvas.width / 2, 128);
      resumeButton.style.display = "block";
      muteButton.style.display = "block";
      pauseContainer.style.display = "block";
    } else {
      menuButton.style.display = "block";
    }
    
  }

} // end of gameLoop

function drawCanvas() {

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set Color
  ctx.fillStyle = "white";

  // Draw middle line
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.setLineDash([2, 5]);
  ctx.moveTo(canvas.width/2, 0);
  ctx.lineTo(canvas.width/2, canvas.height);
  ctx.stroke();

  // Draw paddles
  ctx.fillRect(10, player1.top, paddle.width, paddle.height);
  ctx.fillRect(canvas.width - 10 - paddle.width, player2.top, paddle.width, paddle.height);

  // Draw ball
  ctx.fillRect(ball.left, ball.top, ball.size, ball.size);

  // Draw scores
  ctx.font = "25px Orbitron, sans-serif";
  ctx.fillText(player1.score, canvas.width/4, 30);
  ctx.fillText(player2.score, 3*canvas.width/4, 30);

} // end of drawCanvas

window.onload = init;
