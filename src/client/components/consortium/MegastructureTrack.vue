<template>
  <div
    class="megastructure-track"
    :class="{
      'megastructure-track--completed': structure.completed,
      'megastructure-track--eligible': structure.canContribute,
      'megastructure-track--highlighted': highlighted,
      'megastructure-track--bridge': structure.kind === 'bridge',
    }"
    :data-test="'megastructure-' + structure.id"
    :data-structure-id="structure.id"
    @mouseenter="onHover(true)"
    @mouseleave="onHover(false)"
    @focusin="onHover(true)"
    @focusout="onHover(false)"
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

      <div
        class="megastructure-track__outcome"
        data-test="outcome"
        :title="structure.outcome"
      >
        <template v-if="structure.outcomeChips && structure.outcomeChips.length > 0">
          <span
            v-for="(chip, idx) in structure.outcomeChips"
            :key="idx"
            class="megastructure-outcome-chip"
            data-test="outcome-chip"
          >
            <span v-if="chip.label" class="megastructure-outcome-chip__label" v-i18n>{{ chip.label }}</span>
            <span v-if="chip.icons && chip.icons.length > 0" class="megastructure-outcome-chip__icons">
              <span
                v-for="(icon, j) in chip.icons"
                :key="j"
                class="megastructure-reward"
                :class="{'megastructure-reward--production': icon.production}"
                data-test="outcome-icon"
                :data-reward-kind="icon.kind"
              >
                <i :class="iconClass(icon.kind)">
                  <span v-if="icon.text && showsTextOnIcon(icon.kind)" class="megastructure-reward__text">{{ icon.text }}</span>
                </i>
                <span
                  v-if="icon.text && !showsTextOnIcon(icon.kind)"
                  class="megastructure-reward__aside"
                >{{ icon.text }}</span>
              </span>
            </span>
            <span v-if="chip.suffix" class="megastructure-outcome-chip__suffix" v-i18n>{{ chip.suffix }}</span>
          </span>
        </template>
        <span v-else v-i18n>{{ structure.outcome }}</span>
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
          >
            <i class="resource_icon resource_icon--iridium megastructure-segment__iridium-icon"></i>
            {{ seg.keystoneMinIridium ?? structure.keystoneMinIridium }}
          </span>
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
          :title="ineligibilityText(structure.ineligibility)"
        >{{ ineligibilityText(structure.ineligibility) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  MegastructureModel,
  MegastructureSegmentModel,
  MegastructureIneligibility,
  MegastructureRewardIconKind,
} from '@/common/models/MegastructuresModel';

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
    highlighted: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['contribute', 'highlight-sector'],
  computed: {
    nextCostLabel(): string {
      const cost = this.structure.nextSegmentCost;
      if (cost === undefined) {
        return '';
      }
      if (this.structure.nextIsKeystone || this.structure.nextMinIridium > 0) {
        return `${cost} M€ · ${this.structure.keystoneMinIridium} Ir keystone`;
      }
      return `${cost} M€`;
    },
  },
  methods: {
    onHover(enter: boolean) {
      if (this.structure.kind !== 'bridge' || this.structure.sector === undefined) {
        return;
      }
      this.$emit('highlight-sector', enter ? this.structure.sector : undefined);
    },
    showsTextOnIcon(kind: MegastructureRewardIconKind): boolean {
      return kind === 'megacredits' || kind === 'vp';
    },
    iconClass(kind: MegastructureRewardIconKind): string {
      switch (kind) {
      case 'megacredits':
        return 'resource_icon resource_icon--megacredits';
      case 'heat':
        return 'resource_icon resource_icon--heat';
      case 'plants':
        return 'resource_icon resource_icon--plants';
      case 'titanium':
        return 'resource_icon resource_icon--titanium';
      case 'iridium':
        return 'resource_icon resource_icon--iridium';
      case 'temperature':
        return 'tile temperature-tile megastructure-reward__temperature';
      case 'vp':
        return 'megastructure-reward__vp';
      case 'space':
        return 'resource-tag tag-space megastructure-reward__tag';
      }
    },
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
        return 'Need highland';
      case 'completed':
        return 'Complete';
      }
    },
  },
});
</script>
