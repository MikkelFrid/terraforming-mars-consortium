<template>
  <button
    type="button"
    class="mobile-card-tile"
    :class="[sizeClass, {
      'mobile-card-tile--selected': selected,
      'mobile-card-tile--disabled': disabled,
    }]"
    :style="tileStyle"
    :disabled="disabled"
    :aria-pressed="selected ? 'true' : undefined"
    @click="$emit('open', card)"
  >
    <span v-if="selected" class="mobile-card-tile__check" aria-hidden="true">✓</span>
    <div class="mobile-card-tile__scale" :style="scaleStyle">
      <Card :card="card" :actionUsed="actionUsed" :cubeColor="cubeColor"/>
    </div>
  </button>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';
import {Color} from '@/common/Color';
import {
  CARD_CHROME_SIDE_PX,
  CARD_CHROME_TOP_PX,
  CARD_DESIGN_HEIGHT_PX,
  CARD_DESIGN_WIDTH_PX,
  CARD_TILE_ASPECT_RATIO,
  gridTileSize,
} from '@/client/components/mobile/mobileCardLayout';

export type MobileCardTileSize = 'hand' | 'thumb';

const LEGACY_SCALE: Record<MobileCardTileSize, number> = {
  hand: 0.75,
  thumb: 0.49,
};

export default defineComponent({
  name: 'MobileCardTile',
  components: {Card},
  props: {
    card: {
      type: Object as () => CardModel,
      required: true,
    },
    /** Legacy named size — ignored when `scale` is set. */
    size: {
      type: String as PropType<MobileCardTileSize>,
      default: 'hand',
    },
    /** Explicit scale of the design card (preferred for grids). */
    scale: {
      type: Number,
      default: undefined,
    },
    actionUsed: {
      type: Boolean,
      default: false,
    },
    cubeColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['open'],
  computed: {
    resolvedScale(): number {
      if (typeof this.scale === 'number' && Number.isFinite(this.scale) && this.scale > 0) {
        return this.scale;
      }
      return LEGACY_SCALE[this.size] ?? LEGACY_SCALE.hand;
    },
    sizeClass(): string {
      if (typeof this.scale === 'number') {
        return 'mobile-card-tile--scaled';
      }
      return 'mobile-card-tile--' + this.size;
    },
    tileStyle(): Record<string, string> | undefined {
      if (typeof this.scale !== 'number') {
        return undefined;
      }
      const box = gridTileSize(this.resolvedScale);
      return {
        width: `${box.width}px`,
        height: `${box.height}px`,
        aspectRatio: CARD_TILE_ASPECT_RATIO,
      };
    },
    scaleStyle(): Record<string, string> {
      const s = this.resolvedScale;
      return {
        transform: `scale(${s})`,
        /* Content box = face; padding = chrome gutter (see mobile.less). */
        width: `${CARD_DESIGN_WIDTH_PX}px`,
        height: `${CARD_DESIGN_HEIGHT_PX}px`,
        paddingTop: `${CARD_CHROME_TOP_PX}px`,
        paddingLeft: `${CARD_CHROME_SIDE_PX}px`,
        paddingRight: `${CARD_CHROME_SIDE_PX}px`,
        boxSizing: 'content-box',
      };
    },
  },
});
</script>
