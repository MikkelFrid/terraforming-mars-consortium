<template>
  <section class="mobile-mode mobile-mode--more">
    <h2 class="mobile-mode__title" v-i18n>Log</h2>
    <LogPanel :viewModel="playerView" :color="thisPlayer.color" :step="game.step"/>

    <h2 class="mobile-mode__title" v-i18n>Notifications</h2>
    <div class="mobile-more-actions">
      <button
        type="button"
        class="btn btn-lg btn-primary"
        data-test="enable_push_notifications"
        :disabled="pushBusy"
        @click="togglePush"
        v-i18n
      >
        {{ pushEnabled ? 'Disable turn notifications' : 'Enable turn notifications' }}
      </button>
      <p v-if="pushMessage" class="mobile-mode__hint">{{ pushMessage }}</p>
      <p class="mobile-mode__hint" v-i18n>
        iPhone: Share → Add to Home Screen, open the app icon, then enable. You get a ping when it is your turn.
      </p>
    </div>

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
import {
  disablePushNotifications,
  enablePushNotifications,
  playerIdFromLocation,
} from '@/client/utils/pushNotifications';

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
      pushEnabled: getPreferences().enable_push_notifications === true,
      pushBusy: false,
      pushMessage: '' as string,
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
      // Always reload — App forks PlayerHome vs MobilePlayerHome at mount.
      window.location.reload();
    },
    useDesktop() {
      this.mobilePref = 'off';
      this.onMobilePref();
    },
    async togglePush() {
      this.pushBusy = true;
      this.pushMessage = '';
      try {
        if (this.pushEnabled) {
          await disablePushNotifications(playerIdFromLocation());
          PreferencesManager.INSTANCE.set('enable_push_notifications', false);
          this.pushEnabled = false;
          this.pushMessage = 'Turn notifications disabled.';
          return;
        }
        const result = await enablePushNotifications(playerIdFromLocation());
        if (result === 'ok') {
          PreferencesManager.INSTANCE.set('enable_push_notifications', true);
          this.pushEnabled = true;
          this.pushMessage = 'Turn notifications enabled.';
          return;
        }
        const messages: Record<string, string> = {
          unsupported: 'Not supported here. On iPhone: Add to Home Screen, open the app, then try again.',
          denied: 'Notification permission denied.',
          'not-configured': 'Server has not configured push yet.',
          'no-player': 'Open your player link first.',
          error: 'Could not enable notifications.',
        };
        this.pushMessage = messages[result] ?? messages.error;
      } finally {
        this.pushBusy = false;
      }
    },
  },
});
</script>
