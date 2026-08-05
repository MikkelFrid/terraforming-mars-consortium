<template>
  <div
    class="mobile-played-sheet"
    role="dialog"
    aria-modal="true"
    :aria-label="title"
    @keydown.esc.prevent="$emit('close')"
  >
    <button
      type="button"
      class="mobile-played-sheet__backdrop"
      aria-label="Close"
      @click="$emit('close')"
    ></button>
    <div class="mobile-played-sheet__panel" data-test="mobile-played-sheet">
      <header class="mobile-played-sheet__header">
        <h2 class="mobile-played-sheet__title">{{ title }}</h2>
        <button
          type="button"
          class="mobile-played-sheet__close"
          @click="$emit('close')"
          v-i18n
        >Close</button>
      </header>

      <MobileCardGrid
        :cards="player.tableau"
        :cubeColor="player.color"
        :showSizeControl="true"
        @open="openFocus"
      >
        <template #empty>
          <span v-i18n>No played cards</span>
        </template>
      </MobileCardGrid>
    </div>

    <Teleport to="body">
      <MobileCardFocusSheet
        v-if="focused !== undefined"
        :card="focused"
        :cubeColor="player.color"
        @close="focused = undefined"
      />
    </Teleport>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import MobileCardGrid from '@/client/components/mobile/MobileCardGrid.vue';
import MobileCardFocusSheet from '@/client/components/mobile/MobileCardFocusSheet.vue';
import {CardModel} from '@/common/models/CardModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'MobilePlayedCardsSheet',
  components: {MobileCardGrid, MobileCardFocusSheet},
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
  },
  emits: ['close'],
  data() {
    return {
      focused: undefined as CardModel | undefined,
    };
  },
  computed: {
    title(): string {
      return `${this.player.name} — played cards`;
    },
  },
  methods: {
    openFocus(card: CardModel) {
      this.focused = card;
    },
  },
});
</script>
