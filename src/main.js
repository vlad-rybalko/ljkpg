const TARGET_PRESETS = [
  { label: '480p', width: 480 },
  { label: '720p', width: 720 },
  { label: '1080p', width: 1080 },
];

const state = {
  items: [],
  quality: 0.82,
};

const app = document.getElementById('app');
app.innerHTML = `
  <header>
    <h1>WebP Image Optimizer</h1>
    <p class="subtitle">
      Загрузите изображения любого распространенного формата, и сервис сожмёт их, оптимизирует и подготовит версии 480p, 720p и 1080p в формате WebP прямо в браузере.
    </p>
  </header>
  <section class="upload-card">
    <div id="dropzone" class="dropzone" role="button" tabindex="0" aria-label="Загрузить изображения">
      <h2>Перетащите файлы сюда</h2>
      <p>Поддерживаются JPG, PNG, HEIC, BMP и другие форматы. Максимальный размер ограничен возможностями браузера.</p>
      <button id="pickFiles" class="primary">
        <span class="icon">⬆️</span>
        Выбрать изображения
      </button>
      <input id="fileInput" type="file" accept="image/*" multiple />
    </div>
    <div class="controls">
      <div class="quality-control">
        <label for="quality">Качество WebP:</label>
        <input type="range" id="quality" min="0.4" max="1" step="0.01" value="${state.quality}" />
        <span id="qualityValue">${Math.round(state.quality * 100)}%</span>
      </div>
      <div id="progress" class="progress" hidden>
        <span class="spinner" aria-hidden="true"></span>
        <span id="progressText">Обработка…</span>
      </div>
    </div>
  </section>
  <section id="results" class="results" aria-live="polite"></section>
  <div class="actions">
    <button id="clear" type="button" hidden>Очистить все</button>
  </div>
`;

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const pickFiles = document.getElementById('pickFiles');
const results = document.getElementById('results');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const clearButton = document.getElementById('clear');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progressText');

pickFiles.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
  const files = Array.from(event.target.files ?? []).filter(isSupportedFile);
  if (files.length) {
    handleFiles(files);
  }
  fileInput.value = '';
});

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragover');
  const files = Array.from(event.dataTransfer?.files ?? []).filter(isSupportedFile);
  if (files.length) {
    handleFiles(files);
  }
});

dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

qualityInput.addEventListener('input', (event) => {
  const value = Number(event.target.value);
  state.quality = value;
  qualityValue.textContent = `${Math.round(value * 100)}%`;
});

clearButton.addEventListener('click', () => {
  state.items = [];
  results.innerHTML = '';
  clearButton.hidden = true;
});

async function handleFiles(files) {
  toggleProgress(true, `Обработка ${files.length} ${decline(files.length, 'файл', 'файла', 'файлов')}…`);

  for (const file of files) {
    const card = createPendingCard(file);
    results.prepend(card.element);
    state.items.unshift(card);

    try {
      const processed = await processImage(file, state.quality);
      card.resolve(processed);
    } catch (error) {
      console.error(error);
      card.reject(error);
    }
  }

  toggleProgress(false);
  clearButton.hidden = state.items.length === 0;
}

function toggleProgress(show, message = '') {
  progress.hidden = !show;
  if (message) {
    progressText.textContent = message;
  }
}

function createPendingCard(file) {
  const element = document.createElement('article');
  element.className = 'card';
  element.innerHTML = `
    <div class="card-header">
      <h3>${escapeHtml(file.name)}</h3>
      <span class="status">Ожидает обработки…</span>
    </div>
    <div class="empty-state">Подготовка изображения</div>
  `;

  const status = element.querySelector('.status');
  const emptyState = element.querySelector('.empty-state');

  return {
    element,
    resolve(processed) {
      status.textContent = `Готово · исходный размер ${formatBytes(file.size)}`;
      const preview = createPreview(processed.previewUrl);
      const variants = document.createElement('div');
      variants.className = 'variant-list';

      for (const variant of processed.variants) {
        variants.appendChild(createVariantRow(variant));
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'preview-wrapper';
      wrapper.append(preview, variants);

      emptyState.replaceWith(wrapper);
    },
    reject(error) {
      status.textContent = 'Ошибка обработки';
      emptyState.innerHTML = `<p>Не удалось обработать изображение. ${escapeHtml(error.message ?? 'Попробуйте другое изображение.')}</p>`;
    },
  };
}

function createPreview(url) {
  const wrapper = document.createElement('div');
  wrapper.className = 'preview';
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Превью обработанного изображения';
  wrapper.appendChild(img);
  return wrapper;
}

function createVariantRow(variant) {
  const row = document.createElement('div');
  row.className = 'variant';

  const info = document.createElement('div');
  info.className = 'variant-info';
  const title = document.createElement('strong');
  title.textContent = `${variant.label} · ${variant.width}×${variant.height}`;
  const subtitle = document.createElement('span');
  subtitle.textContent = `~${formatBytes(variant.size)} · экономия ${variant.savings}%`;
  info.append(title, subtitle);

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Скачать';
  button.addEventListener('click', () => downloadBlob(variant.blob, variant.fileName));

  row.append(info, button);
  return row;
}

async function processImage(file, quality) {
  const imageBitmap = await loadImageBitmap(file);
  const previewUrl = await fileToDataUrl(file);
  const variants = [];

  for (const preset of TARGET_PRESETS) {
    const { blob, width, height } = await renderVariant(imageBitmap, preset.width, quality);
    const fileName = buildFileName(file.name, preset.label);
    const size = blob.size;
    const savings = file.size
      ? Math.max(0, Math.round((1 - size / file.size) * 100))
      : 0;

    variants.push({
      label: preset.label,
      width,
      height,
      blob,
      fileName,
      size,
      savings,
    });
  }

  imageBitmap.close?.();

  return {
    previewUrl,
    variants,
  };
}

async function renderVariant(imageBitmap, targetWidth, quality) {
  const originalWidth = imageBitmap.width || targetWidth;
  const width = Math.max(1, Math.min(targetWidth, originalWidth));
  const scale = width / originalWidth;
  const originalHeight = imageBitmap.height || Math.round(targetWidth * 0.75);
  const height = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Не удалось создать контекст рисования.');
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(imageBitmap, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Браузер не поддерживает экспорт в WebP.'));
          return;
        }
        resolve(result);
      },
      'image/webp',
      quality,
    );
  });

  return { blob, width, height };
}

async function loadImageBitmap(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (error) {
      console.warn('createImageBitmap не удался, fallback на Image', error);
    }
  }

  const url = await fileToDataUrl(file);
  return await loadImageElement(url);
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Не удалось загрузить изображение.'));
    image.src = src;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Ошибка чтения файла.'));
    reader.readAsDataURL(file);
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Б';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value < 10 && exponent > 0 ? 1 : 0)} ${units[exponent]}`;
}

function buildFileName(originalName, presetLabel) {
  const baseName = originalName.replace(/\.[^.]+$/, '');
  return `${baseName}_${presetLabel}.webp`;
}

function escapeHtml(string) {
  return String(string).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#039;';
      default:
        return char;
    }
  });
}

function decline(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function isSupportedFile(file) {
  if (file.type?.startsWith('image/')) return true;
  return /\.(jpe?g|png|gif|bmp|webp|heic|heif|avif|tiff)$/i.test(file.name ?? '');
}
