<template>
  <section class="mobile-mode mobile-mode--table">
    <BoardCamera
      class="mobile-table-camera"
      :contentWidth="boardContentWidth"
      :contentHeight="boardContentHeight"
    >
      <Board
        :spaces="game.spaces"
        :expansions="game.gameOptions.expansions"
        :venusScaleLevel="game.venusScaleLevel"
        :boardName="game.gameOptions.boardName"
        :oceans_count="game.oceans"
        :oxygen_level="game.oxygenLevel"
        :temperature="game.temperature"
        :altVenusBoard="game.gameOptions.altVenusBoard"
        :aresData="game.aresData"
        :tileView="tileView"
        :highlightBridgeSector="highlightSector"
        @toggleTileView="$emit('toggleTileView')"
        @highlight-sector="onHighlightSector"
      />
    </BoardCamera>

    <MegastructuresPanel
      v-if="game.megastructures"
      class="mobile-table-megastructures"
      :megastructures="game.megastructures"
      :canAct="canContribute"
      :highlightSector="highlightSector"
      @contribute="$emit('contribute', $event)"
      @highlight-sector="onHighlightSector"
    />

    <p class="mobile-mode__hint" v-i18n>
      Drag to pan, pinch to zoom. Tap a Bridge to highlight its frontier. Use Turn for actions.
    </p>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import Board from '@/client/components/Board.vue';
import BoardCamera from '@/client/components/mobile/BoardCamera.vue';
import MegastructuresPanel from '@/client/components/consortium/MegastructuresPanel.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';
import {TileView} from '@/client/components/board/TileView';

/** Design size of .board-cont (Tharsis-family). */
const BOARD_CONT_WIDTH = 670;
const BOARD_CONT_HEIGHT = 620;
/** Design size of Consortium .board-cont.board-consortium */
const CONSORTIUM_BOARD_WIDTH = 891;
const CONSORTIUM_BOARD_HEIGHT = 860;

export default defineComponent({
  name: 'MobileTableMode',
  components: {Board, BoardCamera, MegastructuresPanel},
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
    /** @deprecated Camera computes fit; kept for MobilePlayerHome compat. */
    boardScale: {
      type: Number,
      default: 0.55,
    },
  },
  emits: ['toggleTileView', 'contribute'],
  data() {
    return {
      highlightSector: undefined as number | undefined,
    };
  },
  computed: {
    game(): GameModel {
      return this.playerView.game;
    },
    isConsortium(): boolean {
      return this.game.gameOptions.expansions.consortium === true;
    },
    boardContentWidth(): number {
      return this.isConsortium ? CONSORTIUM_BOARD_WIDTH : BOARD_CONT_WIDTH;
    },
    boardContentHeight(): number {
      return this.isConsortium ? CONSORTIUM_BOARD_HEIGHT : BOARD_CONT_HEIGHT;
    },
  },
  methods: {
    onHighlightSector(sector: number | undefined) {
      this.highlightSector = sector;
    },
  },
});
</script>
