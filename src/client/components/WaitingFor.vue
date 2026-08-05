<template>
  <div>
  <template v-if="waitingfor === undefined || waitingfor.optional">
    <template v-if="waitingfor === undefined">
      {{ $t('Not your turn to take any actions') }}
    </template>
    <template v-else>
      {{ $t('Waiting for other players') }}
    </template>
    <template v-if="playersWaitingFor.length > 0">
      (⌛ <span v-for="color in playersWaitingFor" class="log-player" :class="playerColorClass(color, 'bg')" :key="color">{{ getPlayerName(color) }}</span>)
    </template>
  </template>
  <div v-if="waitingfor !== undefined" class="wf-root">
    <template v-if="preferences().experimental_ui && playerView.game.phase === Phase.ACTION">
      <input type="checkbox" name="suspend" id="suspend-checkbox" v-model="suspend" @change="updateSuspend">
      <label for="suspend-checkbox">
        <span v-i18n>Suspend</span>
      </label>
      <div v-if="showRefresh()">Refresh<span class="reset"></span></div>
    </template>
    <PlayerInputFactory :players="playerView.players"
                          :playerView="playerView"
                          :playerinput="waitingfor"
                          :onsave="onsave"
                          :showsave="true"
                          :showtitle="true" />
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {vueRoot} from '@/client/components/vueRoot';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {playerColorClass} from '@/common/utils/utils';
import {PlayerViewModel, ViewModel} from '@/common/models/PlayerModel';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {Phase} from '@/common/Phase';
import {paths} from '@/common/app/paths';
import {InputResponse} from '@/common/inputs/InputResponse';
import {Color} from '@/common/Color';
import {gameDocumentTitle} from '../utils/documentTitle';
import {setFaviconStatus, setFaviconTurnFrame} from '@/client/utils/favicon';
import {isPlayerId} from '@/common/Types';
import {
  notifyYourTurn,
  resetPlayerInput,
  startWaitingForPoll,
  submitPlayerInput,
  TurnSessionHost,
  WaitingForPollHandle,
} from '@/client/utils/turnSession';

let documentTitleTimer: number | undefined;
let animationFrame = 0;

const TURN_SEQUENCE = '◑◒◐◓';

function isDesktopBrowser(): boolean {
  return !/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

type DataModel = {
  playersWaitingFor: Array<Color>
  suspend: boolean,
  savedPlayerView: PlayerViewModel | undefined;
  pollHandle: WaitingForPollHandle | undefined;
}

export default defineComponent({
  name: 'WaitingFor',
  props: {
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    waitingfor: {
      type: Object as () => PlayerInputModel | undefined,
      default: undefined,
    },
  },
  data(): DataModel {
    return {
      playersWaitingFor: [],
      suspend: false,
      savedPlayerView: undefined,
      pollHandle: undefined,
    };
  },
  methods: {
    turnHost(): TurnSessionHost {
      const root = vueRoot(this);
      return {
        getId: () => {
          if (this.playerView.id === undefined) {
            throw new Error('Missing participant id');
          }
          return this.playerView.id;
        },
        getRunId: () => this.playerView.runId,
        getGameAge: () => this.playerView.game.gameAge,
        getUndoCount: () => this.playerView.game.undoCount,
        isServerBusy: () => root.isServerSideRequestInProgress,
        setServerBusy: (busy) => {
          root.isServerSideRequestInProgress = busy;
        },
        showAlert: (title, message, cb) => root.showAlert(title, message, cb),
        onPlayerView: (playerView) => this.updatePlayerView(playerView),
        refreshParticipant: () => {
          if (isPlayerId(this.playerView.id)) {
            root.updatePlayer();
          } else {
            root.updateSpectator();
          }
        },
        isPlayer: () => isPlayerId(this.playerView.id),
      };
    },
    getPlayerName(color: Color): string {
      const player = this.playerView.players.find((p) => p.color === color);
      return player ? player.name : color;
    },
    animateTitle() {
      if (!getPreferences().animated_title) {
        return;
      }

      animationFrame = (animationFrame + 1) % TURN_SEQUENCE.length;
      const experimental = getPreferences().experimental_ui;
      if (experimental) {
        setFaviconTurnFrame(animationFrame);
      }
      if (!(experimental && isDesktopBrowser())) {
        document.title = TURN_SEQUENCE[animationFrame] + ' ' + gameDocumentTitle(this.playerView.game);
      }
    },
    onsave(out: InputResponse) {
      submitPlayerInput(this.turnHost(), out);
    },
    reset() {
      resetPlayerInput(this.turnHost());
    },
    updatePlayerView(playerView: PlayerViewModel | undefined) {
      if (this.suspend === false) {
        const root = vueRoot(this);
        root.screen = 'empty';
        root.playerView = playerView;
        root.playerkey++;
        root.screen = 'player-home';
        if (this.playerView.game.phase === 'end' && window.location.pathname !== paths.THE_END) {
          window.location = window.location as any as (string & Location);
        }
        this.savedPlayerView = undefined;
      } else {
        this.savedPlayerView = playerView;
      }
    },
    waitForUpdate() {
      this.pollHandle?.cancel();
      this.pollHandle = startWaitingForPoll(
        this.turnHost(),
        (colors) => {
          this.playersWaitingFor = colors;
        },
        () => notifyYourTurn(),
      );
    },
    updateSuspend() {
      if (this.suspend === false && this.savedPlayerView !== undefined) {
        this.updatePlayerView(this.savedPlayerView);
      }
    },
    showRefresh(): boolean {
      return this.suspend === true && this.savedPlayerView !== undefined;
    },
  },
  mounted() {
    document.title = gameDocumentTitle(this.playerView.game);
    if (getPreferences().experimental_ui) {
      setFaviconStatus(this.waitingfor !== undefined ? 'turn' : 'idle');
    }
    window.clearInterval(documentTitleTimer);
    if (this.waitingfor === undefined || this.waitingfor.optional) {
      this.waitForUpdate();
    }
    if (this.playerView.players.length > 1 && this.waitingfor !== undefined && !this.waitingfor.optional) {
      documentTitleTimer = window.setInterval(() => this.animateTitle(), 1000);
    }
  },
  beforeUnmount() {
    this.pollHandle?.cancel();
    window.clearInterval(documentTitleTimer);
  },
  computed: {
    Phase(): typeof Phase {
      return Phase;
    },
    preferences(): typeof getPreferences {
      return getPreferences;
    },
    playerColorClass(): typeof playerColorClass {
      return playerColorClass;
    },
  },
});

</script>
