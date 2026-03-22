// Content script for hub.konnex.world

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function sendLog(text, level = 'info') {
  try { chrome.runtime.sendMessage({ type: 'log', text, level }); } catch(e) {}
}

function saveSession(data) {
  // Сохраняем в localStorage — доступно между доменами через background
  try { localStorage.setItem('konnex_auto', JSON.stringify(data)); } catch(e) {}
}

async function waitForButton(texts, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const all = Array.from(document.querySelectorAll('button, [role="button"], a'));
    const found = all.find(b => {
      const t = b.textContent.trim().toLowerCase();
      const label = (b.getAttribute('label') || b.getAttribute('aria-label') || '').toLowerCase();
      const spans = Array.from(b.querySelectorAll('span')).map(s => s.textContent.trim().toLowerCase()).join(' ');
      return texts.some(txt => t === txt || t.includes(txt) || label.includes(txt) || spans.includes(txt));
    });
    if (found) return found;
    await sleep(400);
  }
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'runTrainTask') {
    const { wallet, email, rating, comment } = msg;
    const session = { wallet, email, rating, comment, running: true };

    (async () => {
      try {
        sendLog('=== Запуск автоматизации ===', 'info');
        sendLog('Сохраняю настройки...', 'info');
        saveSession(session);

        // Сохраняем сессию через background (для testnet домена)
        chrome.runtime.sendMessage({ action: 'saveSession', session });

        sendLog('Ищу кнопку Sign Up...', 'info');
        await sleep(500);

        const signUpBtn = await waitForButton(['sign up', 'signup'], 6000);
        if (signUpBtn) {
          sendLog('Sign Up найден — нажимаю...', 'info');
          signUpBtn.click();
          sendLog('Откроется новая вкладка testnet.konnex.world', 'info');
          sendLog('Скрипт автоматически продолжит там ✓', 'ok');
        } else {
          // Показываем все ссылки для отладки
          const allLinks = Array.from(document.querySelectorAll('a')).map(a =>
            '"' + (a.textContent.trim() || a.getAttribute('label') || a.href) + '"'
          ).filter(t => t !== '""').slice(0, 10).join(', ');
          sendLog('Ссылки на странице: ' + allLinks, 'info');
          sendLog('Sign Up не найден — проверь что страница загружена', 'err');
        }

        sendResponse({ status: 'ok' });
      } catch(e) {
        sendLog('Ошибка: ' + e.message, 'err');
        sendResponse({ error: e.message });
      }
    })();
    return true;
  }
});

// Обработчик для отправки Twitter ссылки на проверку
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'submitTwitter') {
    (async () => {
      try {
        const tweetUrl = msg.tweetUrl;
        sendLog('Ищу кнопку Submit Post...', 'info');
        await new Promise(r => setTimeout(r, 1000));

        // Найти кнопку Submit Post
        const all = Array.from(document.querySelectorAll('button, [role="button"], a'));
        const submitPost = all.find(b => b.textContent.trim().toLowerCase().includes('submit post'));

        if (submitPost) {
          submitPost.click();
          sendLog('Submit Post нажат ✓', 'info');
          await new Promise(r => setTimeout(r, 2000));

          // Найти поле для ссылки и вставить
          const inputs = document.querySelectorAll('input[type="text"], input[type="url"], input');
          let filled = false;
          for (const inp of inputs) {
            const ph = (inp.placeholder || '').toLowerCase();
            if (ph.includes('link') || ph.includes('url') || ph.includes('tweet') || ph.includes('post') || ph.includes('http')) {
              const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              nativeSetter.call(inp, tweetUrl);
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true }));
              filled = true;
              sendLog('Ссылка вставлена ✓', 'info');
              await new Promise(r => setTimeout(r, 800));
              break;
            }
          }

          if (!filled) {
            // Попробуем первый незаполненный input
            for (const inp of inputs) {
              if (!inp.value) {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeSetter.call(inp, tweetUrl);
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                filled = true;
                sendLog('Ссылка вставлена (fallback) ✓', 'info');
                await new Promise(r => setTimeout(r, 800));
                break;
              }
            }
          }

          // Нажать Submit/Confirm
          await new Promise(r => setTimeout(r, 1000));
          const all2 = Array.from(document.querySelectorAll('button, [role="button"]'));
          const confirmBtn = all2.find(b => {
            const t = b.textContent.trim().toLowerCase();
            return t === 'submit' || t === 'confirm' || t === 'send' || t.includes('submit');
          });
          if (confirmBtn) {
            confirmBtn.click();
            sendLog('Отправлено на проверку! ✓', 'ok');
            sendResponse({ status: 'ok' });
          } else {
            sendLog('Нажми Submit вручную', 'err');
            sendResponse({ status: 'ok' });
          }
        } else {
          sendLog('Кнопка Submit Post не найдена на странице', 'err');
          sendResponse({ error: 'Submit Post not found' });
        }
      } catch(e) {
        sendLog('Ошибка: ' + e.message, 'err');
        sendResponse({ error: e.message });
      }
    })();
    return true;
  }
});
