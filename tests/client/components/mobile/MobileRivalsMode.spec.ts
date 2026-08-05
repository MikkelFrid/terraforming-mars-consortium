import {expect} from 'chai';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import MobileRivalsMode from '@/client/components/mobile/MobileRivalsMode.vue';
import {
  fakePlayerViewModel,
  fakePublicPlayerModel,
  fakeGameModel,
  fakeGameOptionsModel,
} from '../testHelpers';
import {CardName} from '@/common/cards/CardName';

describe('MobileRivalsMode', () => {
  it('renders a full resource sheet for every player including self', () => {
    const alice = fakePublicPlayerModel({
      color: 'blue',
      name: 'Alice',
      isActive: true,
      megacredits: 35,
      steel: 2,
      iridium: 1,
      tableau: [{name: CardName.INVENTRIX} as any],
    });
    const bob = fakePublicPlayerModel({
      color: 'red',
      name: 'Bob',
      isActive: false,
      megacredits: 40,
      heat: 3,
      heatProduction: 2,
      tableau: [{name: CardName.TERACTOR} as any],
    });
    const wrapper = mount(MobileRivalsMode, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({
          thisPlayer: alice,
          players: [alice, bob],
          game: fakeGameModel({
            gameOptions: fakeGameOptionsModel({
              expansions: {consortium: true} as any,
              showOtherPlayersVP: true,
            }),
          }),
        }),
      },
    });

    expect(wrapper.find('[data-test="mobile-rivals"]').exists()).eq(true);
    expect(wrapper.findAll('[data-test^="mobile-player-sheet-"]')).length(2);
    expect(wrapper.findAll('[data-test="mobile-player-resources"]')).length(2);
    expect(wrapper.text()).to.include('Alice');
    expect(wrapper.text()).to.include('Bob');
    expect(wrapper.text()).to.include('You');
    expect(wrapper.text()).to.include('Inventrix');
    expect(wrapper.text()).to.include('Teractor');
    // stock counts from PlayerResources
    expect(wrapper.text()).to.match(/35/);
    expect(wrapper.text()).to.match(/40/);
    expect(wrapper.find('.mobile-mode__hint').exists()).eq(false);
  });

  it('puts the active player first', () => {
    const alice = fakePublicPlayerModel({color: 'blue', name: 'Alice', isActive: false});
    const bob = fakePublicPlayerModel({color: 'red', name: 'Bob', isActive: true});
    const wrapper = mount(MobileRivalsMode, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({
          thisPlayer: alice,
          players: [alice, bob],
        }),
      },
    });
    const sheets = wrapper.findAll('[data-test^="mobile-player-sheet-"]');
    expect(sheets[0].attributes('data-test')).eq('mobile-player-sheet-red');
  });
});
