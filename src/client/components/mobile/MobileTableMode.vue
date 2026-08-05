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

    <div
      v-if="showMilestonesAndAwards"
      class="mobile-table-ma player_home_block--milestones-and-awards"
      data-test="mobile-table-ma"
    >
      <Milestones :milestones="game.milestones"/>
      <Awards :awards="game.awards"/>
    </div>

    <div
      v-if="game.colonies.length > 0"
      class="mobile-table-colonies player_home_block"
      data-test="mobile-table-colonies"
    >
      <h3 class="mobile-mode__title" v-i18n>Colonies</h3>
      <div class="colonies-fleets-cont">
        <div
          class="colonies-player-fleets"
          v-for="colonyPlayer in playerView.players"
          :key="colonyPlayer.color"
        >
          <div
            v-for="idx in fleetsCountRange(colonyPlayer)"
            :key="idx"
            :class="'colonies-fleet colonies-fleet-' + colonyPlayer.color"
          ></div>
        </div>
      </div>
      <div class="player_home_colony_cont">
        <div
          class="player_home_colony"
          v-for="colony in game.colonies"
          :key="colony.name"
        >
          <Colony :colony="colony" :active="colony.isActive"/>
        </div>
      </div>
    </div>

    <p class="mobile-mode__hint" v-i18n>
      Drag to pan, pinch to zoom. Tap a Bridge to highlight its frontier. Scroll for milestones, awards, and colonies. Use Turn for actions.
    </p>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import Board from '@/client/components/Board.vue';
import BoardCamera from '@/client/components/mobile/BoardCamera.vue';
import MegastructuresPanel from '@/client/components/consortium/MegastructuresPanel.vue';
import Milestones from '@/client/components/Milestones.vue';
import Awards from '@/client/components/Awards.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
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
  components: {
    Board,
    BoardCamera,
    MegastructuresPanel,
    Milestones,
    Awards,
    Colony,
  },
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
    showMilestonesAndAwards(): boolean {
      return this.playerView.players.length > 1;
    },
  },
  methods: {
    onHighlightSector(sector: number | undefined) {
      this.highlightSector = sector;
    },
    fleetsCountRange(player: PublicPlayerModel): Array<number> {
      const fleetsRange: Array<number> = [];
      for (let i = 0; i < player.fleetSize - player.tradesThisGeneration; i++) {
        fleetsRange.push(i);
      }
      return fleetsRange;
    },
  },
});
</script>
