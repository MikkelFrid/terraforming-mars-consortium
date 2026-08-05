<template>
  <nav class="mobile-bottom-nav" aria-label="Mobile navigation">
    <button
      v-for="item in items"
      :key="item.mode"
      type="button"
      class="mobile-bottom-nav__item"
      :class="{
        'mobile-bottom-nav__item--active': mode === item.mode,
        'mobile-bottom-nav__item--badge': item.badge,
      }"
      :aria-current="mode === item.mode ? 'page' : undefined"
      @click="$emit('update:mode', item.mode)"
    >
      <span class="mobile-bottom-nav__icon" aria-hidden="true" v-html="item.icon"></span>
      <span class="mobile-bottom-nav__label" v-i18n>{{ item.label }}</span>
      <span v-if="item.badge" class="mobile-bottom-nav__badge" aria-hidden="true"></span>
    </button>
  </nav>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {MobileMode} from '@/client/components/mobile/mobileModes';

type NavItem = {mode: MobileMode, label: string, badge: boolean, icon: string};

const ICON = {
  turn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5V8.5z"/></svg>`,
  table: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l7 4v8l-7 4-7-4v-8l7-4z"/><path d="M12 12V21.5M5 7.5l7 4.5 7-4.5"/></svg>`,
  empire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="11" height="14" rx="1.5"/><path d="M16 8h3a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 22h-9"/></svg>`,
  rivals: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10.5" r="2.5"/><path d="M3.5 19c.8-2.8 2.9-4.2 5.5-4.2S14 16.2 14.8 19"/><path d="M14 19c.5-1.8 1.8-2.8 3.5-2.8 1.2 0 2.2.5 2.9 1.4"/></svg>`,
  more: `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>`,
};

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
        {mode: 'turn', label: 'Turn', badge: this.turnBadge, icon: ICON.turn},
        {mode: 'table', label: 'Table', badge: false, icon: ICON.table},
        {mode: 'empire', label: 'Empire', badge: false, icon: ICON.empire},
        {mode: 'rivals', label: 'Rivals', badge: false, icon: ICON.rivals},
        {mode: 'more', label: 'More', badge: false, icon: ICON.more},
      ];
    },
  },
});
</script>
