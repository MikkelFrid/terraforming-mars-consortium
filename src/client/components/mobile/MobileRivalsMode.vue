<template>
  <section class="mobile-mode mobile-mode--rivals">
    <h2 class="mobile-mode__title" v-i18n>Players</h2>
    <ul class="mobile-rivals">
      <li
        v-for="p in playerView.players"
        :key="p.color"
        class="mobile-rivals__row"
        :class="['mobile-rivals__row--' + p.color, {'mobile-rivals__row--self': p.color === thisPlayer.color}]"
      >
        <div class="mobile-rivals__name">
          <span class="mobile-rivals__pip"></span>
          {{ p.name }}
          <span v-if="p.isActive" class="mobile-rivals__status" v-i18n>active</span>
        </div>
        <div class="mobile-rivals__stats">
          <span>TR {{ p.terraformRating }}</span>
          <span>VP {{ p.victoryPointsBreakdown.total }}</span>
          <span>M€ {{ p.megacredits }}</span>
          <span v-if="showIridium">Ir {{ p.iridium }}</span>
          <span>Cards {{ p.cardsInHandNbr }}</span>
        </div>
      </li>
    </ul>
    <p class="mobile-mode__hint" v-i18n>
      Full opponent tableau sheets arrive in a later mobile phase.
    </p>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'MobileRivalsMode',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    showIridium(): boolean {
      return this.playerView.game.gameOptions.expansions.consortium === true;
    },
  },
});
</script>
