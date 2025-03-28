"use strict";

import { t } from '/src/modules/locale/localeManager.js';
import rock from '/assets/rock.png';
import paper from '/assets/paper.png';
import scissors from '/assets/scissors.png';

export function render(app, navigate) {
    
    
    app.innerHTML = `
    ${t('loading', 'loading')}
    `;
    fetch('/api/auth/user_info/', {
        credentials: 'include',
        
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to fetch user_info');
    }).then(data => {
        app.innerHTML = ``;
        const headButton = document.createElement('button');
        headButton.classList.add('btn', 'btn-warning', 'main-btn');
        headButton.textContent = 'Game history';
        app.appendChild(headButton);
        drawPongHistory(app, data);
        headButton.addEventListener('click', () => {
            if (document.getElementsByClassName('rps-result-img').length > 0) {
                drawPongHistory(app, data);
            }
            else {
                drawRPSHistory(app, data);
            }
        });

    })
}

function RPSJudge (yourChoice, opponentChoice) {
    if (yourChoice === opponentChoice) {
        return 'DRAW';
    }
    else if (yourChoice === 'rock') {
        if (opponentChoice === 'scissors') {
            return 'WIN';
        }
        return 'LOSE';
    }
    else if (yourChoice === 'scissors') {
        if (opponentChoice === 'paper') {
            return 'WIN';
        }
        return 'LOSE';
    }
    else if (yourChoice === 'paper'){ 
        if (opponentChoice === 'rock') {
            return 'WIN';
        }
        return 'LOSE';
    }
    return 'ERROR';
}

function getImagePath(item) {
    if (item === 'rock') {
        return rock;
    }
    else if (item === 'scissors') {
        return scissors;
    }
    else if (item === 'paper') {
        return paper;
    }
    else
        throw new Error('Invalid item');
}

function drawRPSMatches(data, app) {
    const oldGameResult = document.getElementById('gameResult');
    if (oldGameResult) {
        oldGameResult.remove();
    }

    const gameResult = document.createElement('div');
    gameResult.setAttribute('id', 'gameResult');
    gameResult.className = 'result';

    let leftResultImgs = document.createElement('div');
    let rightResultImgs = document.createElement('div');
    let resultText = document.createElement('p');
    resultText.textContent = '';

    for (let i = data.length - 1; 0 <= i; i--) {
        const items = data[i];
        
        if (items.rematch === false) { // if not rematch, print the result
            const leftDiv = document.createElement('div');
            leftDiv.className = 'result-left-div';
            const leftDivText = document.createElement('div');
            leftDivText.textContent = 'You';
            leftDiv.appendChild(leftDivText);
            const leftDivImg = document.createElement('img');
            leftDivImg.src = getImagePath(items.your_choice);
            leftDivImg.className = 'rps-result-img';
            leftResultImgs.insertBefore(leftDivImg, leftResultImgs.firstChild);
            leftDiv.appendChild(leftResultImgs);
            leftResultImgs = document.createElement('div');
            gameResult.appendChild(leftDiv);

            const centerDiv = document.createElement('div');
            centerDiv.className = 'result-center-div';
            centerDiv.textContent = items.date;
            if (resultText.textContent === '') {
                resultText.textContent = RPSJudge(items.your_choice, items.opponent_choice);
            }
            centerDiv.appendChild(resultText);
            resultText = document.createElement('p');
            resultText.textContent = '';
            gameResult.appendChild(centerDiv);

            const rightDiv = document.createElement('div');
            rightDiv.className = 'result-right-div';
            const rightDivText = document.createElement('div');
            rightDivText.textContent = items.opponent_name;
            rightDiv.appendChild(rightDivText);
            const rightDivImg = document.createElement('img');
            rightDivImg.src = getImagePath(items.opponent_choice);
            rightDivImg.className = 'rps-result-img';
            rightResultImgs.insertBefore(rightDivImg, rightResultImgs.firstChild);
            rightDiv.appendChild(rightResultImgs);
            rightResultImgs = document.createElement('div');
            gameResult.appendChild(rightDiv);
        }
        else { // rematch
            const leftDivImg = document.createElement('img');
            leftDivImg.src = getImagePath(items.your_choice);
            leftDivImg.className = 'rps-result-img';
            leftResultImgs.insertBefore(leftDivImg, leftResultImgs.firstChild);

            if (resultText.textContent === '') {
                resultText.textContent = RPSJudge(items.your_choice, items.opponent_choice);
            }

            const rightDivImg = document.createElement('img');
            rightDivImg.src = getImagePath(items.opponent_choice);
            rightDivImg.className = 'rps-result-img';
            rightResultImgs.insertBefore(rightDivImg, rightResultImgs.firstChild);
        }
    }
    app.appendChild(gameResult);
}

function drawRPSHistory(app, data) {
    const userId = data.user_id;
    const apiUrl = `/api/rps/${userId}/history/`;
    fetch(apiUrl).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to fetch history');
    }).then(data => {
        // app.getElementsByTagName('button')[0].textContent = 'Hidden Game History';
        drawRPSMatches(data, app);

    }).catch(error => {
        console.error('Error fetching history:', error);
    });
}

function drawPongHistory(app, data) {
    const userId = data.user_id;
    const apiUrl = `/api/pong/${userId}/history/`;
    fetch(apiUrl).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Failed to fetch history');
    }).then(data => {
        // app.getElementsByTagName('button')[0].textContent = 'Game History';
        const oldGameResult = document.getElementById('gameResult');
        if (oldGameResult) {
            oldGameResult.remove();
        }
        const gameResult = document.createElement('div');
        gameResult.setAttribute('id', 'gameResult');
        gameResult.className = 'result';
        
        // left, center, right item 생성
        for (let i = data.length - 1; 0 <= i; i--) {
            const items = data[i];
            const yourScore = items.your_score;
            const opponentScore = items.opponent_score;

            const leftDiv = document.createElement('div');
            leftDiv.className = 'result-left-div';
            const leftDivText = document.createElement('div');
            leftDivText.className = 'wrap';
            leftDivText.textContent = 'You\n' + String(yourScore);
            leftDiv.appendChild(leftDivText);
            gameResult.appendChild(leftDiv);

            const centerDiv = document.createElement('div');
            centerDiv.className = 'result-center-div';
            const centerDivText = document.createElement('div');
            centerDivText.className = 'wrap';
            centerDivText.textContent = items.date + '\n';
            if (yourScore > opponentScore) {
                centerDivText.textContent += 'WIN\n';
            } else {
                centerDivText.textContent += 'LOSE\n';
            }
            centerDiv.appendChild(centerDivText);
            gameResult.appendChild(centerDiv);

            const rightDiv = document.createElement('div');
            rightDiv.className = 'result-right-div';
            const rightDivText = document.createElement('div');
            rightDivText.className = 'wrap';
            rightDivText.textContent = items.opponent_name + '\n' + opponentScore;
            rightDiv.appendChild(rightDivText);
            gameResult.appendChild(rightDiv);
        }
        app.appendChild(gameResult);

    }).catch(error => {
        console.error('Error fetching history:', error);
    });

    
}