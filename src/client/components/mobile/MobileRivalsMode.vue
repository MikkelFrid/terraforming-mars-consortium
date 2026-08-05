<template>
  <section class="mobile-mode mobile-mode--rivals">
    <h2 class="mobile-mode__title" v-i18n>Players</h2>
    <div class="mobile-rivals" data-test="mobile-rivals">
      <MobilePlayerSheet
        v-for="p in orderedPlayers"
        :key="p.color"
        :player="p"
        :playerView="playerView"
        :firstForGen="isFirstForGen(p)"
        @view-played="onViewPlayed"
      />
    </div>

    <Teleport to="body">
      <MobilePlayedCardsSheet
        v-if="viewingPlayer !== undefined"
        :player="viewingPlayer"
        @close="viewingPlayer = undefined"
      />
    </Teleport>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import MobilePlayerSheet from '@/client/components/mobile/MobilePlayerSheet.vue';
import MobilePlayedCardsSheet from '@/client/components/mobile/MobilePlayedCardsSheet.vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';

export default defineComponent({
  name: 'MobileRivalsMode',
  components: {MobilePlayerSheet, MobilePlayedCardsSheet},
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  emits: ['open-empire'],
  data() {
    return {
      viewingPlayer: undefined as PublicPlayerModel | undefined,
    };
  },
  computed: {
    /**
     * Active player first (whose turn / research focus), then seating order.
     * Everyone — including you — uses the same sheet with full resources.
     */
    orderedPlayers(): Array<PublicPlayerModel> {
      const players = this.playerView.players.slice();
      const activeIdx = players.findIndex((p) => p.isActive);
      if (activeIdx <= 0) {
        return players;
      }
      const [active] = players.splice(activeIdx, 1);
      return [active, ...players];
    },
  },
  methods: {
    isFirstForGen(player: PublicPlayerModel): boolean {
      return this.playerView.players.length > 1 &&
        this.playerView.players[0]?.color === player.color;
    },
    onViewPlayed(player: PublicPlayerModel) {
      // Your own tableau lives under Empire (hand + played).
      if (player.color === this.playerView.thisPlayer?.color) {
        this.$emit('open-empire');
        return;
      }
      this.viewingPlayer = player;
    },
  },
});
</script>
