const GITHUB_URL = 'https://lyna7280.github.io/konnex';
let currentSession = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Konnex Farmer installed');
  checkForUpdates();
});

// Проверяем обновления каждый раз при запуске браузера
chrome.runtime.onStartup.addListener(() => {
  checkForUpdates();
});

async function checkForUpdates() {
  try {
    const res = await fetch(GITHUB_URL + '/manifest.json?t=' + Date.now());
    const remote = await res.json();
    const local = chrome.runtime.getManifest();
    if (remote.version !== local.version) {
      // Уведомляем пользователя
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ff4f4f' });
      console.log('Доступно обновление: ' + remote.version);
    }
  } catch(e) {
    console.log('Проверка обновлений не удалась:', e.message);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'saveSession') {
    currentSession = msg.session;
    sendResponse({ status: 'ok' });
  }
  if (msg.action === 'getSession') {
    sendResponse({ session: currentSession });
  }
  if (msg.action === 'clearSession') {
    currentSession = null;
    sendResponse({ status: 'ok' });
  }
  if (msg.action === 'checkUpdate') {
    checkForUpdates().then(() => sendResponse({ status: 'ok' }));
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url) return;

  if (tab.url.includes('hub.konnex.world') && currentSession && currentSession.running) {
    const session = currentSession;
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: 'runTrainTask',
        wallet: session.wallet,
        email: session.email,
        rating: session.rating
      }, (response) => {
        if (chrome.runtime.lastError) {
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
              action: 'runTrainTask',
              wallet: session.wallet,
              email: session.email,
              rating: session.rating
            });
          }, 2000);
        }
      });
    }, 2000);
  }

  if (tab.url.includes('testnet.konnex.world') && currentSession) {
    const session = currentSession;
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: 'runTestnet',
        session: session
      });
    }, 2000);
  }
});
