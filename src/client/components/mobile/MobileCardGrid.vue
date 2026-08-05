<template>
  <div class="mobile-card-grid-wrap">
    <div class="mobile-card-grid__toolbar" v-if="showSizeControl">
      <span class="mobile-card-grid__toolbar-label" v-i18n>Size</span>
      <div class="mobile-card-grid__sizes" role="group" aria-label="Card size">
        <button
          v-for="opt in sizeOptions"
          :key="opt"
          type="button"
          class="mobile-card-grid__size"
          :class="{'mobile-card-grid__size--active': gridSize === opt}"
          :aria-pressed="gridSize === opt"
          :data-test="'mobile-card-size-' + opt"
          @click="setGridSize(opt)"
        >{{ opt.toUpperCase() }}</button>
      </div>
    </div>

    <p v-if="cards.length === 0" class="mobile-mode__note">
      <slot name="empty"><span v-i18n>No cards</span></slot>
    </p>

    <div
      v-else
      ref="grid"
      class="mobile-card-grid"
      :class="'mobile-card-grid--' + gridSize"
      :style="gridStyle"
      data-test="mobile-card-grid"
    >
      <MobileCardTile
        v-for="card in cards"
        :key="card.name"
        :card="card"
        :scale="tileScale"
        :actionUsed="actionUsed"
        :cubeColor="cubeColor"
        :selected="isSelected(card)"
        :disabled="card.isDisabled === true || isSelectionLocked(card)"
        @open="onTileOpen"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import MobileCardTile from '@/client/components/mobile/MobileCardTile.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {Color} from '@/common/Color';
import {
  MOBILE_CARD_GRID_COLS,
  MobileCardGridSize,
  gridCardScale,
  loadMobileCardGridSize,
  saveMobileCardGridSize,
} from '@/client/components/mobile/mobileCardLayout';

const SIZE_OPTIONS: ReadonlyArray<MobileCardGridSize> = ['s', 'm', 'l'];

export default defineComponent({
  name: 'MobileCardGrid',
  components: {MobileCardTile},
  props: {
    cards: {
      type: Array as () => Array<CardModel>,
      required: true,
    },
    showSizeControl: {
      type: Boolean,
      default: true,
    },
    actionUsed: {
      type: Boolean,
      default: false,
    },
    cubeColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
    /** When set, taps toggle selection instead of only emitting open. */
    selectedNames: {
      type: Array as () => Array<CardName>,
      default: undefined,
    },
    /** Max selectable cards; used to grey out unselected when at cap. */
    maxSelected: {
      type: Number,
      default: undefined,
    },
  },
  emits: ['open', 'toggle'],
  data() {
    return {
      gridSize: loadMobileCardGridSize() as MobileCardGridSize,
      gridWidth: 360,
      resizeObserver: null as ResizeObserver | null,
      sizeOptions: SIZE_OPTIONS,
    };
  },
  computed: {
    columns(): number {
      return MOBILE_CARD_GRID_COLS[this.gridSize];
    },
    tileScale(): number {
      return gridCardScale(this.gridWidth, this.columns, 8);
    },
    gridStyle(): Record<string, string> {
      return {
        gridTemplateColumns: `repeat(${this.columns}, minmax(0, 1fr))`,
      };
    },
    selectionEnabled(): boolean {
      return this.selectedNames !== undefined;
    },
  },
  methods: {
    setGridSize(size: MobileCardGridSize) {
      this.gridSize = size;
      saveMobileCardGridSize(size);
      this.$nextTick(() => this.measure());
    },
    measure() {
      const el = this.$refs.grid as HTMLElement | undefined;
      if (el === undefined) {
        return;
      }
      this.gridWidth = Math.max(120, el.clientWidth);
    },
    isSelected(card: CardModel): boolean {
      return this.selectedNames?.includes(card.name) === true;
    },
    isSelectionLocked(card: CardModel): boolean {
      if (!this.selectionEnabled || this.maxSelected === undefined) {
        return false;
      }
      if (this.isSelected(card)) {
        return false;
      }
      return (this.selectedNames?.length ?? 0) >= this.maxSelected;
    },
    onTileOpen(card: CardModel) {
      if (this.selectionEnabled) {
        if (card.isDisabled === true || this.isSelectionLocked(card)) {
          return;
        }
        this.$emit('toggle', card);
        return;
      }
      this.$emit('open', card);
    },
  },
  mounted() {
    this.measure();
    const el = this.$refs.grid as HTMLElement | undefined;
    if (el !== undefined && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(el);
    }
    window.addEventListener('resize', this.measure);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.measure);
  },
  updated() {
    this.measure();
  },
});
</script>
