import './style.css';

const app = document.getElementById('app');

const widgetCatalog = [
  {
    type: 'hero',
    label: 'Hero-блок',
    description: 'Крупный заголовок, подзаголовок и CTA.',
  },
  {
    type: 'cards',
    label: 'Карточки',
    description: 'Сетка из карточек с преимуществами.',
  },
  {
    type: 'product',
    label: 'Информация о товаре',
    description: 'Фото, свойства, стоимость и кнопка.',
  },
  {
    type: 'text',
    label: 'Текст + заголовок',
    description: 'Блок с текстом и лидом.',
  },
  {
    type: 'spacer',
    label: 'Фиксированная высота',
    description: 'Отступ между блоками.',
  },
];

const state = {
  rows: [],
  selectedRowId: null,
  selectedColumnId: null,
};

app.innerHTML = `
  <div class="page">
    <header class="topbar">
      <div>
        <p class="eyebrow">Демо конструктора страниц</p>
        <h1>Соберите страницу из строк, колонок и виджетов</h1>
        <p class="subtitle">
          Добавляйте строки, делите их на колонки и наполняйте виджетами. Всё работает локально и
          сразу показывает результат.
        </p>
      </div>
      <div class="topbar-actions">
        <button id="seedLayout" class="ghost">Сбросить в демо-макет</button>
        <button id="clearLayout" class="danger">Очистить всё</button>
      </div>
    </header>

    <section class="builder">
      <aside class="panel">
        <div class="panel-section">
          <h2>Структура страницы</h2>
          <p class="hint">Выберите строку или колонку прямо в макете и добавляйте элементы.</p>
          <div class="controls">
            <button id="addRow" class="primary">+ Добавить строку</button>
            <button id="addColumn" class="secondary">+ Добавить колонку</button>
          </div>
          <div class="selection" id="selectionInfo"></div>
        </div>

        <div class="panel-section">
          <h2>Виджеты</h2>
          <p class="hint">Виджеты добавляются в выбранную колонку.</p>
          <div class="widget-list" id="widgetList"></div>
        </div>

        <div class="panel-section tips">
          <h3>Советы</h3>
          <ul>
            <li>На мобильном превью автоматически перестраивается в одну колонку.</li>
            <li>Можно создавать разные комбинации колонок в каждой строке.</li>
            <li>Каждый виджет — отдельный блок контента.</li>
          </ul>
        </div>
      </aside>

      <main class="canvas" id="canvas">
        <div class="canvas-empty">
          <h3>Начните с добавления строки</h3>
          <p>Используйте кнопки слева, чтобы собрать страницу из блоков.</p>
        </div>
      </main>
    </section>
  </div>
`;

const addRowButton = document.getElementById('addRow');
const addColumnButton = document.getElementById('addColumn');
const selectionInfo = document.getElementById('selectionInfo');
const widgetList = document.getElementById('widgetList');
const canvas = document.getElementById('canvas');
const seedLayoutButton = document.getElementById('seedLayout');
const clearLayoutButton = document.getElementById('clearLayout');

widgetList.innerHTML = widgetCatalog
  .map(
    (widget) => `
      <button class="widget-card" type="button" data-widget="${widget.type}">
        <strong>${widget.label}</strong>
        <span>${widget.description}</span>
      </button>
    `,
  )
  .join('');

addRowButton.addEventListener('click', () => {
  const row = createRow();
  state.rows.push(row);
  selectRow(row.id);
  selectColumn(row.columns[0].id);
  render();
});

addColumnButton.addEventListener('click', () => {
  const row = findRow(state.selectedRowId) || state.rows[state.rows.length - 1];
  if (!row) {
    addRowButton.click();
    return;
  }
  const column = createColumn();
  row.columns.push(column);
  selectRow(row.id);
  selectColumn(column.id);
  render();
});

widgetList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-widget]');
  if (!button) return;
  const type = button.dataset.widget;
  const column = findColumn(state.selectedColumnId);
  if (!column) {
    flashSelection('Сначала выберите колонку.');
    return;
  }
  column.widgets.push(createWidget(type));
  render();
});

seedLayoutButton.addEventListener('click', () => {
  seedDemoLayout();
  render();
});

clearLayoutButton.addEventListener('click', () => {
  state.rows = [];
  state.selectedRowId = null;
  state.selectedColumnId = null;
  render();
});

canvas.addEventListener('click', (event) => {
  const columnEl = event.target.closest('[data-column-id]');
  const rowEl = event.target.closest('[data-row-id]');
  if (columnEl) {
    selectColumn(columnEl.dataset.columnId);
    selectRow(columnEl.dataset.rowId);
    render();
    return;
  }
  if (rowEl) {
    selectRow(rowEl.dataset.rowId);
    state.selectedColumnId = null;
    render();
  }
});

function render() {
  renderSelection();
  renderCanvas();
}

function renderSelection() {
  const row = findRow(state.selectedRowId);
  const column = findColumn(state.selectedColumnId);
  const rowInfo = row
    ? `Выбрана строка: <strong>${row.label}</strong>`
    : 'Строка не выбрана';
  const columnInfo = column
    ? `Выбрана колонка: <strong>${column.label}</strong>`
    : 'Колонка не выбрана';

  selectionInfo.innerHTML = `
    <div class="selection-row">${rowInfo}</div>
    <div class="selection-row">${columnInfo}</div>
  `;
}

