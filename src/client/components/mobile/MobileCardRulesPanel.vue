<template>
  <div class="mobile-card-rules" v-if="model">
    <header class="mobile-card-rules__header">
      <div class="mobile-card-rules__identity">
        <p class="mobile-card-rules__type">{{ model.typeLabel }}</p>
        <h2 class="mobile-card-rules__title" v-i18n>{{ model.name }}</h2>
      </div>
      <div class="mobile-card-rules__cost" v-if="showCost" aria-label="Cost">
        <span class="mobile-card-rules__cost-value">{{ effectiveCost }}</span>
        <span class="mobile-card-rules__cost-unit" v-i18n>M€</span>
        <span
          v-if="printedCost !== effectiveCost"
          class="mobile-card-rules__cost-was"
        >{{ printedCost }}</span>
      </div>
    </header>

    <div class="mobile-card-rules__meta" v-if="model.tags.length > 0 || model.victoryPoints">
      <div class="mobile-card-rules__tags" v-if="model.tags.length > 0">
        <div
          v-for="(tag, index) in model.tags"
          :key="`${tag}-${index}`"
          class="card-tag mobile-card-rules__tag"
          :class="`tag-${tag}`"
          :title="tag"
        ></div>
      </div>
      <div class="mobile-card-rules__vp" v-if="model.victoryPoints">
        {{ model.victoryPoints }}
      </div>
    </div>

    <section class="mobile-card-rules__req" v-if="model.requirements.length > 0">
      <h3 class="mobile-card-rules__section-title" v-i18n>Requires</h3>
      <ul class="mobile-card-rules__req-list">
        <li v-for="(req, index) in model.requirements" :key="index">{{ req }}</li>
      </ul>
    </section>

    <section
      v-for="(section, index) in model.sections"
      :key="`${section.kind}-${index}`"
      class="mobile-card-rules__section"
    >
      <h3 class="mobile-card-rules__section-title" v-i18n>{{ section.title }}</h3>
      <div class="mobile-card-rules__icons">
        <CardRenderData :renderData="section.renderData" />
      </div>
    </section>

    <section class="mobile-card-rules__description" v-if="model.description">
      <h3 class="mobile-card-rules__section-title" v-i18n>In plain language</h3>
      <div class="mobile-card-rules__description-body" v-i18n>{{ model.description }}</div>
    </section>

    <p
      class="mobile-card-rules__empty"
      v-if="model.sections.length === 0 && !model.description && model.requirements.length === 0"
    >
      <span v-i18n>No structured rules text for this card. Use Original for the classic face.</span>
    </p>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {CardModel} from '@/common/models/CardModel';
import {CardType} from '@/common/cards/CardType';
import {getCardOrThrow} from '@/client/cards/ClientCardManifest';
import CardRenderData from '@/client/components/card/CardRenderData.vue';
import {buildMobileCardRulesModel, MobileCardRulesModel} from '@/client/components/mobile/mobileCardRules';

export default defineComponent({
  name: 'MobileCardRulesPanel',
  components: {
    CardRenderData,
  },
  props: {
    card: {
      type: Object as () => CardModel,
      required: true,
    },
  },
  computed: {
    model(): MobileCardRulesModel {
      return buildMobileCardRulesModel(getCardOrThrow(this.card.name), this.card);
    },
    showCost(): boolean {
      return this.model.cost !== undefined &&
        this.model.type !== CardType.CORPORATION &&
        this.model.type !== CardType.PRELUDE &&
        this.model.type !== CardType.CEO &&
        this.model.type !== CardType.STANDARD_ACTION;
    },
    printedCost(): number {
      return this.model.cost ?? 0;
    },
    effectiveCost(): number {
      return this.model.reducedCost ?? this.model.cost ?? 0;
    },
  },
});
</script>
