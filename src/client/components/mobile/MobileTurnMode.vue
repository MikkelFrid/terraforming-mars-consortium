<template>
  <section class="mobile-mode mobile-mode--turn">
    <div class="mobile-turn-cards" data-test="mobile-turn-cards">
      <div class="mobile-turn-cards__header">
        <h3 class="mobile-turn-cards__title" v-i18n>Your cards</h3>
        <button
          type="button"
          class="mobile-turn-cards__all"
          data-test="mobile-turn-open-empire"
          @click="$emit('open-empire')"
          v-i18n
        >All cards</button>
      </div>
      <p v-if="hand.length === 0 && tableau.length === 0" class="mobile-mode__note" v-i18n>
        No cards yet
      </p>
      <div v-else class="mobile-card-scroller" data-test="mobile-turn-card-scroller">
        <MobileCardTile
          v-for="card in previewCards"
          :key="card.name"
          :card="card"
          size="hand"
          :cubeColor="thisPlayer.color"
          @open="openFocus"
        />
      </div>
      <p v-if="hand.length === 0 && tableau.length > 0" class="mobile-turn-cards__hint" v-i18n>
        Hand is empty — showing played cards. Buy projects on research, or open Empire.
      </p>
    </div>

    <h2 class="mobile-mode__title" v-i18n>Actions</h2>
    <WaitingFor
      v-if="game.phase !== 'end'"
      :playerView="playerView"
      :waitingfor="playerView.waitingFor"
    />
    <p v-else class="mobile-mode__note" v-i18n>This game is over!</p>

    <Teleport to="body">
      <MobileCardFocusSheet
        v-if="focused !== undefined"
        :card="focused"
        :cubeColor="thisPlayer.color"
        @close="focused = undefined"
      />
    </Teleport>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import MobileCardTile from '@/client/components/mobile/MobileCardTile.vue';
import MobileCardFocusSheet from '@/client/components/mobile/MobileCardFocusSheet.vue';
import {CardModel} from '@/common/models/CardModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';

export default defineComponent({
  name: 'MobileTurnMode',
  components: {WaitingFor, MobileCardTile, MobileCardFocusSheet},
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  emits: ['open-empire'],
  data() {
    return {
      focused: undefined as CardModel | undefined,
    };
  },
  computed: {
    game(): GameModel {
      return this.playerView.game;
    },
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    hand(): Array<CardModel> {
      return this.playerView.preludeCardsInHand
        .concat(this.playerView.ceoCardsInHand)
        .concat(this.playerView.cardsInHand);
    },
    tableau(): Array<CardModel> {
      return this.thisPlayer.tableau;
    },
    /** Prefer hand; if empty (common after buying 0 projects), show played cards. */
    previewCards(): Array<CardModel> {
      if (this.hand.length > 0) {
        return this.hand;
      }
      return this.tableau;
    },
  },
  methods: {
    openFocus(card: CardModel) {
      this.focused = card;
    },
  },
});
</script>
