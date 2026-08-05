<template>
  <div
    class="mobile-card-focus"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @keydown.esc.prevent="close"
  >
    <button
      type="button"
      class="mobile-card-focus__backdrop"
      aria-label="Close"
      @click="close"
    ></button>
    <div class="mobile-card-focus__sheet" ref="sheet">
      <header class="mobile-card-focus__header">
        <h2 class="mobile-card-focus__title">{{ title }}</h2>
        <button
          type="button"
          class="mobile-card-focus__close"
          @click="close"
          v-i18n
        >Close</button>
      </header>

      <div class="mobile-card-focus__tabs" role="tablist" aria-label="Card view">
        <button
          type="button"
          role="tab"
          class="mobile-card-focus__tab"
          :class="{'mobile-card-focus__tab--active': tab === 'rules'}"
          :aria-selected="tab === 'rules'"
          @click="tab = 'rules'"
          v-i18n
        >Rules</button>
        <button
          type="button"
          role="tab"
          class="mobile-card-focus__tab"
          :class="{'mobile-card-focus__tab--active': tab === 'original'}"
          :aria-selected="tab === 'original'"
          @click="tab = 'original'"
          v-i18n
        >Original</button>
      </div>

      <div class="mobile-card-focus__body" v-show="tab === 'rules'">
        <MobileCardRulesPanel :card="card" />
      </div>

      <div class="mobile-card-focus__body mobile-card-focus__body--original" v-show="tab === 'original'">
        <div class="mobile-card-focus__stage" :style="stageStyle">
          <Card
            :card="card"
            :actionUsed="actionUsed"
            :cubeColor="cubeColor"
          />
        </div>
      </div>

      <p class="mobile-card-focus__hint" v-i18n>Tap outside or Close to dismiss</p>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import Card from '@/client/components/card/Card.vue';
import MobileCardRulesPanel from '@/client/components/mobile/MobileCardRulesPanel.vue';
import {CardModel} from '@/common/models/CardModel';
import {Color} from '@/common/Color';
import {getCard} from '@/client/cards/ClientCardManifest';
import {CARD_DESIGN_WIDTH_PX, focusCardScale} from '@/client/components/mobile/mobileCardLayout';

type FocusTab = 'rules' | 'original';

export default defineComponent({
  name: 'MobileCardFocusSheet',
  components: {Card, MobileCardRulesPanel},
  props: {
    card: {
      type: Object as () => CardModel,
      required: true,
    },
    actionUsed: {
      type: Boolean,
      default: false,
    },
    cubeColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  emits: ['close'],
  data() {
    return {
      scale: 1.2,
      tab: 'rules' as FocusTab,
    };
  },
  computed: {
    title(): string {
      const meta = getCard(this.card.name);
      return meta?.name ?? String(this.card.name);
    },
    stageStyle(): Record<string, string> {
      const s = this.scale;
      return {
        transform: `scale(${s})`,
        transformOrigin: 'top center',
        marginBottom: `${(s - 1) * 280}px`,
        width: `${CARD_DESIGN_WIDTH_PX}px`,
      };
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
    updateScale() {
      this.scale = focusCardScale(window.innerWidth || 390);
    },
    onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        this.close();
      }
    },
  },
  mounted() {
    this.updateScale();
    window.addEventListener('resize', this.updateScale);
    window.addEventListener('keydown', this.onKey);
    document.body.classList.add('mobile-card-focus-open');
    const closeBtn = this.$el.querySelector('.mobile-card-focus__close') as HTMLElement | null;
    closeBtn?.focus();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateScale);
    window.removeEventListener('keydown', this.onKey);
    document.body.classList.remove('mobile-card-focus-open');
  },
});
</script>
