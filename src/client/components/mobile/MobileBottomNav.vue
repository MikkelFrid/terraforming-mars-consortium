<template>
  <nav class="mobile-bottom-nav" aria-label="Mobile navigation">
    <button
      v-for="item in items"
      :key="item.mode"
      type="button"
      class="mobile-bottom-nav__item"
      :class="{'mobile-bottom-nav__item--active': mode === item.mode, 'mobile-bottom-nav__item--badge': item.badge}"
      @click="$emit('update:mode', item.mode)"
    >
      <span class="mobile-bottom-nav__label" v-i18n>{{ item.label }}</span>
      <span v-if="item.badge" class="mobile-bottom-nav__badge" aria-hidden="true"></span>
    </button>
  </nav>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {MobileMode} from '@/client/components/mobile/mobileModes';

type NavItem = {mode: MobileMode, label: string, badge: boolean};

export default defineComponent({
  name: 'MobileBottomNav',
  props: {
    mode: {
      type: String as PropType<MobileMode>,
      required: true,
    },
    turnBadge: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:mode'],
  computed: {
    items(): Array<NavItem> {
      return [
        {mode: 'turn', label: 'Turn', badge: this.turnBadge},
        {mode: 'table', label: 'Table', badge: false},
        {mode: 'empire', label: 'Empire', badge: false},
        {mode: 'rivals', label: 'Rivals', badge: false},
        {mode: 'more', label: 'More', badge: false},
      ];
    },
  },
});
</script>
