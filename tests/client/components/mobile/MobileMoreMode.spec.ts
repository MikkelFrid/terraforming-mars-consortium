import {expect} from 'chai';
import {mount} from '@vue/test-utils';
import {globalConfig} from '@/../tests/client/components/getLocalVue';
import MobileMoreMode from '@/client/components/mobile/MobileMoreMode.vue';
import {fakePlayerViewModel} from '../testHelpers';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {FakeLocalStorage} from '../FakeLocalStorage';

describe('MobileMoreMode', () => {
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

  it('offers a Hard refresh action that cache-busts the player URL', async () => {
    const wrapper = mount(MobileMoreMode, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
      },
    });

    const button = wrapper.find('[data-test="mobile-hard-refresh"]');
    expect(button.exists()).eq(true);
    expect(button.text()).to.match(/hard refresh/i);

    const vm = wrapper.vm as unknown as {
      buildHardRefreshUrl: (href?: string) => string;
      navigateTo: (url: string) => void;
      hardRefresh: () => Promise<void>;
    };

    const helperUrl = new URL(
      vm.buildHardRefreshUrl('http://localhost:8080/player?id=p-foo&mobile=1'),
    );
    expect(helperUrl.pathname).eq('/player');
    expect(helperUrl.searchParams.get('id')).eq('p-foo');
    expect(helperUrl.searchParams.get('mobile')).eq('1');
    expect(helperUrl.searchParams.get('r')).to.match(/^\d+$/);

    let navigatedTo = '';
    vm.navigateTo = (url: string) => {
      navigatedTo = url;
    };
    // jsdom location is about:blank — stub the URL builder for the click path.
    vm.buildHardRefreshUrl = () =>
      'http://localhost:8080/player?id=p-test&mobile=1&r=1234567890';

    await button.trigger('click');
    await Promise.resolve();
    expect(navigatedTo).eq('http://localhost:8080/player?id=p-test&mobile=1&r=1234567890');
  });
});
