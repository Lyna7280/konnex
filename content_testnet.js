// Content script for testnet.konnex.world

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function sendLog(text, level = 'info') {
  try { chrome.runtime.sendMessage({ type: 'log', text, level }); } catch(e) {}
}

function setReactValue(element, value) {
  const proto = element.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  nativeSetter.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

function loadSession() {
  try {
    const d = localStorage.getItem('konnex_auto');
    return d ? JSON.parse(d) : null;
  } catch(e) { return null; }
}

function clearSession() {
  localStorage.removeItem('konnex_auto');
}

// Загружаем кошелёк/email из chrome.storage (они там всегда есть)
async function getSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['wallet', 'email', 'rating'], (data) => {
      resolve(data);
    });
  });
}

async function waitForElement(selector, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await sleep(400);
  }
  return null;
}

async function findButton(texts, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const all = Array.from(document.querySelectorAll('button, [role="button"], a, [type="submit"]'));
    const found = all.find(b => {
      const t = b.textContent.trim().toLowerCase();
      const label = (b.getAttribute('label') || b.getAttribute('aria-label') || '').toLowerCase();
      return texts.some(txt => t === txt || t.includes(txt) || label.includes(txt));
    });
    if (found) return found;
    await sleep(400);
  }
  return null;
}

async function submitTask() {
  sendLog('Шаг: Submit a Task — нажимаю Submit...', 'info');
  await sleep(1000);
  const btn = await findButton(['submit'], 6000);
  if (btn) {
    btn.click();
    sendLog('Submit нажат ✓ — жду форму оценки...', 'info');
    await sleep(2000);
    const textarea = await waitForElement('textarea', 12000);
    if (textarea) {
      await fillEvaluation();
    } else {
      sendLog('Форма оценки не появилась', 'err');
    }
  } else {
    sendLog('Кнопка Submit не найдена', 'err');
  }
}

async function fillEvaluation() {
  const settings = await getSettings();
  const { wallet, email, rating } = settings;
  if (!wallet || !email) { sendLog('Кошелёк/email не найдены — проверь настройки расширения!', 'err'); return; }

  sendLog('Заполняю форму оценки...', 'info');
  await sleep(1000);

  // Звёзды
  let starClicked = false;
  const starSelectors = ['[class*="star"] svg', '[class*="Star"] svg', '[class*="rating"] svg'];
  for (const sel of starSelectors) {
    const stars = document.querySelectorAll(sel);
    if (stars.length >= rating) {
      stars[rating - 1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      sendLog('Рейтинг ' + rating + '/5 ✓', 'info');
      starClicked = true;
      await sleep(500);
      break;
    }
  }
  if (!starClicked) {
    const svgs = Array.from(document.querySelectorAll('svg')).filter(s => {
      const r = s.getBoundingClientRect();
      return r.width > 10 && r.width < 50;
    });
    if (svgs.length >= rating) {
      svgs[rating - 1].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      sendLog('Рейтинг ' + rating + '/5 ✓', 'info');
    } else {
      sendLog('Звёзды не найдены — поставь вручную', 'err');
    }
    await sleep(500);
  }

  // Кошелёк и email
  const inputs = Array.from(document.querySelectorAll('input'));
  let walletDone = false, emailDone = false;
  for (const inp of inputs) {
    const ph = (inp.placeholder || '').toLowerCase();
    const tp = (inp.type || '').toLowerCase();
    const nm = (inp.name || inp.id || '').toLowerCase();
    if (!walletDone && (ph.includes('0x') || ph.includes('wallet') || nm.includes('wallet') || ph.includes('address'))) {
      inp.focus();
      setReactValue(inp, wallet);
      walletDone = true;
      sendLog('Кошелёк вставлен ✓', 'info');
      await sleep(400);
    } else if (!emailDone && (tp === 'email' || ph.includes('email') || nm.includes('email'))) {
      inp.focus();
      setReactValue(inp, email);
      emailDone = true;
      sendLog('Email вставлен ✓', 'info');
      await sleep(400);
    }
  }
  if (!walletDone) sendLog('Поле кошелька не найдено!', 'err');
  if (!emailDone) sendLog('Поле email не найдено!', 'err');

  await sleep(1500);

  // Submit Feedback
  const doneBtn = await findButton(['submit feedback', 'done', 'confirm', 'submit'], 5000);
  if (doneBtn) {
    doneBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(500);
    doneBtn.click();
    sendLog('Submit Feedback нажат! ✓', 'ok');
    clearSession();
    await sleep(3000);
    if (!document.querySelector('textarea')) {
      sendLog('Задание засчитано! +50 pts 🎉', 'ok');
      sendLog('Закрываю вкладку...', 'info');
      await sleep(1500);
      window.close();
    } else {
      sendLog('Форма ещё видна — проверь поля', 'err');
    }
  } else {
    const btnList = Array.from(document.querySelectorAll('button')).map(b => '"' + b.textContent.trim() + '"').join(', ');
    sendLog('Кнопки: ' + btnList, 'info');
    sendLog('Нажми Submit Feedback вручную', 'err');
  }
}

async function runTestnet() {
  sendLog('testnet.konnex.world — определяю шаг...', 'info');
  await sleep(2000);

  const bodyText = document.body?.innerText?.toLowerCase() || '';
  const isSubmitTask = bodyText.includes('submit a task') || bodyText.includes('send request for a robot');
  const hasTextarea = !!document.querySelector('textarea');

  if (hasTextarea) {
    await fillEvaluation();
  } else if (isSubmitTask) {
    await submitTask();
  } else {
    sendLog('Жду загрузки...', 'info');
    await sleep(2000);
    if (document.querySelector('textarea')) {
      await fillEvaluation();
    } else if (document.body?.innerText?.toLowerCase().includes('submit a task')) {
      await submitTask();
    } else {
      sendLog('Не могу определить шаг', 'err');
    }
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'runTestnet') {
    // Сохраняем сессию локально
    try { localStorage.setItem('konnex_auto', JSON.stringify(msg.session)); } catch(e) {}
    (async () => {
      await runTestnet();
      sendResponse({ status: 'ok' });
    })();
    return true;
  }
});

(async () => {
  await sleep(1500);
  const session = loadSession();
  if (session && session.running) {
    sendLog('Продолжаю на testnet...', 'info');
    await runTestnet();
  }
})();
