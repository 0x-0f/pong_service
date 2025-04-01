"use strict";

import { t } from "../../../modules/locale/localeManager";

let animationFrameId;
let keydownHandler;
let keyupHandler;
let paused = false;

export function render(app, navigate) {
  
  app.innerHTML = `
  <canvas id="pongCanvas" width="800px" height="600px" style="border: 1px solid #FFF">
  Your browser does not support this game.
  </canvas>
  <div class="score-box" style="display: flex; align-items: center; justify-content: center;">
  <h1 id="left-score">0</h1>
  <h1>:</h1>
  <h1 id="right-score">0</h1>
  </div>
  `;
  
  //main 버튼 생성
  const mainBtn = document.createElement('button');
  mainBtn.textContent = `${t('main', "BACK")}`;
  mainBtn.classList.add("btn", "btn-warning", "main-btn");
  mainBtn.addEventListener('click', () => {
    cleanup();
    // history.back();
    navigate('main');
  });
  
  // 버튼을 감싸는 버튼 컨테이너(div) 생성
  const btnContainer = document.createElement('div');
  btnContainer.style.display = "flex";
  btnContainer.style.justifyContent = "center";
  btnContainer.appendChild(mainBtn);
  // app에 추가.
  app.appendChild(btnContainer);

  /* Initialize Game Variables */
  const canvas = document.getElementById('pongCanvas');
  const ctx = canvas.getContext('2d');
  const leftScore = document.getElementById('left-score');
  const rightScore = document.getElementById('right-score');

  const paddleWidth = 12, paddleHeight = 8 * paddleWidth;
  const leftPaddle = { x: 3 * paddleWidth, y: (canvas.height - paddleHeight) / 2, prePos: (canvas.height - paddleHeight) / 2 };
  const rightPaddle = { x: canvas.width - 4 * paddleWidth, y: (canvas.height - paddleHeight) / 2, prePos: (canvas.height - paddleHeight) / 2 };

//   const ballRadius = 10;
  const ballWidth = paddleWidth;
  const ball = { x: (canvas.width - ballWidth) / 2, y: (canvas.height - ballWidth) / 2 };
  const speed = { paddle: 10, ball: { x: 5, y: 0 } };

  let leftPaddleDirection = null, rightPaddleDirection = null;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall(ball);
    drawPaddle(leftPaddle);
    drawPaddle(rightPaddle);

    if (!paused) {
      movePaddle(leftPaddleDirection, rightPaddleDirection);
      moveBall();
    }

    animationFrameId = requestAnimationFrame(draw); // Always keep the loop running
  }

  function drawBall(ball) {
    ctx.fillStyle = '#FFF';
    ctx.fillRect(ball.x, ball.y, ballWidth, ballWidth);
  }

  function drawPaddle(paddle) {
    ctx.fillStyle = '#FFF';
    ctx.fillRect(paddle.x, paddle.y, paddleWidth, paddleHeight);
  }

  function movePaddle(left, right) {    
    if (left === 'up' && leftPaddle.y > 0) leftPaddle.y -= speed.paddle;
    if (left === 'down' && leftPaddle.y < canvas.height - paddleHeight) leftPaddle.y += speed.paddle;
    if (right === 'up' && rightPaddle.y > 0) rightPaddle.y -= speed.paddle;
    if (right === 'down' && rightPaddle.y < canvas.height - paddleHeight) rightPaddle.y += speed.paddle;
  }

  function moveBall() {
    ball.x += speed.ball.x;
    ball.y += speed.ball.y;
    const maxAngle = Math.PI * 8 / 16;
    //한 프레임 당 움직이는 ball의 거리
    const ballSpeed = 10;
    const paddleSpeed = 10;
    const deltaY = paddleSpeed * 0.2;

    // 천장 충돌
    if (ball.y <= 0) {
        speed.ball.y *= -1;
        ball.y *= -1;
    }

    // 바닥 충돌
    if (ball.y >= canvas.height - ballWidth) {
        speed.ball.y *= -1;
        ball.y -= 2 * ((ball.y + ball.width)- canvas.height); // Correct position
    }
    
    // 왼쪽 패들 충돌
    if (2 * paddleWidth < ball.x && ball.x <= 4 * paddleWidth) {
        if (leftPaddle.y < ball.y + ballWidth && leftPaddle.y + paddleHeight > ball.y) {
            const leftPaddleLine = 4 * ball.width;
            // 계산상 원래 공이 충돌해서 반사되어야 할 패들 지점을, 넘어선 시간
            const dt = (ball.x - leftPaddleLine) / speed.ball.x;
            //보간법
            //dt 만큼의 시간(패들의 옆면 x좌표에 공이 도달한 이후의 시간)동안 공과 패들이 이동한 거리를 보간하여, 공이 패들의 옆면에 충돌했는지 알아본다
            const interpolatedBallPos = ball.y - speed.ball.y * dt;
            const interpolatedPaddlePos = leftPaddle.y - (leftPaddle.y - leftPaddle.prePos) * dt ;
            
            //패들 옆면 충돌 시
            if (interpolatedPaddlePos < interpolatedBallPos + ballWidth && interpolatedBallPos < interpolatedPaddlePos + paddleHeight) {
                // 공이 패들의 중앙으로부터 어느지점에 맞았나를 정규화하여 반사각을 결정
                const angle = maxAngle * ((interpolatedBallPos + (ballWidth / 2)) - (interpolatedPaddlePos + (paddleHeight / 2))) / (4.5 * paddleWidth);
                speed.ball.x = ballSpeed * Math.cos(angle);
                speed.ball.y = ballSpeed * Math.sin(angle);
                // 한 프레임 후의 공의 위치를 보간하여 적용
                ball.x = leftPaddleLine + speed.ball.x * dt;
                ball.y = interpolatedBallPos + speed.ball.y * dt;
            }  else if (interpolatedBallPos < interpolatedPaddlePos) { //패들 위쪽 충돌 시 
                ball.y = leftPaddle.y - ballWidth;
                if (0 < speed.ball.y) {
                    speed.ball.y *= -1; //  위에서 오던공 -> 정반사
                } else {
                    speed.ball.y -= deltaY; // 아래서 오던공 -> 약간의 속력을 추가
                }
            }  else if (interpolatedPaddlePos + paddleHeight < interpolatedBallPos + ballWidth) { //패들 아래쪽 충돌 시
                ball.y = leftPaddle.y + paddleHeight;
                if ( speed.ball.y < 0) {
                    speed.ball.y *= -1; // 아래에서 오던공 -> 정반사
                }
                else {
                    speed.ball.y += deltaY; // 위에서 오던공 -> 약간의 속력을 추가
                }
            }
        }
    }
    
    
    //오른쪽 패들 충돌
    const rightPaddleLine = canvas.width - 4 * paddleWidth;
    if (canvas.width - 5 * paddleWidth < ball.x && ball.x < canvas.width - 3 * paddleWidth) {
        if (rightPaddle.y < ball.y + ballWidth && rightPaddle.y + paddleHeight > ball. y) {
            const dt = ((ball.x + ballWidth) - rightPaddleLine) / speed.ball.x;
            const interpolatedBallPos = ball.y - speed.ball.y * dt;
            const interpolatedPaddlePos = rightPaddle.y - (rightPaddle.y - rightPaddle.prePos) * dt;
            if (interpolatedPaddlePos < interpolatedBallPos + ballWidth && interpolatedBallPos < interpolatedPaddlePos + paddleHeight) {
                const angle = maxAngle * ((interpolatedBallPos + (ballWidth / 2)) - (interpolatedPaddlePos + (paddleHeight / 2))) / (4.5 * paddleWidth);
                speed.ball.x = ballSpeed * Math.cos(angle + Math.PI);
                speed.ball.y = ballSpeed * Math.sin(angle);
                ball.x = rightPaddleLine - ballWidth + speed.ball.x * dt;
                ball.y = interpolatedBallPos + speed.ball.y * dt;
            } else if (interpolatedBallPos < interpolatedPaddlePos) { //패들 위쪽 충돌 시
                ball.y = rightPaddle.y - ballWidth;
                if (0 < speed.ball.y) {
                    speed.ball.y *= -1; //  위에서 오던공 -> 정반사
                } else {
                    speed.ball.y -= deltaY; // 아래서 오던공 -> 약간의 속력을 추가
                }
            } else if (interpolatedPaddlePos + paddleHeight < interpolatedBallPos + ballWidth) {
                ball.y = rightPaddle.y + paddleHeight;
                if (speed.ball.y < 0) {
                    speed.ball.y *= -1; // 아래에서 오던공 -> 정반사
                } else {
                    speed.ball.y += deltaY; // 위에서 오던공 -> 약간의 속력을 추가
                }
            }
        }
    }


    // // Ball hits the top or bottom wall
    // if (ball.y < ballRadius) {
    //   ball.y = ballRadius; // Correct position
    //   speed.ball.y = -speed.ball.y; // Reverse direction
    // } else if (ball.y > canvas.height - ballRadius) {
    //   ball.y = canvas.height - ballRadius; // Correct position
    //   speed.ball.y = -speed.ball.y; // Reverse direction
    // }

    // // Ball hits the left wall
    // if (ball.x - ballRadius <= 0) {
    //   if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + paddleHeight) {
    //     increaseSpeed();
    //     reflectBall(ball, leftPaddle, true);
    //   } else {
    //     rightScore.textContent = +rightScore.textContent + 1;
    //     pauseGame(); // Pause the game
    //     checkWin("Right");
    //   }
    // }

    // // Ball hits the right wall
    // if (ball.x + ballRadius >= canvas.width) {
    //   if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + paddleHeight) {
    //     increaseSpeed();
    //     reflectBall(ball, rightPaddle, false);
    //   } else {
    //     leftScore.textContent = +leftScore.textContent + 1;
    //     pauseGame(); // Pause the game
    //     checkWin("Left");
    //   }
    // }
  }

  function pauseGame() {
    paused = true; // Set paused state
    window.addEventListener('keydown', resumeGameOnce); // Wait for a keypress to resume
  }

  function resumeGameOnce(e) {
    if (e.key === ' ') {
      paused = false; // Clear paused state
      window.removeEventListener('keydown', resumeGameOnce); // Remove the resume listener
      resetGame(); // Reset the game for the next round
    }
  }

  function reflectBall(ball, paddle, isLeftPaddle) {
    const paddleEdgeX = isLeftPaddle ? paddle.x + paddleWidth : paddle.x;
    const hitPoint = (ball.y - (paddle.y + paddleHeight / 2)) / (paddleHeight / 2);
    const maxBounceAngle = Math.PI / 4; 
    const bounceAngle = hitPoint * maxBounceAngle;
    const speedMagnitude = Math.sqrt(speed.ball.x ** 2 + speed.ball.y ** 2);

    speed.ball.x = speedMagnitude * Math.cos(bounceAngle) * (isLeftPaddle ? 1 : -1);
    speed.ball.y = speedMagnitude * Math.sin(bounceAngle);

    // Adjust ball position to ensure it reflects from the edge
    ball.x = paddleEdgeX + (isLeftPaddle ? ballRadius : -ballRadius);
  }

  function increaseSpeed() {
    const speedIncrement = 1.1;
    speed.ball.x *= speedIncrement;
    speed.ball.y *= speedIncrement;
  }

  function checkWin(winner) {
    if (+leftScore.textContent === 5 || +rightScore.textContent === 5) {
      alert(`${winner} wins!`);
      navigate('main');
      cleanup(); // Stop the game
      location.reload();
    }
  }

  function resetGame() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    leftPaddle.y = (canvas.height - paddleHeight) / 2;
    rightPaddle.y = (canvas.height - paddleHeight) / 2;
    speed.ball.x = Math.random() < 0.5 ? -5 : 5;
    speed.ball.y = Math.random() < 0.5 ? -5 : 5;
  }

  keydownHandler = (e) => {
    switch (e.key) {
      case 'w': leftPaddleDirection = 'up'; break;
      case 's': leftPaddleDirection = 'down'; break;
      case 'ArrowUp': rightPaddleDirection = 'up'; break;
      case 'ArrowDown': rightPaddleDirection = 'down'; break;
    }
  };

  keyupHandler = (e) => {
    switch (e.key) {
      case 'w': leftPaddleDirection = null; break;
      case 's': leftPaddleDirection = null; break;
      case 'ArrowUp': rightPaddleDirection = null; break;
      case 'ArrowDown': rightPaddleDirection = null; break;
    }
  };

  window.addEventListener('keydown', keydownHandler);
  window.addEventListener('keyup', keyupHandler);

  function cleanup() {
    cancelAnimationFrame(animationFrameId); // Stop the game loop
    window.removeEventListener('keydown', keydownHandler);
    window.removeEventListener('keyup', keyupHandler);
  }

  window.onpopstate = () => {
    window.location.reload();
  }

  draw(); // Start the game
}
