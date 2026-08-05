<template>
  <article
    class="mobile-player-sheet"
    :class="[
      'mobile-player-sheet--' + player.color,
      {
        'mobile-player-sheet--self': isSelf,
        'mobile-player-sheet--active': player.isActive,
      },
    ]"
    :data-test="'mobile-player-sheet-' + player.color"
  >
    <header class="mobile-player-sheet__header">
      <div class="mobile-player-sheet__identity">
        <span class="mobile-player-sheet__pip" aria-hidden="true"></span>
        <div class="mobile-player-sheet__names">
          <div class="mobile-player-sheet__name">
            {{ displayName }}
            <span v-if="isSelf" class="mobile-player-sheet__you" v-i18n>You</span>
          </div>
          <div v-if="corporationName" class="mobile-player-sheet__corp" v-i18n>
            {{ corporationName }}
          </div>
        </div>
      </div>
      <div class="mobile-player-sheet__badges">
        <span v-if="player.isActive" class="mobile-player-sheet__badge mobile-player-sheet__badge--active" v-i18n>
          Active
        </span>
        <span v-if="firstForGen" class="mobile-player-sheet__badge" v-i18n>1st</span>
      </div>
    </header>

    <div class="mobile-player-sheet__meta">
      <span class="mobile-player-sheet__stat"><abbr title="Terraform Rating">TR</abbr> {{ player.terraformRating }}</span>
      <span v-if="showVp" class="mobile-player-sheet__stat"><abbr title="Victory Points">VP</abbr> {{ player.victoryPointsBreakdown.total }}</span>
      <span class="mobile-player-sheet__stat"><span v-i18n>Cards</span> {{ player.cardsInHandNbr }}</span>
      <span class="mobile-player-sheet__stat"><span v-i18n>Played</span> {{ player.tableau.length }}</span>
      <span v-if="player.citiesCount > 0" class="mobile-player-sheet__stat"><span v-i18n>Cities</span> {{ player.citiesCount }}</span>
      <span v-if="showColonies && player.coloniesCount > 0" class="mobile-player-sheet__stat"><span v-i18n>Colonies</span> {{ player.coloniesCount }}</span>
    </div>

    <div class="mobile-player-sheet__resources" data-test="mobile-player-resources">
      <PlayerResources :player="player"/>
    </div>
  </article>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import PlayerResources from '@/client/components/overview/PlayerResources.vue';
import {PublicPlayerModel, ViewModel} from '@/common/models/PlayerModel';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';

export default defineComponent({
  name: 'MobilePlayerSheet',
  components: {PlayerResources},
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    firstForGen: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isSelf(): boolean {
      return this.player.color === this.playerView.thisPlayer?.color;
    },
    displayName(): string {
      return this.player.name;
    },
    corporationName(): string {
      const corps = this.player.tableau
        .filter((card) => getCard(card.name)?.type === CardType.CORPORATION)
        .map((card) => card.name);
      return corps[0] ?? '';
    },
    showVp(): boolean {
      if (this.isSelf) {
        return true;
      }
      return this.playerView.game.gameOptions.showOtherPlayersVP === true;
    },
    showColonies(): boolean {
      return this.playerView.game.gameOptions.expansions.colonies === true;
    },
  },
});
</script>