function renderCanvas() {
  if (state.rows.length === 0) {
    canvas.innerHTML = `
      <div class="canvas-empty">
        <h3>Начните с добавления строки</h3>
        <p>Используйте кнопки слева, чтобы собрать страницу из блоков.</p>
      </div>
    `;
    return;
  }

  canvas.innerHTML = state.rows
    .map((row) => {
      const isRowSelected = row.id === state.selectedRowId;
      return `
        <section class="row ${isRowSelected ? 'selected' : ''}" data-row-id="${row.id}" style="--cols: ${row.columns.length}">
          <div class="row-header">
            <span>${row.label}</span>
            <span>${row.columns.length} ${decline(row.columns.length, 'колонка', 'колонки', 'колонок')}</span>
          </div>
          <div class="row-columns">
            ${row.columns
              .map((column) => {
                const isColSelected = column.id === state.selectedColumnId;
                return `
                  <div
                    class="column ${isColSelected ? 'selected' : ''}"
                    data-row-id="${row.id}"
                    data-column-id="${column.id}"
                  >
                    <div class="column-header">${column.label}</div>
                    <div class="column-body">
                      ${column.widgets.length ? column.widgets.map(renderWidget).join('') : renderEmptyColumn()}
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </section>
      `;
    })
    .join('');
}

function renderWidget(widget) {
  const templates = {
    hero: `
      <div class="widget hero">
        <p class="badge">Hero</p>
        <h3>Новая коллекция 2024</h3>
        <p>Короткое описание вашего предложения: ценность, выгода, CTA.</p>
        <button class="primary">Смотреть каталог</button>
      </div>
    `,
    cards: `
      <div class="widget cards">
        <div class="card">
          <h4>Быстрый запуск</h4>
          <p>Готовые блоки и стили для старта проекта.</p>
        </div>
        <div class="card">
          <h4>Гибкая сетка</h4>
          <p>Комбинируйте колонки под любой сценарий.</p>
        </div>
        <div class="card">
          <h4>Адаптивность</h4>
          <p>Макет автоматически подстраивается под мобайл.</p>
        </div>
      </div>
    `,
    product: `
      <div class="widget product">
        <div class="product-media"></div>
        <div class="product-info">
          <h4>Smart Speaker Pro</h4>
          <p>Глубокий звук, управление жестами и умный режим.</p>
          <ul>
            <li>Bluetooth 5.3</li>
            <li>12 часов автономности</li>
            <li>3 цвета корпуса</li>
          </ul>
          <div class="price-row">
            <span class="price">12 990 ₽</span>
            <button class="primary">Добавить в корзину</button>
          </div>
        </div>
      </div>
    `,
    text: `
      <div class="widget text">
        <h4>О сервисе</h4>
        <p>
          Это демо конструктора страниц. Заполните блоки реальным контентом, добавьте новые разделы и
          получите готовую структуру лендинга.
        </p>
      </div>
    `,
    spacer: `
      <div class="widget spacer">
        <span>Фиксированная высота 80px</span>
      </div>
    `,
  };

  return templates[widget.type] ?? templates.text;
}

function renderEmptyColumn() {
  return `
    <div class="column-empty">
      <p>Пустая колонка</p>
      <span>Добавьте виджет слева</span>
    </div>
  `;
}

function createRow() {
  return {
    id: generateId(),
    label: `Строка ${state.rows.length + 1}`,
    columns: [createColumn(), createColumn()],
  };
}

function createColumn() {
  const index = state.rows.flatMap((row) => row.columns).length + 1;
  return {
    id: generateId(),
    label: `Колонка ${index}`,
    widgets: [],
  };
}

function createWidget(type) {
  return {
    id: generateId(),
    type,
  };
}

function selectRow(id) {
  state.selectedRowId = id;
}

function selectColumn(id) {
  state.selectedColumnId = id;
}

function findRow(id) {
  return state.rows.find((row) => row.id === id) ?? null;
}

function findColumn(id) {
  for (const row of state.rows) {
    const column = row.columns.find((col) => col.id === id);
    if (column) return column;
  }
  return null;
}

function flashSelection(message) {
  selectionInfo.innerHTML = `<div class="selection-row warning">${message}</div>`;
  window.setTimeout(renderSelection, 1200);
}

function seedDemoLayout() {
  state.rows = [];
  const row1 = createRow();
  row1.columns[0].widgets.push(createWidget('hero'));
  row1.columns[1].widgets.push(createWidget('text'));

  const row2 = createRow();
  row2.columns = [createColumn()];
  row2.columns[0].widgets.push(createWidget('cards'));

  const row3 = createRow();
  row3.columns = [createColumn(), createColumn()];
  row3.columns[0].widgets.push(createWidget('product'));
  row3.columns[1].widgets.push(createWidget('spacer'));
  row3.columns[1].widgets.push(createWidget('text'));

  state.rows.push(row1, row2, row3);
  selectRow(row1.id);
  selectColumn(row1.columns[0].id);
}

function generateId() {
  return `id-${Math.random().toString(16).slice(2, 10)}`;
}

function decline(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

seedDemoLayout();
render();
