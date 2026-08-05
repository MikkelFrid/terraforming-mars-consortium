<template>
  <header class="mobile-hud" :class="'mobile-hud--' + player.color">
    <div class="mobile-hud__row mobile-hud__row--meta">
      <span class="mobile-hud__gen"><span v-i18n>Gen</span> {{ game.generation }}</span>
      <span class="mobile-hud__phase">{{ phaseLabel }}</span>
      <span
        class="mobile-hud__acting"
        :class="{'mobile-hud__acting--you': isYourTurn}"
        v-if="actingLabel"
        v-i18n
      >{{ actingLabel }}</span>
      <span class="mobile-hud__tr">TR {{ player.terraformRating }}</span>
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
import {defineComponent} from 'vue';
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
  },
  computed: {
    showIridium(): boolean {
      return this.game.gameOptions.expansions.consortium === true || this.player.iridium > 0;
    },
    phaseLabel(): string {
      return this.game.phase;
    },
    actingLabel(): string {
      if (this.isYourTurn) {
        return 'Your turn';
      }
      return '';
    },
  },
});
</script>
