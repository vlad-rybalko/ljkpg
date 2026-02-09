const { createApp, ref, computed } = Vue;

const widgetCatalog = [
  {
    type: 'hero',
    label: 'Hero (баннер)',
    description: 'Крупный баннер с каруселью, высота фиксирована.'
  },
  {
    type: 'plant',
    label: 'Информация о растении',
    description: 'Карточка с особенностями, уходом и сезоном.'
  },
  {
    type: 'text',
    label: 'Текстовый блок',
    description: 'Описание или длинный текст.'
  },
  {
    type: 'image',
    label: 'Изображение',
    description: 'Картинка с подписью и настраиваемой высотой.'
  }
];

const HeroWidget = {
  props: ['title', 'subtitle', 'slides', 'showArrows', 'showPagination'],
  data() {
    return {
      activeIndex: 0
    };
  },
  methods: {
    prev() {
      this.activeIndex = (this.activeIndex - 1 + this.slides.length) % this.slides.length;
    },
    next() {
      this.activeIndex = (this.activeIndex + 1) % this.slides.length;
    },
    goTo(index) {
      this.activeIndex = index;
    }
  },
  template: `
    <section class="widget widget-hero">
      <div class="hero">
        <div class="hero__content">
          <h3 class="hero__title">{{ title }}</h3>
          <p class="hero__subtitle">{{ subtitle }}</p>
        </div>
        <div class="hero__carousel">
          <div class="hero__slides">
            <div
              v-for="(slide, index) in slides"
              :key="slide.caption"
              class="hero__slide"
              :class="{ 'hero__slide--active': index === activeIndex }"
            >
              <img :src="slide.image" :alt="slide.caption" />
              <span class="hero__caption">{{ slide.caption }}</span>
            </div>
          </div>
          <button v-if="showArrows" class="hero__arrow hero__arrow--left" @click="prev">
            ←
          </button>
          <button v-if="showArrows" class="hero__arrow hero__arrow--right" @click="next">
            →
          </button>
          <div v-if="showPagination" class="hero__pagination">
            <button
              v-for="(slide, index) in slides"
              :key="slide.caption + index"
              :class="{ active: index === activeIndex }"
              @click="goTo(index)"
            ></button>
          </div>
        </div>
      </div>
    </section>
  `
};

const PlantWidget = {
  props: ['name', 'latin', 'description', 'care', 'season'],
  template: `
    <section class="widget widget-plant">
      <div class="plant">
        <div>
          <p class="plant__eyebrow">{{ latin }}</p>
          <h3>{{ name }}</h3>
          <p class="plant__description">{{ description }}</p>
        </div>
        <div class="plant__details">
          <div>
            <strong>Уход</strong>
            <p>{{ care }}</p>
          </div>
          <div>
            <strong>Сезон</strong>
            <p>{{ season }}</p>
          </div>
        </div>
      </div>
    </section>
  `
};

const TextWidget = {
  props: ['title', 'body'],
  template: `
    <section class="widget widget-text">
      <h3>{{ title }}</h3>
      <p>{{ body }}</p>
    </section>
  `
};

const ImageWidget = {
  props: ['src', 'caption', 'height'],
  template: `
    <figure class="widget widget-image">
      <img :src="src" :alt="caption" :style="{ height: height + 'px' }" />
      <figcaption>Высота: {{ height }}px · {{ caption }}</figcaption>
    </figure>
  `
};

const widgetComponents = {
  hero: 'HeroWidget',
  plant: 'PlantWidget',
  text: 'TextWidget',
  image: 'ImageWidget'
};

let nextId = 1;
const uid = () => nextId++;

