// Prevent right-click context menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Block common DevTools keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // F12
  if (e.key === 'F12') {
    e.preventDefault();
    return;
  }
  // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U (and Mac equivalents with Meta)
  const isCmdOrCtrl = e.ctrlKey || e.metaKey;
  if (
    (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
    (isCmdOrCtrl && (e.key === 'U' || e.key === 'u'))
  ) {
    e.preventDefault();
    return;
  }
});

const cookieBtn = document.getElementById('cookie-btn');
const cookieCountDisplay = document.getElementById('cookie-count');
const resetBtn = document.getElementById('reset-btn');
const toast = document.getElementById('achievement-toast');
const toastTitle = document.getElementById('toast-title');

const achievements = [
  { id: '10', threshold: 10, title: 'Novato (10 clics)' },
  { id: '100', threshold: 100, title: 'Experto (100 clics)' },
  { id: '1000', threshold: 1000, title: 'Maestro (1000 clics)' }
];

const SECRET_SALT = 'CookieClicker_SecureSalt_987654321';

function computeHash(value) {
  let str = value + SECRET_SALT;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(16);
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; SameSite=Strict`;
}

function loadSavedCount() {
  const savedCountStr = localStorage.getItem('cookieClickCount') || getCookie('cookieClickCount');
  const savedHash = localStorage.getItem('cookieClickHash') || getCookie('cookieClickHash');

  if (!savedCountStr) return 0;

  const parsedCount = parseInt(savedCountStr, 10);
  if (isNaN(parsedCount) || parsedCount < 0) {
    return 0;
  }

  // Check integrity hash
  if (savedHash !== computeHash(parsedCount)) {
    console.warn('Tampering detected in saved state. Counter has been reset.');
    return 0;
  }

  return parsedCount;
}

function saveCount(val) {
  const hash = computeHash(val);
  localStorage.setItem('cookieClickCount', val);
  localStorage.setItem('cookieClickHash', hash);
  setCookie('cookieClickCount', val);
  setCookie('cookieClickHash', hash);
}

// Load saved count from localStorage or cookies with integrity check
let count = loadSavedCount();
let unlockedAchievements = JSON.parse(localStorage.getItem('cookieAchievements')) || {};
cookieCountDisplay.textContent = count;
saveCount(count);

let toastTimeout = null;

function showToast(title) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTitle.textContent = title;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function checkAchievements(currentCount, triggerToast = true) {
  achievements.forEach(ach => {
    const card = document.getElementById(`achievement-${ach.id}`);
    if (currentCount >= ach.threshold) {
      if (!unlockedAchievements[ach.id]) {
        unlockedAchievements[ach.id] = true;
        localStorage.setItem('cookieAchievements', JSON.stringify(unlockedAchievements));
        if (triggerToast) {
          showToast(ach.title);
        }
      }
      if (card) {
        card.classList.add('unlocked');
      }
    } else {
      if (card) {
        card.classList.remove('unlocked');
      }
    }
  });
}

// Initialize achievements UI on page load
checkAchievements(count, false);

function incrementCounter(event) {
  count++;
  cookieCountDisplay.textContent = count;
  saveCount(count);

  checkAchievements(count, true);

  // Create floating +1 text
  createFloatingText(event);
}

function createFloatingText(event) {
  const floatText = document.createElement('div');
  floatText.className = 'floating-text';
  floatText.textContent = '+1';

  const rect = cookieBtn.getBoundingClientRect();
  let x, y;

  if (event && event.clientX && event.clientY) {
    x = event.clientX - rect.left - 10;
    y = event.clientY - rect.top - 20;
  } else {
    // Fallback for keyboard press
    x = rect.width / 2 - 10;
    y = rect.height / 2 - 20;
  }

  floatText.style.left = `${x}px`;
  floatText.style.top = `${y}px`;

  cookieBtn.appendChild(floatText);

  setTimeout(() => {
    floatText.remove();
  }, 800);
}

cookieBtn.addEventListener('click', incrementCounter);

cookieBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    incrementCounter(e);
  }
});

resetBtn.addEventListener('click', () => {
  count = 0;
  unlockedAchievements = {};
  cookieCountDisplay.textContent = count;
  saveCount(count);
  localStorage.setItem('cookieAchievements', JSON.stringify(unlockedAchievements));
  checkAchievements(count, false);
  if (toast) {
    toast.classList.remove('show');
  }
});
