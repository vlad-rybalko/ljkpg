(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))d(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const m of i.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&d(m)}).observe(document,{childList:!0,subtree:!0});function s(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function d(o){if(o.ep)return;o.ep=!0;const i=s(o);fetch(o.href,i)}})();const $=document.getElementById("app"),C=[{type:"hero",label:"Hero-блок",description:"Крупный заголовок, подзаголовок и CTA."},{type:"cards",label:"Карточки",description:"Сетка из карточек с преимуществами."},{type:"product",label:"Информация о товаре",description:"Фото, свойства, стоимость и кнопка."},{type:"text",label:"Текст + заголовок",description:"Блок с текстом и лидом."},{type:"spacer",label:"Фиксированная высота",description:"Отступ между блоками."}],n={rows:[],selectedRowId:null,selectedColumnId:null};$.innerHTML=`
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
`;const g=document.getElementById("addRow"),E=document.getElementById("addColumn"),f=document.getElementById("selectionInfo"),h=document.getElementById("widgetList"),v=document.getElementById("canvas"),R=document.getElementById("seedLayout"),B=document.getElementById("clearLayout");h.innerHTML=C.map(e=>`
      <button class="widget-card" type="button" data-widget="${e.type}">
        <strong>${e.label}</strong>
        <span>${e.description}</span>
      </button>
    `).join("");g.addEventListener("click",()=>{const e=u();n.rows.push(e),a(e.id),p(e.columns[0].id),c()});E.addEventListener("click",()=>{const e=b(n.selectedRowId)||n.rows[n.rows.length-1];if(!e){g.click();return}const t=r();e.columns.push(t),a(e.id),p(t.id),c()});h.addEventListener("click",e=>{const t=e.target.closest("[data-widget]");if(!t)return;const s=t.dataset.widget,d=I(n.selectedColumnId);if(!d){x("Сначала выберите колонку.");return}d.widgets.push(l(s)),c()});R.addEventListener("click",()=>{L(),c()});B.addEventListener("click",()=>{n.rows=[],n.selectedRowId=null,n.selectedColumnId=null,c()});v.addEventListener("click",e=>{const t=e.target.closest("[data-column-id]"),s=e.target.closest("[data-row-id]");if(t){p(t.dataset.columnId),a(t.dataset.rowId),c();return}s&&(a(s.dataset.rowId),n.selectedColumnId=null,c())});function c(){y(),S()}function y(){const e=b(n.selectedRowId),t=I(n.selectedColumnId),s=e?`Выбрана строка: <strong>${e.label}</strong>`:"Строка не выбрана",d=t?`Выбрана колонка: <strong>${t.label}</strong>`:"Колонка не выбрана";f.innerHTML=`
    <div class="selection-row">${s}</div>
    <div class="selection-row">${d}</div>
  `}function S(){if(n.rows.length===0){v.innerHTML=`
      <div class="canvas-empty">
        <h3>Начните с добавления строки</h3>
        <p>Используйте кнопки слева, чтобы собрать страницу из блоков.</p>
      </div>
    `;return}v.innerHTML=n.rows.map(e=>`
        <section class="row ${e.id===n.selectedRowId?"selected":""}" data-row-id="${e.id}" style="--cols: ${e.columns.length}">
          <div class="row-header">
            <span>${e.label}</span>
            <span>${e.columns.length} ${H(e.columns.length,"колонка","колонки","колонок")}</span>
          </div>
          <div class="row-columns">
            ${e.columns.map(s=>`
                  <div
                    class="column ${s.id===n.selectedColumnId?"selected":""}"
                    data-row-id="${e.id}"
                    data-column-id="${s.id}"
                  >
                    <div class="column-header">${s.label}</div>
                    <div class="column-body">
                      ${s.widgets.length?s.widgets.map(M).join(""):T()}
                    </div>
                  </div>
                `).join("")}
          </div>
        </section>
      `).join("")}function M(e){const t={hero:`
      <div class="widget hero">
        <p class="badge">Hero</p>
        <h3>Новая коллекция 2024</h3>
        <p>Короткое описание вашего предложения: ценность, выгода, CTA.</p>
        <button class="primary">Смотреть каталог</button>
      </div>
    `,cards:`
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
    `,product:`
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
    `,text:`
      <div class="widget text">
        <h4>О сервисе</h4>
        <p>
          Это демо конструктора страниц. Заполните блоки реальным контентом, добавьте новые разделы и
          получите готовую структуру лендинга.
        </p>
      </div>
    `,spacer:`
      <div class="widget spacer">
        <span>Фиксированная высота 80px</span>
      </div>
    `};return t[e.type]??t.text}function T(){return`
    <div class="column-empty">
      <p>Пустая колонка</p>
      <span>Добавьте виджет слева</span>
    </div>
  `}function u(){return{id:w(),label:`Строка ${n.rows.length+1}`,columns:[r(),r()]}}function r(){const e=n.rows.flatMap(t=>t.columns).length+1;return{id:w(),label:`Колонка ${e}`,widgets:[]}}function l(e){return{id:w(),type:e}}function a(e){n.selectedRowId=e}function p(e){n.selectedColumnId=e}function b(e){return n.rows.find(t=>t.id===e)??null}function I(e){for(const t of n.rows){const s=t.columns.find(d=>d.id===e);if(s)return s}return null}function x(e){f.innerHTML=`<div class="selection-row warning">${e}</div>`,window.setTimeout(y,1200)}function L(){n.rows=[];const e=u();e.columns[0].widgets.push(l("hero")),e.columns[1].widgets.push(l("text"));const t=u();t.columns=[r()],t.columns[0].widgets.push(l("cards"));const s=u();s.columns=[r(),r()],s.columns[0].widgets.push(l("product")),s.columns[1].widgets.push(l("spacer")),s.columns[1].widgets.push(l("text")),n.rows.push(e,t,s),a(e.id),p(e.columns[0].id)}function w(){return`id-${Math.random().toString(16).slice(2,10)}`}function H(e,t,s,d){const o=e%10,i=e%100;return o===1&&i!==11?t:o>=2&&o<=4&&(i<10||i>=20)?s:d}L();c();
