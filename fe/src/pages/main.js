import { t } from '/src/modules/locale/localeManager.js';
import raccoon from '/assets/raccoon.gif';

export function render(app, navigate) {
    app.innerHTML = `
        <div class="grid">
            <div class="grid-item-left" id="offline-ai">${t('localAI', '1 PLAYER')}</div>
            <div class="grid-item-right" id="offline-2p">${t('local1v1', '2 PLAYERS')}</div>
            <div class="grid-item-left" id="online-2p">${t('online1v1', 'ONLINE MATCH')}</div>
            <div class="grid-item-right-transparent" id="rps">${t('rps', 'HIDDEN GAME')}</div>
        </div>
    `;

    document.getElementById('online-2p').addEventListener('click', () => navigate('game/online/2p'));
    // document.getElementById('offline-4p').addEventListener('click', () => navigate('game/offline/4p'));
    document.getElementById('offline-2p').addEventListener('click', () => navigate('game/offline/2p'));
    document.getElementById('offline-ai').addEventListener('click', () => navigate('game/offline/ai'));
    // document.getElementById('scoreboard').addEventListener('click', () => navigate('log/main'));
    document.getElementById('rps').addEventListener('click', () => navigate('rps'));

    const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'b', 'a'
      ];

      const ourFriendlyRaccoon = [
        'c', 'c', 'h', 'i', 'c', 'o', 't', 'e'
      ];

      let konamiInput = [];
      let raccoonInput = [];
      const maxKonamiLength = konamiCode.length;
      const maxRaccoonLength = ourFriendlyRaccoon.length;

      // Function to trigger the Konami code effect
      function activateKonamiMode() {
        const body = document.body;
        if (!body) return;

        let hue = 0; // Start at red
        const interval = setInterval(() => {
          body.style.backgroundColor = `hsl(${hue}, 100%, 50%)`; // Rainbow colors
          hue = (hue + 1) % 360; // Increment hue (360 degrees in HSL)
        }, 5); // Change color every 5ms

        setTimeout(() => {
          clearInterval(interval);
          body.style.backgroundColor = ''; // Reset to original
        }, 5000);
      }

      function activateRaccoonMode() {
        const raccoonImg = document.createElement('img');
        raccoonImg.src = raccoon;
        raccoonImg.style.position = 'fixed';
        raccoonImg.style.bottom = '0';
        raccoonImg.style.right = '0';
        raccoonImg.style.zIndex = '999999';
        raccoonImg.style.width = '200px';
        raccoonImg.style.height = '200px';
        document.body.appendChild(raccoonImg);
        setTimeout(() => {
          raccoonImg.remove();
        }, 5000);
      }

      // Listen for keydown events
      document.addEventListener('keydown', (event) => {
        // Add to Konami input buffer
        konamiInput.push(event.key);
        if (konamiInput.length > maxKonamiLength) {
          konamiInput.shift(); // Remove the oldest input if it exceeds the max length
        }
      
        // Add to Raccoon input buffer
        raccoonInput.push(event.key);
        if (raccoonInput.length > maxRaccoonLength) {
          raccoonInput.shift(); // Remove the oldest input if it exceeds the max length
        }
      
        // Check for Konami Code
        if (konamiInput.join('') === konamiCode.join('')) {
          activateKonamiMode();
          konamiInput = []; // Reset Konami input
        }
      
        // Check for Raccoon Code
        if (raccoonInput.join('') === ourFriendlyRaccoon.join('')) {
          activateRaccoonMode();
          raccoonInput = []; // Reset Raccoon input
        }
      });
}
