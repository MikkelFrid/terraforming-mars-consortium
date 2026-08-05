<template>
  <section class="mobile-mode mobile-mode--empire">
    <h2 class="mobile-mode__title" v-i18n>Cards In Hand</h2>
    <MobileCardGrid
      :cards="hand"
      data-test="mobile-hand"
      @open="openFocus"
    >
      <template #empty>
        <span v-i18n>No cards in hand</span>
      </template>
    </MobileCardGrid>

    <h2 class="mobile-mode__title" v-i18n>Played Cards</h2>
    <MobileCardGrid
      :cards="thisPlayer.tableau"
      :cubeColor="thisPlayer.color"
      :showSizeControl="false"
      data-test="mobile-tableau"
      @open="openFocus"
    />

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
import MobileCardGrid from '@/client/components/mobile/MobileCardGrid.vue';
import MobileCardFocusSheet from '@/client/components/mobile/MobileCardFocusSheet.vue';
import {CardModel} from '@/common/models/CardModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'MobileEmpireMode',
  components: {MobileCardGrid, MobileCardFocusSheet},
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
