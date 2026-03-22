let currentSession = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Konnex Farmer installed');
});

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
});

// Когда любая вкладка konnex загрузилась — запускаем задание
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url) return;

  // hub.konnex.world — запускаем Train Robots
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
          // Retry once
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

  // testnet.konnex.world — передаём сессию
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
