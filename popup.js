const logEl = document.getElementById('log');

function log(msg, type = 'info') {
  const div = document.createElement('div');
  div.className = type === 'ok' ? 'status-line' : type === 'err' ? 'status-err' : 'status-info';
  const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  div.textContent = `[${time}] ${msg}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

// 30 авто-твитов
const TWEETS = [
  'Just trained a robot with @konnex_world today 🤖 RLHF is the future of robotics AI — and you earn points for it. #Konnex #AIRobotics',
  'Day of contributing to robot AI training with @konnex_world. Each task = 50 pts + helping real-world robotics improve. #Konnex',
  'The future of robotics is being built with human feedback. @konnex_world lets you be part of that 🔥 #Web3 #AI',
  'Rated a robot performance today on @konnex_world testnet. Simple task, real impact on AI training. 50 pts per day 🚀 #Konnex',
  'If you\'re not farming @konnex_world points yet, you\'re missing out. Train robots, earn points daily 🤖 #Konnex',
  'RLHF meets Web3 = @konnex_world 🧠 Your feedback literally trains robotic AI models. #AIRobotics #Crypto',
  'Another day, another robot trained on @konnex_world 🦾 Testnet points accumulating. #Konnex',
  'Interesting project: @konnex_world is using crowd-sourced human feedback to train robotics AI. Daily tasks = daily rewards 🎯 #Web3',
  'Just submitted my daily robot training task on @konnex_world. 50 pts, takes 2 mins ☕🤖 #Konnex',
  'Robotics AI needs human evaluation to improve. @konnex_world built exactly that 🔥 #RLHF',
  'Contributing to next-gen robotics with @konnex_world today. Testnet is live, tasks are quick 👀 #Konnex',
  'The convergence of robotics + AI + Web3 is happening at @konnex_world 🌐 #Crypto',
  'Daily reminder to do your @konnex_world robot training task 🤖 50 pts/day adds up fast. #Konnex',
  'What if watching a robot do tasks = earning crypto? That\'s @konnex_world 😭 #AIRobotics #Web3',
  'Spent 2 minutes evaluating robot AI on @konnex_world. Got 50 points 🎰 #Konnex',
  'Real talk: @konnex_world is one of the most legit early-stage projects in AI x Web3 right now. #Konnex #RLHF',
  'RLHF is what makes AI smart. @konnex_world is using it for robotics 🦾 #Konnex',
  'Trained another robot today 🤖 @konnex_world testnet keeps delivering. #Konnex #Web3',
  'If robots are going to take over the world, I at least want to be the one who trained them 😅 @konnex_world #Konnex',
  'Early testnet farming strategy: @konnex_world checks every box. Daily robot training = daily pts 🔑 #Konnex',
  'Just completed my @konnex_world daily task. Rate the robot, submit wallet. Done in 90 seconds 🏆 #Konnex',
  'Robotics is the next big wave after LLMs. @konnex_world is building the human-feedback layer 🚀 #AIRobotics',
  'The @konnex_world hub is clean, tasks are simple, rewards are consistent 👏 #Konnex',
  'Not financial advice but: evaluating robots on @konnex_world daily might be the best 2 minutes of your day 🤖 #Konnex',
  'Imagine getting paid to watch robots and say "good job." That\'s @konnex_world 😂 #RLHF #Konnex',
  'Crypto + AI + Robotics = the holy trinity of 2026. @konnex_world is at the intersection 🔺 #Konnex',
  'Another @konnex_world task submitted. Stack those testnet points 📈 #Konnex',
  'Human feedback is the secret sauce of modern AI. @konnex_world is crowdsourcing it for robotics 🙌',
  'GM. Woke up, trained a robot on @konnex_world, had coffee ☕🤖 #Konnex #AIRobotics #Web3',
  'The @konnex_world testnet has been live and running smoothly. Daily tasks, consistent points 🐂 #Konnex',
];

const REF_LINK = 'https://hub.konnex.world/points?referral_code=3F6J6J3N';

function getDailyTweet() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return TWEETS[dayOfYear % TWEETS.length] + '\n\n' + REF_LINK;
}

// Char counter
document.getElementById('tweet-text').addEventListener('input', function() {
  document.getElementById('char-count').textContent = this.value.length;
});

// Load saved settings
chrome.storage.local.get(['wallet', 'email', 'rating'], (data) => {
  if (data.wallet) document.getElementById('wallet').value = data.wallet;
  if (data.email) document.getElementById('email').value = data.email;
  if (data.rating) document.getElementById('rating').value = data.rating;
  log('Настройки загружены', 'ok');
});

// Save settings
document.getElementById('save-btn').addEventListener('click', () => {
  const wallet = document.getElementById('wallet').value.trim();
  const email = document.getElementById('email').value.trim();
  const rating = document.getElementById('rating').value;
  if (!wallet || !email) { log('Введи кошелёк и email!', 'err'); return; }
  chrome.storage.local.set({ wallet, email, rating }, () => {
    log('Настройки сохранены ✓', 'ok');
  });
});

function getSettings() {
  return {
    wallet: document.getElementById('wallet').value.trim(),
    email: document.getElementById('email').value.trim(),
    rating: parseInt(document.getElementById('rating').value),
  };
}

// ПУСК — открыть konnex и выполнить Train Robots
document.getElementById('start-btn').addEventListener('click', async () => {
  const { wallet, email, rating } = getSettings();
  if (!wallet || !email) { log('Сначала сохрани кошелёк и email!', 'err'); return; }

  log('Сохраняю сессию и открываю konnex...', 'info');
  chrome.runtime.sendMessage({ action: 'saveSession', session: { wallet, email, rating, running: true } }, () => {
    chrome.tabs.create({ url: 'https://hub.konnex.world/points?referral_code=3F6J6J3N' }, () => {
      log('Страница открывается — скрипт запустится автоматически ✓', 'ok');
    });
  });
});

// Только Train Robots
document.getElementById('train-btn').addEventListener('click', async () => {
  const { wallet, email, rating } = getSettings();
  if (!wallet || !email) { log('Сначала сохрани кошелёк и email!', 'err'); return; }

  log('Ищу вкладку konnex.world...', 'info');
  chrome.tabs.query({ url: 'https://hub.konnex.world/*' }, (tabs) => {
    if (tabs.length === 0) {
      log('Открываю konnex.world...', 'info');
      chrome.tabs.create({ url: 'https://hub.konnex.world/points?referral_code=3F6J6J3N' }, (tab) => {
        chrome.runtime.sendMessage({ action: 'saveSession', session: { wallet, email, rating, running: true } });
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'runTrainTask', wallet, email, rating });
        }, 4000);
      });
    } else {
      chrome.runtime.sendMessage({ action: 'saveSession', session: { wallet, email, rating, running: true } });
      chrome.tabs.sendMessage(tabs[0].id, { action: 'runTrainTask', wallet, email, rating });
      log('Train Robots запущен ✓', 'ok');
    }
  });
});

// Twitter — публикуем и отправляем на проверку
document.getElementById('twitter-btn').addEventListener('click', async () => {
  const { wallet, email } = getSettings();
  if (!wallet || !email) { log('Сначала сохрани кошелёк и email!', 'err'); return; }

  let tweetText = document.getElementById('tweet-text').value.trim();
  if (!tweetText) {
    tweetText = getDailyTweet();
    log('Использую авто-твит дня', 'info');
  } else {
    // Добавляем тег и ссылку если нет
    if (!tweetText.includes('@konnex_world')) tweetText += ' @konnex_world';
    if (!tweetText.includes('konnex.world')) tweetText += '\n\n' + REF_LINK;
  }

  log('Открываю Twitter...', 'info');
  const encoded = encodeURIComponent(tweetText);
  chrome.tabs.create({ url: `https://x.com/intent/tweet?text=${encoded}` }, (tab) => {
    log('Twitter открыт — публикуй твит!', 'info');
    log('После публикации скрипт сам скопирует ссылку и отправит на проверку', 'info');

    // Слушаем когда твит опубликован
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, t) {
      if (tabId === tab.id && changeInfo.status === 'complete' && t.url && t.url.includes('x.com/') && !t.url.includes('intent')) {
        chrome.tabs.onUpdated.removeListener(listener);
        const tweetUrl = t.url;
        log('Твит опубликован: ' + tweetUrl, 'ok');
        // Отправляем ссылку на konnex
        setTimeout(() => submitTwitterLink(tweetUrl), 1500);
      }
    });
  });
});

function submitTwitterLink(tweetUrl) {
  log('Отправляю ссылку на проверку...', 'info');
  chrome.tabs.query({ url: 'https://hub.konnex.world/*' }, (tabs) => {
    if (tabs.length === 0) {
      chrome.tabs.create({ url: 'https://hub.konnex.world/points?referral_code=3F6J6J3N' }, (tab) => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'submitTwitter', tweetUrl }, (r) => {
            if (r?.status === 'ok') log('Ссылка отправлена на проверку! +15 pts 🎉', 'ok');
          });
        }, 3000);
      });
    } else {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'submitTwitter', tweetUrl }, (r) => {
        if (chrome.runtime.lastError) { log('Ошибка отправки: ' + chrome.runtime.lastError.message, 'err'); return; }
        if (r?.status === 'ok') log('Ссылка отправлена на проверку! +15 pts 🎉', 'ok');
        else log('Не удалось отправить автоматически — вставь ссылку вручную', 'err');
      });
    }
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'log') log(msg.text, msg.level || 'info');
});
