// Content script for Twitter/X
// Помогает с автоматическими ретвитами и комментариями

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const KONNEX_KEYWORDS = ['konnex', 'konnex_world', '@konnex_world', '#konnex'];

async function autoRetweet() {
  // Find tweets mentioning konnex
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  let count = 0;

  for (const tweet of tweets) {
    const text = tweet.innerText.toLowerCase();
    const isKonnex = KONNEX_KEYWORDS.some(k => text.includes(k));

    if (isKonnex) {
      // Find retweet button
      const rtBtn = tweet.querySelector('[data-testid="retweet"]');
      if (rtBtn) {
        rtBtn.click();
        await sleep(800);
        // Confirm retweet in modal
        const confirmBtn = document.querySelector('[data-testid="retweetConfirm"]');
        if (confirmBtn) {
          confirmBtn.click();
          count++;
          await sleep(1200);
        }
      }
    }
  }

  return count;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'autoRetweet') {
    (async () => {
      const count = await autoRetweet();
      sendResponse({ status: 'ok', count });
    })();
    return true;
  }
});
