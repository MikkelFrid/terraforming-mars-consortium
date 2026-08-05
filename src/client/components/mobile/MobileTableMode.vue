<template>
  <section class="mobile-mode mobile-mode--table">
    <div class="mobile-table-scroll">
      <div class="mobile-table-scale" :style="scaleStyle">
        <GameBoardView
          :game="game"
          :tileView="tileView"
          :players="playerView.players"
          :canContribute="canContribute"
          @toggleTileView="$emit('toggleTileView')"
          @contribute="$emit('contribute', $event)"
        />
      </div>
    </div>
    <p class="mobile-mode__hint" v-i18n>
      Scroll the board. Pinch-zoom the page is not required — use Turn for actions.
    </p>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';
import {TileView} from '@/client/components/board/TileView';

export default defineComponent({
  name: 'MobileTableMode',
  components: {GameBoardView},
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    tileView: {
      type: String as PropType<TileView>,
      required: true,
    },
    canContribute: {
      type: Boolean,
      default: false,
    },
    /** CSS scale so the classic 670px board roughly fits the phone width. */
    boardScale: {
      type: Number,
      default: 0.55,
    },
  },
  emits: ['toggleTileView', 'contribute'],
  computed: {
    game(): GameModel {
      return this.playerView.game;
    },
    scaleStyle(): Record<string, string> {
      const s = this.boardScale;
      return {
        transform: `scale(${s})`,
        transformOrigin: 'top left',
        width: `${100 / s}%`,
      };
    },
  },
});
</script>
