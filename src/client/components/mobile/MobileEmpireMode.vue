<template>
  <section class="mobile-mode mobile-mode--empire">
    <h2 class="mobile-mode__title" v-i18n>Cards In Hand</h2>
    <div v-if="hand.length === 0" class="mobile-mode__note" v-i18n>No cards in hand</div>
    <div v-else class="mobile-card-scroller">
      <div v-for="card in hand" :key="card.name" class="mobile-card-scroller__item cardbox">
        <Card :card="card"/>
      </div>
    </div>

    <h2 class="mobile-mode__title" v-i18n>Played Cards</h2>
    <div class="mobile-card-scroller mobile-card-scroller--wrap">
      <div
        v-for="card in thisPlayer.tableau"
        :key="card.name"
        class="mobile-card-scroller__item cardbox"
      >
        <Card :card="card"/>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'MobileEmpireMode',
  components: {Card},
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
    hand(): Array<CardModel> {
      return this.playerView.preludeCardsInHand
        .concat(this.playerView.ceoCardsInHand)
        .concat(this.playerView.cardsInHand);
    },
  },
});
</script>
