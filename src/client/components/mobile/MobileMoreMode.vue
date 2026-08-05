<template>
  <section class="mobile-mode mobile-mode--more">
    <h2 class="mobile-mode__title" v-i18n>Log</h2>
    <LogPanel :viewModel="playerView" :color="thisPlayer.color" :step="game.step"/>

    <h2 class="mobile-mode__title" v-i18n>Client</h2>
    <div class="mobile-more-actions">
      <label class="mobile-more-actions__label">
        <span v-i18n>Mobile client</span>
        <select v-model="mobilePref" @change="onMobilePref" data-test="mobile_client_select">
          <option value="auto" v-i18n>Auto</option>
          <option value="on" v-i18n>On</option>
          <option value="off" v-i18n>Off (desktop)</option>
        </select>
      </label>
      <button type="button" class="btn btn-lg btn-primary" @click="useDesktop" v-i18n>
        Use desktop layout
      </button>
    </div>
    <p class="mobile-mode__hint" v-i18n>
      P0 shell: Turn uses the existing action UI; Table / Empire / Rivals are native surfaces. Play-card and place-tile flows come next.
    </p>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';
import {getPreferences, MobileClientMode, PreferencesManager} from '@/client/utils/PreferencesManager';
import {applyClientViewport} from '@/client/utils/mobileClient';

export default defineComponent({
  name: 'MobileMoreMode',
  components: {LogPanel},
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  data() {
    return {
      mobilePref: getPreferences().mobile_client as MobileClientMode,
    };
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
  },
  methods: {
    onMobilePref() {
      PreferencesManager.INSTANCE.set('mobile_client', this.mobilePref);
      if (this.mobilePref === 'off') {
        applyClientViewport('desktop');
        window.location.reload();
      }
    },
    useDesktop() {
      this.mobilePref = 'off';
      this.onMobilePref();
    },
  },
});
</script>
