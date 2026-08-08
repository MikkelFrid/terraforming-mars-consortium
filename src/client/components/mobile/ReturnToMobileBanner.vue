<template>
  <div
    v-if="visible"
    class="return-to-mobile"
    data-test="return_to_mobile"
  >
    <p class="return-to-mobile__text" v-i18n>
      Desktop layout is on. Switch back to the mobile client?
    </p>
    <button
      type="button"
      class="btn btn-lg btn-primary return-to-mobile__button"
      data-test="return_to_mobile_button"
      @click="switchToMobile"
      v-i18n
    >
      Use mobile layout
    </button>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  autoShouldUseMobileClient,
  setMobileClientPreference,
  shouldUseMobileClient,
} from '@/client/utils/mobileClient';

export default defineComponent({
  name: 'ReturnToMobileBanner',
  computed: {
    visible(): boolean {
      // Already on mobile shell — nothing to restore.
      if (shouldUseMobileClient()) {
        return false;
      }
      // Phone / coarse tablet that would auto-enable, stuck on desktop preference.
      return autoShouldUseMobileClient();
    },
  },
  methods: {
    switchToMobile() {
      setMobileClientPreference('on');
      window.location.reload();
    },
  },
});
</script>
