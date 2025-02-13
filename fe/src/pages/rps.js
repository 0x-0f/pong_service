"use strict";

import { t } from '/src/modules/locale/localeManager.js';
import rock from '/assets/rock.png';
import paper from '/assets/paper.png';
import scissors from '/assets/scissors.png';

let userID = null;
let userName = null;
let wss = null;
let matchWss = null;
let choice = "";
let countdownInterval = null;
let matchUrl = null;

export function render(app, navigate) {
    // 초기 렌더링
    renderStartPage(app, navigate);
    cleanupAllWebSockets();
}

/** 1) 최초 화면: "start matching" 버튼만 있는 화면 */
function renderStartPage(app, navigate) {

    app.innerHTML = "";
    const waitingText = document.createElement("div");
    waitingText.textContent = t('rps-watingOpponent', "WAITING for opponent...");
    waitingText.className = "rps-waiting-text";


    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = `${t('main', "BACK")}`;

    cancelBtn.classList.add("btn", "btn-danger", "rps-btn");
    
    fetch('/api/auth/user_info', {
        credentials: 'include',
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
    }).then(data => {
        userID = String(data.user_id);
        userName = data.user_name;
        startMatching(app, navigate);
    });

    cancelBtn.addEventListener("click", () => {
        cleanupAllWebSockets();
        // navigate('main');
        history.back();
    });

    app.appendChild(waitingText);
    app.appendChild(cancelBtn);
}

/** 3) 게임 시작 화면 (가위바위보 선택) */
function renderRpsGamePage(app) {
    // 기존 화면 비우기
    app.innerHTML = "";

    // 1) 카운트다운 영역
    const counterDiv = document.createElement("div");
    counterDiv.className = "rps-counter"; 
    counterDiv.textContent = "5";  // 초기 카운트 10

    // 2) 3열 그리드 (가위바위보 선택 영역)
    const gridContainer = document.createElement("div");
    gridContainer.className = "rps-grid-container";

    // 3) 가위바위보 항목
    const items = ["rock", "paper", "scissors"];
    let selectedHighlightDiv = null; // 현재 선택 표시(div) 추적

    items.forEach(item => {
    // 3-1. 각 셀(각 그림용)
    const cellDiv = document.createElement("div");
    cellDiv.className = "rps-item";
    // .rps-item:hover { background-color: #333; } → CSS에서 호버링 처리

    // 3-2. 이미지
    const img = document.createElement("img");
    img.className = "rps-img";  // 크기 120x120
    img.src = getImagePath(item);

    // 3-3. 선택 표시(하얀색 패)
    const highlightBar = document.createElement("div");
    highlightBar.className = "rps-select-highlight"; 
    // 기본 display: none (CSS에서)

    // 3-4. 클릭 이벤트: 기존 선택 해제 → 새 선택 표시
    cellDiv.addEventListener("click", () => {
        if (selectedHighlightDiv) {
        selectedHighlightDiv.style.display = "none"; // 기존 선택 숨김
        }
        highlightBar.style.display = "block"; // 새 선택 표시
        selectedHighlightDiv = highlightBar;
        choice = item; // 전역 변수 choice 갱신
    });

    // 3-5. 구조 조립
    cellDiv.appendChild(img);
    cellDiv.appendChild(highlightBar);
    gridContainer.appendChild(cellDiv);
    });

    // 4) 10초 미선택 시 랜덤처리 안내 문구
    const warningText = document.createElement("div");
    warningText.className = "rps-warning-text"; 
    warningText.textContent = t('rps-selection', "SELECT in 10 seconds");
    //   warningText.textContent = "If you do not select in 10 seconds, a random selection will be made.";

    // 5) 화면에 요소들 추가
    app.appendChild(counterDiv);
    app.appendChild(gridContainer);
    app.appendChild(warningText);

    // 6) 5초 카운트다운
    let count = 5;
    countdownInterval = setInterval(() => {
        count--;
        counterDiv.textContent = String(count);

        if (count <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;

            // 아직 아무것도 클릭 안했다면 랜덤 지정
            if (!choice) {
            choice = getRandomChoice();
            }

            // 서버 전송 후 "응답 대기" 페이지로 이동
            sendChoiceToServer(choice);
            renderWaitingResultPage(app);
        }
    }, 1000);
}

/** 4) 응답 대기 화면 */
function renderWaitingResultPage(app) {
    app.innerHTML = "";

    const text = document.createElement("div");
    text.textContent = t('rps-waitingResult', "WAITING for opponent's choice...");
    text.className = "rps-waiting-result";
    app.appendChild(text);
}

