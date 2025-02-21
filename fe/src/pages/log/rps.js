import { t } from '/src/modules/locale/localeManager.js';

export function render(app, navigate) {
	app.innerHTML = `
		${t('loading', 'loading')}
	`

	fetch('/api/auth/user_info/', {
		credentials: 'include',
	}).then(response => {
		if (response.ok) {
			return response.json();
		}
		throw new Error('Failed to fetch intra_id');
	}).then(data => {
		const userId = data.user_id;
		const apiUrl = `/api/rps/${userId}/history/`;
		fetch(apiUrl).then(response => {
			if (response.ok) {
				return response.json();
			}
			throw new Error('Failed to fetch history');
		}).then(data => {
            // // 변경 코드
            // app.innerHTML = `
            //     <p>RPS History</p>
            // `;
            // const gameResult = document.createElement('div');
            // gameResult.className = 'result';

            // // left, center, right item 생성
            // let i = data.length - 1;
            // while (0 <= i) {
            //     const nextMatchIdx = findNextMatchIdx(i, data);
                
            //     const items = data[i];

            //     // left item : your choices
            //     const leftItem = document.createElement('div');
            //     leftItem.className = 'result-left-item';
            //     leftItem.textContent = 'You\n';
            //     for (let j = i; nextMatchIdx < j; --j) {
            //         const yourChoice = data[j].your_choice;
            //         const yourChoiceImg = document.createElement('img');
            //         yourChoiceImg.src = getImagePath(yourChoice);
            //     }
            //     gameResult.appendChild(leftItem);

            //     // center item : date, match result
            //     const centerItem = document.createElement('div');
            //     centerItem.className = 'result-center-item';
            //     centerItem.textContent = items.date + '\n' + RPSJudge(data[nextMatchIdx + 1].your_choice, data[nextMatchIdx + 1].opponent_choice);
            //     gameResult.appendChild(centerItem);

            //     // right item : opponent choices
            //     const rightItem = document.createElement('div');
            //     rightItem.className = 'result-right-item';
            //     rightItem.textContent = items.opponent_name + '\n';
            //     for (let j = i; nextMatchIdx < j; --j) {
            //         const opponentChoice = data[j].opponent_choice;
            //         const opponentChoiceImg = document.createElement('img');
            //         opponentChoiceImg.src = getImagePath(opponentChoice);
            //     }
            //     gameResult.appendChild(rightItem);
                
            //     i = nextMatchIdx;
            // }

            // 변경 전 코드
			app.innerHTML = 'orange';
			// for (let i = 0; i < data.length; i++) {
			// 	const item = data[i];
			// 	// Generate HTML for the current item
			// 	const htmlContent = `
			// 	  <div class="game-result">
			// 		<div class="left-tab">
			// 			<p class="gdate">Date: ${item.date}</p>
			// 			<p class="gopp">vs ${item.opponent_name || 'None'}</p>
			// 		</div>

			// 	  </div>
			// 	`;
			// 	// Append the HTML to the app element
			// 	app.insertAdjacentHTML('beforeend', htmlContent);
			//   }
		}).catch(error => {
			console.error('Error fetching history:', error);
		});
	}).catch(error => {
		console.error('eeeeeeeeeppppppyyy ', error);
	});
}

function RPSJudge (yourChoice, opponentChoice) {
    if (yourChoicopponent= opponentChoice) {
        opponentChoice === 'DRAW';
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
    switch (item) {
        case "rock": return rock;
        case "paper": return paper;
        case "scissors": return scissors;
        default: return "";
    }
}

function findNextMatchIdx(i, data) {
    let j = i;
    while (0 <= j - 1 && data[j - 1].rematch === true) {
        --j;
    }
    return j;
}

