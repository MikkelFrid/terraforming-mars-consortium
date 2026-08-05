<template>
  <div class="mobile-select-card" data-test="mobile-select-card">
    <div class="mobile-select-card__scroll">
      <MobileCardGrid
        :cards="orderedCards"
        :selected-names="selectedNames"
        :max-selected="selectOnlyOneCard ? undefined : playerinput.max"
        :show-size-control="true"
        @toggle="toggleCard"
      />
      <WarningsComponent :warnings="warnings"/>
      <!-- Clears the fixed buy bar + bottom nav on iPhone -->
      <div class="mobile-select-card__end-spacer" aria-hidden="true"></div>
    </div>

    <div v-if="showsave" class="mobile-select-card__bar" data-test="mobile-select-card-bar">
      <div class="mobile-select-card__summary">
        <span v-if="selectedCount === 0" v-i18n>Tap cards to select</span>
        <span v-else-if="selectOnlyOneCard" v-i18n>1 selected</span>
        <span v-else>{{ selectedCount }}/{{ playerinput.max }} <span v-i18n>selected</span></span>
      </div>
      <div class="mobile-select-card__actions">
        <AppButton
          v-if="showSelectAll"
          type="submit"
          size="small"
          :title="allSelected ? $t('Deselect All') : $t('Select All')"
          @click="toggleSelectAll"
        />
        <AppButton
          class="mobile-select-card__primary"
          type="submit"
          size="small"
          :disabled="isOptionalToManyCards && selectedCount === 0"
          :title="buttonLabel"
          @click="saveData"
        />
        <AppButton
          v-if="isOptionalToManyCards"
          type="submit"
          size="small"
          :disabled="selectedCount > 0"
          :title="$t('Skip this action')"
          @click="saveData"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import WarningsComponent from '@/client/components/WarningsComponent.vue';
import MobileCardGrid from '@/client/components/mobile/MobileCardGrid.vue';
import {CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {SelectCardModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectCardResponse} from '@/common/inputs/InputResponse';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {Message} from '@/common/logs/Message';
import {Warning} from '@/common/cards/Warning';

export default defineComponent({
  name: 'MobileSelectCard',
  components: {
    AppButton,
    WarningsComponent,
    MobileCardGrid,
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectCardModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectCardResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: {
    cardschanged: (_names: Array<CardName>) => true,
  },
  data() {
    return {
      selected: [] as Array<CardModel>,
      warnings: undefined as ReadonlyArray<Warning> | undefined,
    };
  },
  computed: {
    orderedCards(): ReadonlyArray<CardModel> {
      if (this.playerinput.cards === undefined) {
        return [];
      }
      if (this.playerinput.selectBlueCardAction) {
        return sortActiveCards(this.playerinput.cards);
      }
      return CardOrderStorage.getOrdered(
        CardOrderStorage.getCardOrder(this.playerView.id),
        this.playerinput.cards,
      );
    },
    selectableCards(): Array<CardModel> {
      return this.playerinput.cards.filter((card) => !card.isDisabled);
    },
    selectedNames(): Array<CardName> {
      return this.selected.map((c) => c.name);
    },
    selectedCount(): number {
      return this.selected.length;
    },
    selectOnlyOneCard(): boolean {
      return this.playerinput.max === 1 && this.playerinput.min === 1;
    },
    isOptionalToManyCards(): boolean {
      return this.playerinput.max > 1 && this.playerinput.min === 0;
    },
    showSelectAll(): boolean {
      return this.playerinput.showSelectAll === true &&
        !this.selectOnlyOneCard &&
        this.selectableCards.length > 1;
    },
    allSelected(): boolean {
      return this.selected.length === this.selectableCards.length;
    },
    buttonLabel(): string | Message {
      if (this.selectOnlyOneCard) {
        return this.playerinput.buttonLabel;
      }
      return {
        message: this.playerinput.buttonLabel + ' ${0}',
        data: [{
          type: LogMessageDataType.RAW_STRING,
          value: String(this.selectedCount),
        }],
      };
    },
  },
  watch: {
    selected: {
      deep: true,
      handler() {
        if (this.selected.length === 1) {
          this.warnings = this.selected[0].warnings;
        } else {
          this.warnings = undefined;
        }
        this.$emit('cardschanged', this.selectedNames.slice());
      },
    },
  },
  methods: {
    toggleCard(card: CardModel) {
      if (card.isDisabled === true) {
        return;
      }
      const idx = this.selected.findIndex((c) => c.name === card.name);
      if (idx >= 0) {
        this.selected.splice(idx, 1);
        return;
      }
      if (this.selectOnlyOneCard) {
        this.selected = [card];
        return;
      }
      if (this.selected.length >= this.playerinput.max) {
        return;
      }
      this.selected.push(card);
    },
    toggleSelectAll() {
      if (this.allSelected) {
        this.selected = [];
      } else {
        this.selected = this.selectableCards.slice(0, this.playerinput.max);
      }
    },
    saveData() {
      this.onsave({type: 'card', cards: this.selectedNames.slice()});
    },
  },
});
</script>
