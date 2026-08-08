import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ReturnToMobileBanner from '@/client/components/mobile/ReturnToMobileBanner.vue';
import {FakeLocalStorage} from '../FakeLocalStorage';
import {PreferencesManager} from '@/client/utils/PreferencesManager';

describe('ReturnToMobileBanner', () => {
  let storage: FakeLocalStorage;
  let previousInnerWidth: number;
  let previousScreen: Screen;

  beforeEach(() => {
    storage = new FakeLocalStorage();
    FakeLocalStorage.register(storage);
    PreferencesManager.resetForTest();
    previousInnerWidth = window.innerWidth;
    previousScreen = window.screen;
  });

  afterEach(() => {
    FakeLocalStorage.deregister(storage);
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: previousInnerWidth});
    Object.defineProperty(window, 'screen', {configurable: true, value: previousScreen});
  });

  function phoneViewport() {
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: 390});
    Object.defineProperty(window, 'screen', {
      configurable: true,
      value: {width: 390, height: 844},
    });
  }

  it('is hidden when the mobile shell is already active', () => {
    PreferencesManager.INSTANCE.set('mobile_client', 'on');
    phoneViewport();
    const wrapper = shallowMount(ReturnToMobileBanner, {...globalConfig});
    expect(wrapper.find('[data-test=return_to_mobile]').exists()).to.be.false;
  });

  it('shows when desktop is forced on a phone-sized device', () => {
    PreferencesManager.INSTANCE.set('mobile_client', 'off');
    phoneViewport();
    const wrapper = shallowMount(ReturnToMobileBanner, {...globalConfig});
    expect(wrapper.find('[data-test=return_to_mobile]').exists()).to.be.true;
    expect(wrapper.find('[data-test=return_to_mobile_button]').exists()).to.be.true;
  });
});
