import {createApp, defineAsyncComponent} from 'vue';

import {trimEmptyTextNodes} from '@/client/directives/TrimWhitespace';
import App from '@/client/components/App.vue';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {bootstrapMobileClientViewport} from '@/client/utils/mobileClient';

import i18nPlugin from '@/client/plugins/i18n.plugin';
import {startOauth} from '@/client/oauth';
const PlayerInputFactory = defineAsyncComponent(() => import(/* webpackChunkName: "player-input" */ '@/client/components/PlayerInputFactory.vue'));

declare global {
  interface Window {
    _translations: { [key: string]: string } | undefined;
  }
}

async function bootstrap() {
  // Before Vue mounts: phones must not keep the desktop width=1260 viewport,
  // or auto mobile detection (and first paint) stay stuck on desktop layout.
  bootstrapMobileClientViewport();

  const lang = getPreferences().lang;

  if (lang !== 'en') {
    try {
      window._translations = await fetch(`assets/locales/${lang}.json`).then((res) => res.json());
      // TODO - add a nice loader for this fetch
    } catch (err) {
      console.warn(`Cannot load ${lang} translations. See network for details.`);
    }
  }

  const app = createApp(App);

  app.use(i18nPlugin);

  app.component('PlayerInputFactory', PlayerInputFactory);

  app.directive('trim-whitespace', {
    mounted: trimEmptyTextNodes,
    updated: trimEmptyTextNodes,
  });

  if (window.isSecureContext && 'serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw.js').then(function(registration) {
        console.log('registered the service worker', registration);
      });
    });
  }

  app.mount('#app');

  window.onload = startOauth;
}

bootstrap();
