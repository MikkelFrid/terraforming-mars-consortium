<template>
  <div id="mobile-player-home" class="mobile-player-home">
    <MobileHud
      :game="game"
      :player="thisPlayer"
      :isYourTurn="isYourTurn"
    />

    <main class="mobile-player-home__main">
      <template v-if="thisPlayer.tableau.length === 0">
        <section class="mobile-mode">
          <h2 class="mobile-mode__title" v-i18n>Setup</h2>
          <PlayerSetupView :playerView="playerView" :tileView="tileView"/>
        </section>
      </template>
      <template v-else>
        <MobileTurnMode v-if="mode === 'turn'" :playerView="playerView"/>
        <MobileTableMode
          v-else-if="mode === 'table'"
          :playerView="playerView"
          :tileView="tileView"
          :canContribute="canContributeMegastructure"
          :boardScale="tableScale"
          @toggleTileView="cycleTileView()"
          @contribute="contributeMegastructure"
        />
        <MobileEmpireMode v-else-if="mode === 'empire'" :playerView="playerView"/>
        <MobileRivalsMode v-else-if="mode === 'rivals'" :playerView="playerView"/>
        <MobileMoreMode v-else-if="mode === 'more'" :playerView="playerView"/>
      </template>
    </main>

    <MobileBottomNav
      v-if="thisPlayer.tableau.length > 0"
      :mode="mode"
      :turnBadge="isYourTurn"
      @update:mode="setMode"
    />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {vueRoot} from '@/client/components/vueRoot';
import MobileHud from '@/client/components/mobile/MobileHud.vue';
import MobileBottomNav from '@/client/components/mobile/MobileBottomNav.vue';
import MobileTurnMode from '@/client/components/mobile/MobileTurnMode.vue';
import MobileTableMode from '@/client/components/mobile/MobileTableMode.vue';
import MobileEmpireMode from '@/client/components/mobile/MobileEmpireMode.vue';
import MobileRivalsMode from '@/client/components/mobile/MobileRivalsMode.vue';
import MobileMoreMode from '@/client/components/mobile/MobileMoreMode.vue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import {HomeMixin} from '@/client/mixins/HomeMixin';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';
import {MobileMode} from '@/client/components/mobile/mobileModes';
import {applyClientViewport} from '@/client/utils/mobileClient';
import {MegastructureId} from '@/common/consortium/MegastructureKind';
import {buildContributeResponse} from '@/client/utils/megastructureContribute';
import {submitPlayerInput} from '@/client/utils/turnSession';
import {Phase} from '@/common/Phase';

type DataModel = {
  mode: MobileMode;
  tableScale: number;
}

export default defineComponent({
  name: 'MobilePlayerHome',
  mixins: [HomeMixin],
  components: {
    MobileHud,
    MobileBottomNav,
    MobileTurnMode,
    MobileTableMode,
    MobileEmpireMode,
    MobileRivalsMode,
    MobileMoreMode,
    PlayerSetupView,
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  data(): DataModel {
    return {
      mode: 'turn',
      tableScale: 0.55,
    };
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
    isYourTurn(): boolean {
      const w = this.playerView.waitingFor;
      return w !== undefined && w.optional !== true;
    },
    canContributeMegastructure(): boolean {
      return this.isYourTurn && this.game.phase === Phase.ACTION;
    },
  },
  watch: {
    isYourTurn: {
      immediate: true,
      handler(isTurn: boolean) {
        if (isTurn && this.thisPlayer.tableau.length > 0) {
          this.mode = 'turn';
        }
      },
    },
  },
  methods: {
    setMode(mode: MobileMode) {
      this.mode = mode;
    },
    updateTableScale() {
      const width = window.innerWidth || 390;
      const boardWidth = this.game.gameOptions.expansions.consortium ? 900 : 680;
      this.tableScale = Math.min(1, Math.max(0.35, (width - 16) / boardWidth));
    },
    contributeMegastructure(id: MegastructureId) {
      const response = buildContributeResponse(this.playerView.waitingFor, id);
      if (response === undefined) {
        vueRoot(this).showAlert(
          'Cannot contribute',
          'Megastructure contribute is not available in the current action list. Open Turn and use Actions.',
        );
        this.mode = 'turn';
        return;
      }
      const root = vueRoot(this);
      submitPlayerInput({
        getId: () => this.playerView.id,
        getRunId: () => this.playerView.runId,
        getGameAge: () => this.game.gameAge,
        getUndoCount: () => this.game.undoCount,
        isServerBusy: () => root.isServerSideRequestInProgress,
        setServerBusy: (busy) => {
          root.isServerSideRequestInProgress = busy;
        },
        showAlert: (t, m, cb) => root.showAlert(t, m, cb),
        onPlayerView: (pv) => {
          root.screen = 'empty';
          root.playerView = pv;
          root.playerkey++;
          root.screen = 'player-home';
        },
        refreshParticipant: () => root.updatePlayer(),
        isPlayer: () => true,
      }, response);
    },
  },
  mounted() {
    applyClientViewport('mobile');
    this.updateTableScale();
    window.addEventListener('resize', this.updateTableScale);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateTableScale);
    applyClientViewport('desktop');
  },
});
</script>