/** 5) 최종 결과 화면 */
function renderResultPage(app, navigate, result, opponentChoice, opponentName) {
    app.innerHTML = "";

    // 결과 문구
    const resultText = document.createElement("div");
    resultText.className = "rps-result-text";
    switch (result) {
        case "win":
        resultText.textContent = t('rps-win', "YOU WIN!");
        break;
        case "lose":
        resultText.textContent = t('rps-lose', "YOU LOSE...");
        break;
        case "draw":
        resultText.textContent = t('rps-draw', "DRAW");
        case_draw(app, navigate);
        break;
        default:
        resultText.textContent = t('rps-unknown', "UNKNOWN");
    }
    app.appendChild(resultText);

    // 두 명의 선택을 보여줄 그리드
    const resultGrid = document.createElement("div");
    resultGrid.className = "rps-result-grid";

    // 내 쪽
    const mySide = document.createElement("div");
    mySide.classList.add("rps-side", "rps-my-side");

    const myPaddle = document.createElement("div");
    myPaddle.className = "rps-my-paddle";

    const myIdDiv = document.createElement("div");
    myIdDiv.textContent = userName;

    const myImg = document.createElement("img");
    myImg.className = "rps-img";
    myImg.src = getImagePath(choice);

    mySide.appendChild(myPaddle);
    mySide.appendChild(myIdDiv);
    mySide.appendChild(myImg);

    // 상대방 쪽
    const oppSide = document.createElement("div");
    oppSide.classList.add("rps-side", "rps-opp-side");

    const oppImg = document.createElement("img");
    oppImg.className = "rps-img";
    oppImg.src = getImagePath(opponentChoice);

    const oppIdDiv = document.createElement("div");
    oppIdDiv.textContent = opponentName;

    const oppPaddle = document.createElement("div");
    oppPaddle.className = "rps-opp-paddle";

    oppSide.appendChild(oppImg);
    oppSide.appendChild(oppIdDiv);
    oppSide.appendChild(oppPaddle);

    resultGrid.appendChild(mySide);
    resultGrid.appendChild(oppSide);

    app.appendChild(resultGrid);

    // main 버튼인데 임시방편으로 Back 버튼으로 대체.popstate 개념 이해 후 수정 필요
    const mainBtn = document.createElement("button");
    mainBtn.textContent = `${t('main', "BACK")}`;
    mainBtn.classList.add("btn", "btn-warning", "main-btn");

    mainBtn.addEventListener("click", () => {
        history.back();
        // navigate("main");
    });

    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "center";
    btnContainer.appendChild(mainBtn);
    app.appendChild(btnContainer);
}

function case_draw(app, navigate) {
    if (!matchUrl)
        return;
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "retry?";
    retryBtn.classList.add("btn", "btn-warning", "rps-main-btn");

    retryBtn.addEventListener("click", () => {
        connectMatchWebSocket(app, navigate, matchUrl, "/re");
    });

    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.justifyContent = "center";
    btnContainer.appendChild(retryBtn);
    app.appendChild(btnContainer);
}

/** --- 이하 웹소켓 로직 및 유틸 함수는 기존과 동일 --- **/

function startMatching(app, navigate) {
    wss = new WebSocket(`wss://${window.location.hostname}/ws/rps/join/${userID}`);
    wss.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.match_url) {
            cleanupWss(wss);
            connectMatchWebSocket(app, navigate, data.match_url, "");
            matchUrl = data.match_url;
        }
    };
    wss.onerror = (err) => console.error("[Matching WSS] Error:", err);
}

async function connectMatchWebSocket(app, navigate, matchUrl, rematch) {
    app.innerHTML = "";

    const waitingText = document.createElement("div");
    waitingText.textContent = t('rps-gameMatched', "GAME matched! Waiting for opponent...");
    waitingText.style.fontSize = "2em"; 

    app.appendChild(waitingText);

    const splitted = matchUrl.split("/");
    const matchName = splitted[splitted.length - 2];
    
    matchWss = new WebSocket(`wss://${window.location.hostname}${matchUrl}${userID}${rematch}`);
    matchWss.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.status === "start") {
            renderRpsGamePage(app);
        } else if (data.status === "network_error") {
            console.error("[Match WSS] Network error:", data.error);
            cleanupAllWebSockets();
            app.innterHTML = "";
            app.innerHTML = `
                <h1>${t('LAN', 'Opponent mad at you')}</h1>
                <button id="back">Back</button>
                `;
                document.getElementById('back').addEventListener('click', () => {
                    window.location.href = '/main';
                });
        }
        else if (data.status === "finished") {
            // const opponentName = getOpponentNameFromMatchName(matchName);
            const opponentName = await getOpponentNameFromMatchName(matchName);
            renderResultPage(app, navigate, data.result, data.opponent_choice, opponentName);
            cleanupAllWebSockets();
        }
    };
}

function sendChoiceToServer(myChoice) {
    if (matchWss && matchWss.readyState === WebSocket.OPEN) {
        const payload = { choice: myChoice };
        matchWss.send(JSON.stringify(payload));
    }
}

function cleanupAllWebSockets() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    if (wss) {
        cleanupWss(wss);
        wss = null;
    }
    if (matchWss) {
        cleanupWss(matchWss);
        matchWss = null;
    }
    choice = "";
}

function cleanupWss(socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
}

// async/await 적용
async function getOpponentNameFromMatchName(matchName) {
    const parts = matchName.split("_");
    // 내 ID가 아닌 것(즉, 상대방 ID)을 찾는다
    const opponentId = parts.find(id => id !== userID);
    
    // 비동기 통신으로 상대방 정보 가져옴
    const response = await fetch(`/api/users/${opponentId}`, {
        credentials: 'include'
    });
    
    if (!response.ok) {
        console.error('Failed to fetch user info');
        return ;
    }
    const data = await response.json();
    return data.user_name;
}

function getImagePath(item) {
    switch (item) {
        case "rock": return rock;
        case "paper": return paper;
        case "scissors": return scissors;
        default: return "";
    }
}

function getRandomChoice() {
    const rps = ["rock", "paper", "scissors"];
    const idx = Math.floor(Math.random() * rps.length);
    return rps[idx];
}

window.addEventListener('popstate', function () {
    cleanupAllWebSockets();
});