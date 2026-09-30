// Helper function to set a browser cookie
function setCookie(name, value, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || 0) + expires + "; path=/; SameSite=Lax";
}

// Helper function to get a browser cookie by name
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  const cookieBtn = document.getElementById('cookie-btn');
  const cookieCountDisplay = document.getElementById('cookie-count');
  const resetBtn = document.getElementById('reset-btn');

  // Load saved count from browser cookie or default to 0
  let count = parseInt(getCookie('cookieClickCount'), 10) || 0;
  cookieCountDisplay.textContent = count;

  function incrementCounter(event) {
    count++;
    cookieCountDisplay.textContent = count;
    setCookie('cookieClickCount', count);

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

  if (cookieBtn) {
    cookieBtn.addEventListener('click', incrementCounter);

    cookieBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        incrementCounter(e);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      count = 0;
      cookieCountDisplay.textContent = count;
      setCookie('cookieClickCount', count);
    });
  }
});
