"use strict";

import { t } from '/src/modules/locale/localeManager.js';
import { getWebSocket, setWebSocket } from '/src/App.js';

let wss = null;


function waitingRoom(app) {
    app.innerHTML = `
    <div class="grid">
        <div class="grid-item-left" id="you">${t('you', 'You')}</div>
        <div class="grid-item-right" id="rival">${t('wait_part', 'Waiting for participations...')}</div>
    </div>
    `
    //main 버튼 생성
    const mainBtn = document.createElement('button');
    mainBtn.textContent = `${t('main', "BACK")}`;
    mainBtn.classList.add("btn", "btn-warning", "main-btn");
    mainBtn.addEventListener('click', () => {
    cleanup();
    navigate('main');
    // history.back();
    });
    
    // 버튼을 감싸는 버튼 컨테이너(div) 생성
    const btnContainer = document.createElement('div');
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "center";
    btnContainer.appendChild(mainBtn);
    // app에 추가.
    app.appendChild(btnContainer);

}

// // send key input to the server at 60fps
// function sendKeyInput60fps(wss, key) {
//     if (!wss) return;
//     wss.send(JSON.stringify({ "move": key }));
    

// }

async function gameRoom(app, match_url, userID, userName, navigate) {
    document.addEventListener("keydown", function (e) {
    if (!wss) return;

    // w -> 위로 이동, s -> 아래로 이동
    if (e.key === "w" || e.key === "ArrowUp") {
        // {"move":["up"]} 전송
        wss.send(JSON.stringify({ "move" : "up" }));
    } else if (e.key === "s" || e.key === "ArrowDown") {
        // {"move":["down"]} 전송
        wss.send(JSON.stringify({ "move" : "down" }));
    }
    });

    document.addEventListener("keyup", function (e) {
    if (!wss) return;

    // w -> 위로 이동, s -> 아래로 이동
    if (e.key === "w" || e.key === "ArrowUp" || e.key === "s" || e.key === "ArrowDown") {
        // {"move":["stop"]} 전송
        wss.send(JSON.stringify({ "move" : "stop" }));
    }
    });


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
        // history.back();ㄹㄹ
        navigate('main');
    });
    
    // 버튼을 감싸는 버튼 컨테이너(div) 생성
    const btnContainer = document.createElement('div');
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "center";
    btnContainer.appendChild(mainBtn);
    // app에 추가.
    app.appendChild(btnContainer);
    
    wss = new WebSocket(`wss://${window.location.hostname}${match_url}${userID}`);
    setWebSocket(wss);
    
    let gameState;
    
    const parts = match_url.split('/');
    let lastPart = parts[parts.length - 2];
    const splits = lastPart.split('_');
    for (let i = 0; i < splits.length; i++) {
        if (splits[i] === userID) {
            splits[i] = userName;
        } else {
            const response = await fetch(`/api/users/${splits[i]}`, {
                credentials: 'include',
            })
            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }
            const data = await response.json();
            splits[i] = data.user_name;
        }
    }
    lastPart = splits.join('_');
    
    
    const [leftUser, rightUser] = lastPart.split('_');

	wss.onmessage = function(e) {
        try {
            gameState = JSON.parse(e.data); 
        }
        catch (error) {
            console.error('Error parsing JSON:', error);
            return;
        }
        console.log(gameState);
        if (gameState.status == 'saved') {
            app.innerHTML = `
            <h1>Game Over</h1>
            <h2>${gameState.left_score > gameState.right_score ? leftUser : rightUser } wins!</h2>
            <button id="back">Back</button>
            `;
            document.getElementById('back').addEventListener('click', () => {
                window.location.href = '/main';
            });
        } else if (gameState.status == 'disconnected') {
            app.innerHTML = `
            <h1>${t('LAN', 'Opponent mad at you.')}</h1>
            <h2>${gameState.left_score > gameState.right_score ? leftUser : rightUser} wins!</h2>
            <button id="back">Back</button>
            `;
            document.getElementById('back').addEventListener('click', () => {
                window.location.href = '/main';
            });
        } else if (gameState.status == 'network_error') {
            app.innerHTML = `
            <h1>${t('LAN', 'Opponent mad at you.')}</h1>
            <button id="back">Back</button>
            `;
            document.getElementById('back').addEventListener('click', () => {
                window.location.href = '/main';
            });
        }
        else {
            drawGameState(gameState, leftUser, rightUser);
        }
	}

    // // debug
    // wss.onclose = function() {
    //     console.log('WEBSOCKET CLOSED');
    // }

	function drawGameState(gameState, leftUser, rightUser) {
        const ball_width = 12;
        // console.log('drawGameState');
		if (!gameState) return;
		const canvas = document.getElementById('pongCanvas');
  		const ctx = canvas.getContext('2d');
  		const leftScore = document.getElementById('left-score');
  		const rightScore = document.getElementById('right-score');

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillRect(
            gameState.ball_x, 
            gameState.ball_y, 
            ball_width,
            ball_width
        );
		ctx.fillStyle = 'white';
		ctx.fill();
		ctx.closePath();

		ctx.fillStyle = 'white';
		ctx.fillRect(
			ball_width * 3,
			gameState.left_paddle,
			ball_width,
			ball_width * 8
		);
		ctx.fillRect(
			canvas.width - ball_width * 4,
			gameState.right_paddle,
			ball_width,
			ball_width * 8
		);

        // const parts = match_url.split('/');
        // const lastPart = parts[parts.length - 2];
        // const [leftUser, rightUser] = lastPart.split('_');

		ctx.fillStyle = 'white';
		ctx.font = '20px DOSGothic';
		ctx.fillText(leftUser, 20, 30);
		ctx.fillText(rightUser, canvas.width - 120, 30);

		leftScore.innerText = gameState.left_score;
		rightScore.innerText = gameState.right_score;
	}

    if (gameState.status == 'saved') {
        app.innerHTML = `
        <h1>Game Over</h1>
        <h2>${gameState.left_score > gameState.right_score ? leftUser : rightUser} wins!</h2>
        <button id="back">Back</button>
        `;
        document.getElementById('back').addEventListener('click', () => {
            window.location.href = '/main';
        });
    } else if (gameState.status == 'disconnected') {
        app.innerHTML = `
        <h1>상대방이 랜뽑했습니다.</h1>
        <h2>${gameState.left_score > gameState.right_score ? leftUser : rightUser} wins!</h2>
        <button id="back">Back</button>
        `;
        document.getElementById('back').addEventListener('click', () => {
            window.location.href = '/main';
        });
    }


}

export function render(app, navigate) {
    waitingRoom(app);

    let userID = null; // To store the fetched user ID
    let userName = null; // To store the fetched user name

    // Fetch user name from the API
    fetch(`https://${window.location.hostname}/api/auth/user_info/`, {
        credentials: 'include',
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to fetch user_info');
        })
        .then(data => {
            userID = data.user_id;
            userName = data.user_name;

            // Dynamically determine the WebSocket protocol based on the current protocol
            wss = new WebSocket(`wss://${window.location.hostname}/ws/pong/join/${userID}`);
            setWebSocket(wss);

            wss.onmessage = function (e) {
                const data = JSON.parse(e.data);
                const match_url = data.match_url;

                // Transition to the game room
                gameRoom(app, match_url, userID, userName, navigate);
            };

            wss.onerror = function (e) {
                console.error('WebSocket error:', e);
            };
        })
        .catch(error => {
            console.error('Error fetching intra ID:', error);
        });
}

window.addEventListener('popstate', function () {
    console.log(wss)
    if (wss) {
        wss.onclose = function () {}; // Avoid triggering additional events
        wss.close();
    }
});

