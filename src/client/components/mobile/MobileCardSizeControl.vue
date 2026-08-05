<template>
  <div class="mobile-card-grid__toolbar-size" data-test="mobile-card-size-control">
    <span class="mobile-card-grid__toolbar-label" v-i18n>Size</span>
    <div class="mobile-card-grid__sizes" role="group" aria-label="Card size">
      <button
        v-for="opt in sizeOptions"
        :key="opt"
        type="button"
        class="mobile-card-grid__size"
        :class="{'mobile-card-grid__size--active': model === opt}"
        :aria-pressed="model === opt"
        :data-test="'mobile-card-size-' + opt"
        @click="setSize(opt)"
      >{{ opt.toUpperCase() }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {
  MobileCardGridSize,
  loadMobileCardGridSize,
  saveMobileCardGridSize,
} from '@/client/components/mobile/mobileCardLayout';

const SIZE_OPTIONS: ReadonlyArray<MobileCardGridSize> = ['s', 'm', 'l'];

export default defineComponent({
  name: 'MobileCardSizeControl',
  props: {
    modelValue: {
      type: String as PropType<MobileCardGridSize | undefined>,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      localSize: loadMobileCardGridSize() as MobileCardGridSize,
      sizeOptions: SIZE_OPTIONS,
    };
  },
  computed: {
    model(): MobileCardGridSize {
      return this.modelValue ?? this.localSize;
    },
  },
  methods: {
    setSize(size: MobileCardGridSize) {
      this.localSize = size;
      saveMobileCardGridSize(size);
      this.$emit('update:modelValue', size);
    },
  },
});
</script>
