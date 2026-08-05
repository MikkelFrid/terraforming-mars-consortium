<template>
  <div v-if="megastructures" class="megastructures_cont" data-test="megastructures-panel">
    <div class="megastructures">
      <div class="megastructures__title" data-test="megastructures-title" v-i18n>Megastructures</div>
      <p class="megastructures__hint" data-test="megastructures-hint" v-i18n>
        Tap a Bridge to highlight its frontier. Contribute when eligible — rewards pay out when a track completes.
      </p>
      <div class="megastructures__grid" data-test="megastructures-details">
        <MegastructureTrack
          v-for="structure in megastructures.structures"
          :key="structure.id"
          :structure="structure"
          :canAct="canAct"
          :highlighted="isHighlighted(structure)"
          @contribute="onContribute"
          @highlight-sector="onHighlightSector"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {MegastructuresModel, MegastructureModel} from '@/common/models/MegastructuresModel';
import {MegastructureId} from '@/common/consortium/MegastructureKind';
import MegastructureTrack from '@/client/components/consortium/MegastructureTrack.vue';

export default defineComponent({
  name: 'MegastructuresPanel',
  components: {MegastructureTrack},
  props: {
    megastructures: {
      type: Object as () => MegastructuresModel | undefined,
      required: false,
    },
    /** Viewing player may submit contribute actions. */
    canAct: {
      type: Boolean,
      default: false,
    },
    /** Currently highlighted bridge sector (from parent / board sync). */
    highlightSector: {
      type: Number as () => number | undefined,
      default: undefined,
    },
  },
  emits: ['contribute', 'highlight-sector'],
  methods: {
    isHighlighted(structure: MegastructureModel): boolean {
      return structure.kind === 'bridge' &&
        structure.sector !== undefined &&
        structure.sector === this.highlightSector;
    },
    onContribute(id: MegastructureId) {
      this.$emit('contribute', id);
    },
    onHighlightSector(sector: number | undefined) {
      this.$emit('highlight-sector', sector);
    },
  },
});
</script>
