import {expect} from 'chai';
import {
  autoShouldUseMobileClient,
  deviceShortSidePx,
  isNarrowViewport,
  MOBILE_VIEWPORT,
  DESKTOP_VIEWPORT,
  resolveMobileClientMode,
} from '@/client/utils/mobileClient';
import {FakeLocalStorage} from './components/FakeLocalStorage';
import {PreferencesManager} from '@/client/utils/PreferencesManager';

describe('mobileClient', () => {
  it('treats widths under 900 as narrow', () => {
    expect(isNarrowViewport(899)).eq(true);
    expect(isNarrowViewport(900)).eq(false);
  });

  it('auto-enables on narrow viewports', () => {
    expect(autoShouldUseMobileClient(390)).eq(true);
    expect(autoShouldUseMobileClient(1280, 1280)).eq(false);
  });

  it('auto-enables on a phone screen even when layout viewport is 1260', () => {
    // index.html defaults to width=1260, so innerWidth reports ~1260 on iOS
    // until the mobile viewport is applied. Detection must use screen size.
    expect(autoShouldUseMobileClient(1260, 390)).eq(true);
    expect(autoShouldUseMobileClient(1260, 844)).eq(true);
  });

  it('deviceShortSidePx uses the smaller screen side', () => {
    expect(deviceShortSidePx({width: 390, height: 844}, 1260)).eq(390);
    expect(deviceShortSidePx({width: 0, height: 0}, 1260)).eq(1260);
  });

  it('resolve respects on/off regardless of width', () => {
    expect(resolveMobileClientMode('on')).eq(true);
    expect(resolveMobileClientMode('off')).eq(false);
  });

  it('viewport constants are set', () => {
    expect(MOBILE_VIEWPORT).contains('device-width');
    expect(DESKTOP_VIEWPORT).contains('1260');
  });
});

describe('PreferencesManager mobile_client', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
    PreferencesManager.resetForTest();
  });
  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
    PreferencesManager.resetForTest();
  });

  it('defaults to auto', () => {
    expect(PreferencesManager.INSTANCE.values().mobile_client).eq('auto');
  });

  it('stores on/off/auto as strings', () => {
    const instance = PreferencesManager.INSTANCE;
    instance.set('mobile_client', 'on');
    expect(instance.values().mobile_client).eq('on');
    expect(localStorage.getItem('mobile_client')).eq('on');

    instance.set('mobile_client', 'off');
    expect(instance.values().mobile_client).eq('off');
    expect(localStorage.getItem('mobile_client')).eq('off');

    instance.set('mobile_client', 'auto');
    expect(instance.values().mobile_client).eq('auto');
  });

  it('loads stored mobile_client on init', () => {
    localStorage.setItem('mobile_client', 'on');
    PreferencesManager.resetForTest();
    expect(PreferencesManager.INSTANCE.values().mobile_client).eq('on');
  });
});
