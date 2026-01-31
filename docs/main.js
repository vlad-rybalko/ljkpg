const SALT = 'phrase-lock/v1';

const app = document.getElementById('app');
app.innerHTML = `
  <header>
    <p class="eyebrow">Client-side Phrase Encryptor/Decryptor</p>
    <h1>Клиентский шифратор фраз</h1>
    <p class="subtitle">
      Все операции выполняются локально в браузере. Можно сохранить страницу и работать оффлайн.
    </p>
    <div class="warning">
      <strong>Важно:</strong> не храните зашифрованные данные в общедоступных местах и используйте сильные пароли.
    </div>
  </header>

  <main class="panel">
    <div class="tabs" role="tablist" aria-label="Режимы">
      <button type="button" class="tab active" role="tab" aria-selected="true" data-mode="encrypt">
        Шифровать
      </button>
      <button type="button" class="tab" role="tab" aria-selected="false" data-mode="decrypt">
        Расшифровать
      </button>
    </div>

    <form id="cryptoForm" class="form" novalidate>
      <div class="field">
        <label for="inputText" id="inputLabel">Фраза для шифрования</label>
        <textarea
          id="inputText"
          rows="5"
          placeholder="Введите seed phrase или любую текстовую фразу"
          required
        ></textarea>
        <p class="hint">Поддерживаются фразы до ~1000 символов.</p>
      </div>

      <div class="field">
        <label for="password">Пароль</label>
        <input id="password" type="password" minlength="8" placeholder="Минимум 8 символов" required />
        <p class="hint">Пароль не сохраняется и нигде не отправляется.</p>
      </div>

      <div class="field decrypt-only" hidden>
        <label class="checkbox">
          <input type="checkbox" id="dateLockToggle" />
          Ограничить расшифровку до даты
        </label>
        <input id="unlockDate" type="date" disabled />
        <p class="hint">Если дата в будущем, расшифровка будет заблокирована.</p>
      </div>

      <div id="errorBox" class="message error" role="alert" hidden></div>

      <div class="actions">
        <button class="primary" type="submit" id="processButton">Выполнить</button>
        <button class="ghost" type="button" id="clearButton">Очистить</button>
      </div>
    </form>

    <section class="result" aria-live="polite">
      <div class="result-header">
        <h2 id="resultTitle">Зашифрованный код</h2>
        <button class="ghost" type="button" id="copyButton">Скопировать</button>
      </div>
      <textarea id="resultText" rows="4" readonly placeholder="Результат появится здесь"></textarea>
      <p class="hint" id="saltHint">AES-256 + PBKDF2, фиксированная соль для пароля: <code>${SALT}</code>.</p>
    </section>
  </main>

  <footer>
    <h2>Краткая инструкция</h2>
    <ol>
      <li>Выберите режим: «Шифровать» или «Расшифровать».</li>
      <li>Введите фразу и пароль (не менее 8 символов).</li>
      <li>Нажмите «Выполнить» и скопируйте результат.</li>
    </ol>
  </footer>
`;

const modeButtons = Array.from(document.querySelectorAll('[data-mode]'));
const inputLabel = document.getElementById('inputLabel');
const inputText = document.getElementById('inputText');
const password = document.getElementById('password');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const form = document.getElementById('cryptoForm');
const errorBox = document.getElementById('errorBox');
const processButton = document.getElementById('processButton');
const copyButton = document.getElementById('copyButton');
const clearButton = document.getElementById('clearButton');
const decryptOnly = document.querySelector('.decrypt-only');
const dateLockToggle = document.getElementById('dateLockToggle');
const unlockDate = document.getElementById('unlockDate');

const state = {
  mode: 'encrypt',
};

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

dateLockToggle.addEventListener('change', () => {
  unlockDate.disabled = !dateLockToggle.checked;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  const text = inputText.value.trim();
  const pass = password.value;

  if (!text) {
    showError('Введите фразу или зашифрованный код.');
    return;
  }

  if (!pass || pass.length < 8) {
    showError('Пароль должен содержать минимум 8 символов.');
    return;
  }

  processButton.disabled = true;

  try {
    if (state.mode === 'encrypt') {
      const cipher = await CryptoJS.AES.encrypt(text, buildPassphrase(pass));
      resultText.value = cipher;
      return;
    }

    if (dateLockToggle.checked && unlockDate.value) {
      const selected = new Date(unlockDate.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected > today) {
        showError(`Расшифровка заблокирована до ${formatDate(selected)}.`);
        return;
      }
    }

    const decrypted = await CryptoJS.AES.decrypt(text, buildPassphrase(pass));
    if (!decrypted) {
      showError('Неверный пароль или поврежденный код.');
      return;
    }
    resultText.value = decrypted;
  } catch (error) {
    showError('Не удалось расшифровать данные. Проверьте ввод.');
  } finally {
    processButton.disabled = false;
  }
});

copyButton.addEventListener('click', async () => {
  clearMessage();
  const value = resultText.value.trim();
  if (!value) {
    showError('Нет данных для копирования.');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    showSuccess('Скопировано в буфер обмена.');
  } catch (error) {
    const ok = fallbackCopy(resultText);
    if (ok) {
      showSuccess('Скопировано в буфер обмена.');
    } else {
      showError('Не удалось скопировать. Выделите текст вручную.');
    }
  }
});

clearButton.addEventListener('click', () => {
  inputText.value = '';
  password.value = '';
  resultText.value = '';
  dateLockToggle.checked = false;
  unlockDate.value = '';
  unlockDate.disabled = true;
  clearMessage();
});

function setMode(mode) {
  if (mode !== 'encrypt' && mode !== 'decrypt') return;
  state.mode = mode;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  if (mode === 'encrypt') {
    inputLabel.textContent = 'Фраза для шифрования';
    inputText.placeholder = 'Введите seed phrase или любую текстовую фразу';
    processButton.textContent = 'Шифровать';
    resultTitle.textContent = 'Зашифрованный код';
    decryptOnly.hidden = true;
  } else {
    inputLabel.textContent = 'Зашифрованный код';
    inputText.placeholder = 'Вставьте зашифрованный код';
    processButton.textContent = 'Расшифровать';
    resultTitle.textContent = 'Расшифрованная фраза';
    decryptOnly.hidden = false;
  }
}

function buildPassphrase(passwordValue) {
  return `${passwordValue}::${SALT}`;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('success');
  errorBox.hidden = false;
}

function showSuccess(message) {
  errorBox.textContent = message;
  errorBox.classList.add('success');
  errorBox.hidden = false;
}

function clearMessage() {
  errorBox.textContent = '';
  errorBox.hidden = true;
  errorBox.classList.remove('success');
}

function fallbackCopy(textarea) {
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch (error) {
    return false;
  }
}

function formatDate(date) {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

setMode('encrypt');
