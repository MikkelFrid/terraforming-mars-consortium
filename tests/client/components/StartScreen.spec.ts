import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import StartScreen from '@/client/components/StartScreen.vue';
import {FakeLocalStorage} from './FakeLocalStorage';
import {clearLastPlayerId, rememberPlayerId} from '@/client/utils/lastPlayer';

describe('StartScreen', () => {
  let storage: FakeLocalStorage;
  let previousCookie: string;

  beforeEach(() => {
    storage = new FakeLocalStorage();
    FakeLocalStorage.register(storage);
    previousCookie = document.cookie;
    // Clear tm_last_player cookie leftovers from other tests.
    document.cookie = 'tm_last_player=; Max-Age=0; Path=/; SameSite=Lax';
    clearLastPlayerId();
  });

  afterEach(() => {
    FakeLocalStorage.deregister(storage);
    document.cookie = 'tm_last_player=; Max-Age=0; Path=/; SameSite=Lax';
    void previousCookie;
  });

  it('mounts without errors', () => {
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.find('.start-screen-open-link').exists()).to.be.true;
    expect(wrapper.find('.start-screen-open-link__title').text()).to.include('Join game');
  });

  it('shows resume when a last player is stored', () => {
    rememberPlayerId('pRESUME01');
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    const resume = wrapper.find('.start-screen-link--resume-game');
    expect(resume.exists()).to.be.true;
    expect(resume.attributes('href')).eq('player?id=pRESUME01');
  });
});
