<template>
  <div
    class="megastructure-track"
    :class="{
      'megastructure-track--completed': structure.completed,
      'megastructure-track--eligible': structure.canContribute,
    }"
    :data-test="'megastructure-' + structure.id"
    :data-structure-id="structure.id"
  >
    <div class="megastructure-track__emblem" :class="'megastructure-emblem--' + structure.id" :title="structure.name"></div>
    <div class="megastructure-track__body">
      <div class="megastructure-track__header">
        <span class="megastructure-track__name" data-test="structure-name" v-i18n>{{ structure.name }}</span>
        <span v-if="structure.completed" class="megastructure-track__complete-badge" data-test="complete-badge" v-i18n>Complete</span>
        <span v-else class="megastructure-track__cost" data-test="next-cost">
          <span v-i18n>Next</span>: {{ nextCostLabel }}
        </span>
      </div>

      <div class="megastructure-track__segments" data-test="segments">
        <div
          v-for="(seg, idx) in structure.segments"
          :key="idx"
          class="megastructure-segment"
          :class="segmentClasses(seg)"
          :data-test="seg.isKeystone ? 'segment-keystone' : 'segment'"
          :data-owner-color="seg.ownerColor || ''"
          :data-keystone-iridium="seg.isKeystone ? String(seg.keystoneMinIridium ?? structure.keystoneMinIridium) : undefined"
          :title="segmentTitle(seg, idx)"
        >
          <i v-if="seg.ownerColor" :class="'board-cube board-cube--' + seg.ownerColor"></i>
          <span
            v-if="seg.isKeystone"
            class="megastructure-segment__iridium"
            data-test="keystone-iridium"
          >{{ seg.keystoneMinIridium ?? structure.keystoneMinIridium }} Ir</span>
        </div>
      </div>

      <div v-if="structure.completed" class="megastructure-track__completion" data-test="completion-info">
        <div class="megastructure-track__contributors" data-test="contributors">
          <span
            v-for="c in structure.contributors"
            :key="c.color"
            class="megastructure-contributor"
          >
            <i :class="'board-cube board-cube--' + c.color"></i>
            {{ c.name }}: {{ c.count }}
            <span v-if="c.keystone" class="megastructure-contributor__keystone" v-i18n>(keystone)</span>
          </span>
        </div>
        <div v-if="structure.completionGranted" class="megastructure-track__granted" data-test="completion-granted">
          {{ structure.completionGranted }}
        </div>
      </div>

      <div v-else class="megastructure-track__status">
        <template v-if="structure.canContribute && canAct">
          <button
            type="button"
            class="btn btn-sm megastructure-track__contribute"
            data-test="contribute-button"
            @click="$emit('contribute', structure.id)"
            v-i18n
          >Contribute</button>
        </template>
        <span
          v-else-if="structure.ineligibility"
          class="megastructure-track__ineligible"
          data-test="ineligibility"
        >{{ ineligibilityText(structure.ineligibility) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {MegastructureModel, MegastructureSegmentModel, MegastructureIneligibility} from '@/common/models/MegastructuresModel';

export default defineComponent({
  name: 'MegastructureTrack',
  props: {
    structure: {
      type: Object as () => MegastructureModel,
      required: true,
    },
    /** When false, hide Contribute (spectator / not acting). */
    canAct: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['contribute'],
  computed: {
    nextCostLabel(): string {
      const cost = this.structure.nextSegmentCost;
      if (cost === undefined) {
        return '';
      }
      if (this.structure.nextIsKeystone || this.structure.nextMinIridium > 0) {
        return `${cost} M€ + min ${this.structure.keystoneMinIridium} iridium (keystone)`;
      }
      return `${cost} M€`;
    },
  },
  methods: {
    segmentClasses(seg: MegastructureSegmentModel): Array<string> {
      const classes = ['megastructure-segment'];
      if (seg.isKeystone) {
        classes.push('megastructure-segment--keystone');
      }
      if (seg.ownerColor !== undefined) {
        classes.push('megastructure-segment--filled');
        classes.push('megastructure-segment--' + seg.ownerColor);
      } else {
        classes.push('megastructure-segment--empty');
      }
      return classes;
    },
    segmentTitle(seg: MegastructureSegmentModel, idx: number): string {
      if (seg.isKeystone) {
        const min = seg.keystoneMinIridium ?? this.structure.keystoneMinIridium;
        return `Keystone (min ${min} iridium)`;
      }
      return 'Segment ' + (idx + 1);
    },
    ineligibilityText(reason: MegastructureIneligibility): string {
      switch (reason) {
      case 'cannot_afford':
        return 'Cannot afford';
      case 'missing_foundation':
        return 'Missing highland foundation';
      case 'completed':
        return 'Complete';
      }
    },
  },
});
</script>