const defaultWidgets = {
  hero: {
    title: 'Главный баннер',
    subtitle: 'Hero-блок с фиксированной высотой и каруселью.',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Свежая коллекция растений'
      },
      {
        image: 'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?auto=format&fit=crop&w=1200&q=80',
        caption: 'Уголок зелени в интерьере'
      },
      {
        image: 'https://images.unsplash.com/photo-1446071103084-c257b5f70672?auto=format&fit=crop&w=1200&q=80',
        caption: 'Мини-сад для рабочей зоны'
      }
    ],
    showArrows: true,
    showPagination: true
  },
  plant: {
    name: 'Монстера Деликатесная',
    latin: 'Monstera deliciosa',
    description: 'Неприхотливое растение с крупными рассеченными листьями.',
    care: 'Яркий рассеянный свет, полив 1-2 раза в неделю.',
    season: 'Активный рост — весна и лето.'
  },
  text: {
    title: 'Описание раздела',
    body: 'Добавьте сюда подробный текст о компании, продукте или услуге. Блок адаптируется по высоте под контент.'
  },
  image: {
    src: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    caption: 'Имиджевое фото для секции.',
    height: 220
  }
};

const createWidget = (type) => ({
  id: uid(),
  type,
  component: widgetComponents[type],
  props: { ...defaultWidgets[type] }
});

const createColumn = (order) => ({
  id: uid(),
  order,
  span: 6,
  selectedWidget: 'hero',
  widgets: []
});

const createRow = (order) => ({
  id: uid(),
  order,
  columns: []
});

createApp({
  setup() {
    const rows = ref([]);
    const spanOptions = Array.from({ length: 12 }, (_, i) => i + 1);

    const addRow = () => {
      const row = createRow(rows.value.length + 1);
      row.columns.push(createColumn(1));
      rows.value.push(row);
    };

    const removeRow = (rowId) => {
      rows.value = rows.value.filter((row) => row.id !== rowId);
      rows.value.forEach((row, index) => {
        row.order = index + 1;
      });
    };

    const addColumn = (row) => {
      row.columns.push(createColumn(row.columns.length + 1));
    };

    const removeColumn = (row, columnId) => {
      row.columns = row.columns.filter((column) => column.id !== columnId);
      row.columns.forEach((column, index) => {
        column.order = index + 1;
      });
    };

    const addWidget = (column) => {
      const type = column.selectedWidget;
      if (!type) {
        return;
      }
      column.widgets.push(createWidget(type));
    };

    const removeWidget = (column, widgetId) => {
      column.widgets = column.widgets.filter((widget) => widget.id !== widgetId);
    };

    const columnStyle = (column) => ({
      gridColumn: `span ${column.span}`
    });

    const seedLayout = () => {
      const firstRow = createRow(1);
      const heroColumn = createColumn(1);
      heroColumn.span = 12;
      heroColumn.widgets.push(createWidget('hero'));
      const plantColumn = createColumn(2);
      plantColumn.span = 4;
      plantColumn.widgets.push(createWidget('plant'));
      const textColumn = createColumn(3);
      textColumn.span = 8;
      textColumn.widgets.push(createWidget('text'));
      firstRow.columns.push(heroColumn, plantColumn, textColumn);

      const secondRow = createRow(2);
      const imageColumn = createColumn(1);
      imageColumn.span = 6;
      imageColumn.widgets.push(createWidget('image'));
      const textColumnTwo = createColumn(2);
      textColumnTwo.span = 6;
      textColumnTwo.widgets.push(createWidget('text'));
      secondRow.columns.push(imageColumn, textColumnTwo);

      rows.value = [firstRow, secondRow];
    };

    const resetLayout = () => {
      rows.value = [];
      seedLayout();
    };

    const jsonOutput = computed(() => {
      const payload = {
        columnsGrid: 12,
        rows: rows.value.map((row) => ({
          columns: row.columns.map((column) => ({
            span: column.span,
            widgets: column.widgets.map((widget) => ({
              type: widget.type,
              props: widget.props
            }))
          }))
        }))
      };
      return JSON.stringify(payload, null, 2);
    });

    seedLayout();

    return {
      rows,
      widgetCatalog,
      spanOptions,
      addRow,
      removeRow,
      addColumn,
      removeColumn,
      addWidget,
      removeWidget,
      resetLayout,
      columnStyle,
      jsonOutput
    };
  }
})
  .component('HeroWidget', HeroWidget)
  .component('PlantWidget', PlantWidget)
  .component('TextWidget', TextWidget)
  .component('ImageWidget', ImageWidget)
  .mount('#app');
