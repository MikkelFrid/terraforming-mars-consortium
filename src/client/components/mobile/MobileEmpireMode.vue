<template>
  <section class="mobile-mode mobile-mode--empire">
    <h2 class="mobile-mode__title" v-i18n>Cards In Hand</h2>
    <div v-if="hand.length === 0" class="mobile-mode__note" v-i18n>No cards in hand</div>
    <div v-else class="mobile-card-scroller" data-test="mobile-hand">
      <MobileCardTile
        v-for="card in hand"
        :key="card.name"
        :card="card"
        size="hand"
        @open="openFocus"
      />
    </div>

    <h2 class="mobile-mode__title" v-i18n>Played Cards</h2>
    <div class="mobile-card-scroller mobile-card-scroller--wrap" data-test="mobile-tableau">
      <MobileCardTile
        v-for="card in thisPlayer.tableau"
        :key="card.name"
        :card="card"
        size="thumb"
        :actionUsed="false"
        :cubeColor="thisPlayer.color"
        @open="openFocus"
      />
    </div>

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
import MobileCardTile from '@/client/components/mobile/MobileCardTile.vue';
import MobileCardFocusSheet from '@/client/components/mobile/MobileCardFocusSheet.vue';
import {CardModel} from '@/common/models/CardModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'MobileEmpireMode',
  components: {MobileCardTile, MobileCardFocusSheet},
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  data() {
    return {
      focused: undefined as CardModel | undefined,
    };
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    hand(): Array<CardModel> {
      return this.playerView.preludeCardsInHand
        .concat(this.playerView.ceoCardsInHand)
        .concat(this.playerView.cardsInHand);
    },
  },
  methods: {
    openFocus(card: CardModel) {
      this.focused = card;
    },
  },
});
</script>
