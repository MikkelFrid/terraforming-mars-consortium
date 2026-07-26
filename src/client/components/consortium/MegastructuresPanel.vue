<template>
  <div v-if="megastructures" class="megastructures_cont" data-test="megastructures-panel">
    <div class="megastructures">
      <div class="ma-title">
        <a
          class="ma-clickable"
          href="#"
          data-test="toggle-megastructures"
          @click.prevent="toggleList()"
          v-i18n
        >Megastructures</a>
        <span
          v-for="s in completedStructures"
          :key="s.id"
          class="milestone-award-inline paid"
          :title="s.name"
        >
          <span v-i18n>{{ s.name }}</span>
        </span>
      </div>
      <div v-show="showDetails" data-test="megastructures-details">
        <MegastructureTrack
          v-for="structure in megastructures.structures"
          :key="structure.id"
          :structure="structure"
          :canAct="canAct"
          @contribute="onContribute"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {MegastructuresModel} from '@/common/models/MegastructuresModel';
import {MegastructureId} from '@/common/consortium/MegastructureKind';
import {Preferences, PreferencesManager} from '@/client/utils/PreferencesManager';
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
    preferences: {
      type: Object as () => Readonly<Preferences>,
      default: () => PreferencesManager.INSTANCE.values(),
    },
  },
  emits: ['contribute'],
  data() {
    // Default collapsed — mirrors Turmoil Policies (visibility defaults false)
    // and keeps five tracks from fighting the Consortium board for space.
    return {
      showDetails: this.preferences?.show_megastructure_details === true,
    };
  },
  computed: {
    completedStructures() {
      return this.megastructures?.structures.filter((s) => s.completed) ?? [];
    },
  },
  methods: {
    toggleList() {
      this.showDetails = !this.showDetails;
      PreferencesManager.INSTANCE.set('show_megastructure_details', this.showDetails);
    },
    onContribute(id: MegastructureId) {
      this.$emit('contribute', id);
    },
  },
});
</script>
