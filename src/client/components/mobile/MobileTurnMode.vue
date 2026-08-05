<template>
  <section class="mobile-mode mobile-mode--turn">
    <!-- Buy/select takes the screen — don't stack a huge tableau above it -->
    <template v-if="isCardSelectPending">
      <h2 class="mobile-mode__title" v-i18n>Actions</h2>
      <WaitingFor
        :playerView="playerView"
        :waitingfor="playerView.waitingFor"
      />
      <p class="mobile-mode__hint mobile-turn-cards__hint">
        <button
          type="button"
          class="mobile-turn-cards__all"
          data-test="mobile-turn-open-empire"
          @click="$emit('open-empire')"
          v-i18n
        >All cards</button>
      </p>
    </template>

    <template v-else>
      <div class="mobile-turn-cards" data-test="mobile-turn-cards">
        <div class="mobile-turn-cards__header">
          <h3 class="mobile-turn-cards__title" v-i18n>Your cards</h3>
        </div>
        <MobileCardGrid
          :cards="previewCards"
          :cubeColor="thisPlayer.color"
          @open="openFocus"
        >
          <template #toolbar-end>
            <button
              type="button"
              class="mobile-turn-cards__all"
              data-test="mobile-turn-open-empire"
              @click="$emit('open-empire')"
              v-i18n
            >All cards</button>
          </template>
          <template #empty>
            <span v-i18n>No cards yet</span>
          </template>
        </MobileCardGrid>
        <p v-if="hand.length === 0 && tableau.length > 0" class="mobile-turn-cards__hint" v-i18n>
          Hand is empty — showing played cards. Open Empire for the full tableau.
        </p>
      </div>

      <h2 class="mobile-mode__title" v-i18n>Actions</h2>
      <WaitingFor
        v-if="game.phase !== 'end'"
        :playerView="playerView"
        :waitingfor="playerView.waitingFor"
      />
      <p v-else class="mobile-mode__note" v-i18n>This game is over!</p>
    </template>

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
import MobileCardGrid from '@/client/components/mobile/MobileCardGrid.vue';
import MobileCardFocusSheet from '@/client/components/mobile/MobileCardFocusSheet.vue';
import {CardModel} from '@/common/models/CardModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';

export default defineComponent({
  name: 'MobileTurnMode',
  components: {WaitingFor, MobileCardGrid, MobileCardFocusSheet},
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
    previewCards(): Array<CardModel> {
      if (this.hand.length > 0) {
        return this.hand;
      }
      return this.tableau;
    },
    /** Research buy / draft-style SelectCard — give it the full Turn surface. */
    isCardSelectPending(): boolean {
      return this.playerView.waitingFor?.type === 'card';
    },
  },
  methods: {
    openFocus(card: CardModel) {
      this.focused = card;
    },
  },
});
</script>
