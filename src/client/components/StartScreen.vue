<template>
<div class="start-screen">
  <div v-i18n class="start-screen-links">
    <div class="start-screen-header start-screen-link--title">
      <div class="start-screen-title-top">TERRAFORMING</div>
      <div class="start-screen-title-bottom">MARS</div>
    </div>
    <a
      v-if="lastPlayerHref"
      class="start-screen-link start-screen-link--resume-game"
      :href="lastPlayerHref"
      v-i18n
    >Resume game</a>
    <div class="start-screen-open-link">
      <label class="start-screen-open-link__label" for="start-screen-player-link" v-i18n>
        Open player link
      </label>
      <input
        id="start-screen-player-link"
        v-model="pasteText"
        class="start-screen-open-link__input"
        type="url"
        inputmode="url"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Paste player?id=… link"
        @keydown.enter.prevent="openPastedLink"
      />
      <button
        type="button"
        class="start-screen-open-link__button"
        :disabled="parsedPasteId === undefined"
        v-i18n
        @click="openPastedLink"
      >
        Open
      </button>
      <p v-if="pasteError" class="start-screen-open-link__error" v-i18n>{{ pasteError }}</p>
    </div>
    <a class="start-screen-link start-screen-link--new-game" href="new-game" v-i18n>New game</a>
    <a class="start-screen-link start-screen-link--how-to-play" href="https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks" target="_blank" v-i18n>How to Play</a>
    <a class="start-screen-link start-screen-link--cards-list" href="cards" target="_blank" v-i18n>Cards list</a>
    <a class="start-screen-link start-screen-link--board-game" href="https://boardgamegeek.com/boardgame/167791/terraforming-mars" target="_blank" v-i18n>Board game</a>
    <a class="start-screen-link start-screen-link--about" href="https://github.com/terraforming-mars/terraforming-mars#README" target="_blank" v-i18n>About us</a>
    <a class="start-screen-link start-screen-link--changelog" href="https://github.com/terraforming-mars/terraforming-mars/wiki/Changelog" target="_blank" v-i18n>Whats new?</a>
    <a class="start-screen-link start-screen-link--chat" :href="DISCORD_INVITE" target="_blank" v-i18n>Join us on Discord</a>
    <div class="start-screen-header start-screen-link--languages">
      <LanguageSwitcher />
      <div class="start-screen-version-cont">
        <div class="nowrap start-screen-date"><span v-i18n>deployed</span>: {{raw_settings.builtAt}}</div>
        <div class="nowrap start-screen-version"><span v-i18n>version</span>: {{raw_settings.head}}</div>
      </div>
      <div class="source-code">
        <a href="https://github.com/terraforming-mars/terraforming-mars" target="_blank" class="source-code-text">
        <img src="assets/misc/github.png" class="source-code-img">
          source code
        </a>
      </div>
    </div>
  </div>
  <div class="free-floating-preferences-icon">
    <LanguageIcon class="corner-language-icon"/>
    <PreferencesIcon/>
  </div>
</div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import LanguageSwitcher from '@/client/components/LanguageSwitcher.vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';

import raw_settings from '@/genfiles/settings.json';
import * as constants from '@/common/constants';
import {
  getLastPlayerId,
  isStandaloneDisplay,
  parsePlayerIdFromText,
  playerHref,
  rememberPlayerId,
  setSkipResume,
  shouldSkipResume,
} from '@/client/utils/lastPlayer';

export default defineComponent({
  name: 'StartScreen',
  components: {
    LanguageSwitcher,
    LanguageIcon,
    PreferencesIcon,
  },
  data() {
    return {
      pasteText: '',
      pasteError: '' as string,
      lastPlayerId: getLastPlayerId(),
    };
  },
  computed: {
    raw_settings(): typeof raw_settings {
      return raw_settings;
    },
    DISCORD_INVITE(): string {
      return constants.DISCORD_INVITE;
    },
    lastPlayerHref(): string | undefined {
      return this.lastPlayerId === undefined ? undefined : playerHref(this.lastPlayerId);
    },
    parsedPasteId() {
      return parsePlayerIdFromText(this.pasteText);
    },
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('menu')) {
      setSkipResume(true);
      return;
    }
    if (
      isStandaloneDisplay() &&
      this.lastPlayerId !== undefined &&
      !shouldSkipResume()
    ) {
      window.location.replace(playerHref(this.lastPlayerId));
    }
  },
  methods: {
    openPastedLink() {
      const id = this.parsedPasteId;
      if (id === undefined) {
        this.pasteError = 'Paste a full player link (with id=…).';
        return;
      }
      this.pasteError = '';
      rememberPlayerId(id);
      setSkipResume(false);
      window.location.href = playerHref(id);
    },
  },
});

</script>
