<template>
  <section class="mobile-mode mobile-mode--turn">
    <h2 class="mobile-mode__title" v-i18n>Actions</h2>
    <WaitingFor
      v-if="game.phase !== 'end'"
      :playerView="playerView"
      :waitingfor="playerView.waitingFor"
    />
    <p v-else class="mobile-mode__note" v-i18n>This game is over!</p>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';

export default defineComponent({
  name: 'MobileTurnMode',
  components: {WaitingFor},
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  computed: {
    game(): GameModel {
      return this.playerView.game;
    },
  },
});
</script>
