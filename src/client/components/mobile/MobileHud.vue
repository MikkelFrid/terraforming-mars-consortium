<template>
  <header class="mobile-hud" :class="'mobile-hud--' + player.color">
    <div class="mobile-hud__row mobile-hud__row--meta">
      <div class="mobile-hud__meta-main">
        <span class="mobile-hud__gen"><span v-i18n>Gen</span> {{ game.generation }}</span>
        <span class="mobile-hud__phase">{{ phaseLabel }}</span>
        <span class="mobile-hud__tr">TR {{ player.terraformRating }}</span>
      </div>
      <span
        v-if="isYourTurn"
        class="mobile-hud__acting mobile-hud__acting--you"
        data-test="mobile-hud-turn"
        v-i18n
      >Your turn</span>
      <span
        v-else-if="activePlayerName"
        class="mobile-hud__acting mobile-hud__acting--other"
        data-test="mobile-hud-turn"
      >
        <span
          class="mobile-hud__acting-pip"
          :class="'player_bg_color_' + activePlayerColor"
          aria-hidden="true"
        ></span>
        <span class="mobile-hud__acting-text">
          <span class="mobile-hud__acting-kicker" v-i18n>Turn</span>
          <span class="mobile-hud__acting-name">{{ activePlayerName }}</span>
        </span>
      </span>
    </div>
    <div class="mobile-hud__row mobile-hud__row--params">
      <span class="mobile-hud__param">T {{ game.temperature }}°</span>
      <span class="mobile-hud__param">O₂ {{ game.oxygenLevel }}%</span>
      <span class="mobile-hud__param">Ocean {{ game.oceans }}</span>
      <span v-if="game.gameOptions.expansions.venus" class="mobile-hud__param">Venus {{ game.venusScaleLevel }}</span>
    </div>
    <div class="mobile-hud__row mobile-hud__row--resources">
      <span class="mobile-hud__res" title="M€">
        <i class="resource_icon resource_icon--megacredits"></i>{{ player.megacredits }}
      </span>
      <span class="mobile-hud__res" title="Steel">
        <i class="resource_icon resource_icon--steel"></i>{{ player.steel }}
      </span>
      <span class="mobile-hud__res" title="Titanium">
        <i class="resource_icon resource_icon--titanium"></i>{{ player.titanium }}
      </span>
      <span
        v-if="showIridium"
        class="mobile-hud__res mobile-hud__res--iridium"
        title="Iridium"
      >
        <i class="resource_icon resource_icon--iridium"></i>{{ player.iridium }}
      </span>
      <span class="mobile-hud__res" title="Plants">
        <i class="resource_icon resource_icon--plants"></i>{{ player.plants }}
      </span>
      <span class="mobile-hud__res" title="Energy">
        <i class="resource_icon resource_icon--energy"></i>{{ player.energy }}
      </span>
      <span class="mobile-hud__res" title="Heat">
        <i class="resource_icon resource_icon--heat"></i>{{ player.heat }}
      </span>
    </div>
  </header>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Color} from '@/common/Color';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'MobileHud',
  props: {
    game: {
      type: Object as () => GameModel,
      required: true,
    },
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    isYourTurn: {
      type: Boolean,
      default: false,
    },
    activePlayerName: {
      type: String,
      default: '',
    },
    activePlayerColor: {
      type: String as PropType<Color | ''>,
      default: '',
    },
  },
  computed: {
    showIridium(): boolean {
      return this.game.gameOptions.expansions.consortium === true || this.player.iridium > 0;
    },
    phaseLabel(): string {
      return this.game.phase;
    },
  },
});
</script>
