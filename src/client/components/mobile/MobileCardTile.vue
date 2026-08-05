<template>
  <button
    type="button"
    class="mobile-card-tile"
    :class="'mobile-card-tile--' + size"
    @click="$emit('open', card)"
  >
    <div class="mobile-card-tile__scale">
      <Card :card="card" :actionUsed="actionUsed" :cubeColor="cubeColor"/>
    </div>
  </button>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';
import {Color} from '@/common/Color';

export type MobileCardTileSize = 'hand' | 'thumb';

export default defineComponent({
  name: 'MobileCardTile',
  components: {Card},
  props: {
    card: {
      type: Object as () => CardModel,
      required: true,
    },
    size: {
      type: String as PropType<MobileCardTileSize>,
      default: 'hand',
    },
    actionUsed: {
      type: Boolean,
      default: false,
    },
    cubeColor: {
      type: String as PropType<Color | undefined>,
      default: undefined,
    },
  },
  emits: ['open'],
});
</script>
