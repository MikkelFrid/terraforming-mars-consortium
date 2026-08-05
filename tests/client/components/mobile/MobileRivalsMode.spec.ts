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
  function mountRivals(overrides: {
    alice?: Parameters<typeof fakePublicPlayerModel>[0],
    bob?: Parameters<typeof fakePublicPlayerModel>[0],
  } = {}) {
    const alice = fakePublicPlayerModel({
      color: 'blue',
      name: 'Alice',
      isActive: true,
      megacredits: 35,
      steel: 2,
      iridium: 1,
      terraformRating: 21,
      tableau: [{name: CardName.INVENTRIX} as any],
      ...overrides.alice,
    });
    const bob = fakePublicPlayerModel({
      color: 'red',
      name: 'Bob',
      isActive: false,
      megacredits: 40,
      heat: 3,
      heatProduction: 2,
      terraformRating: 20,
      tableau: [
        {name: CardName.TERACTOR} as any,
        {name: CardName.STRIP_MINE} as any,
      ],
      ...overrides.bob,
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
      attachTo: document.body,
    });
    return {wrapper, alice, bob};
  }

  it('renders a full resource sheet for every player including self', () => {
    const {wrapper} = mountRivals();

    expect(wrapper.find('[data-test="mobile-rivals"]').exists()).eq(true);
    expect(wrapper.findAll('[data-test^="mobile-player-sheet-"]')).length(2);
    expect(wrapper.findAll('[data-test="mobile-player-resources"]')).length(2);
    expect(wrapper.text()).to.include('Alice');
    expect(wrapper.text()).to.include('Bob');
    expect(wrapper.text()).to.include('You');
    expect(wrapper.text()).to.include('Inventrix');
    expect(wrapper.text()).to.include('Teractor');
    expect(wrapper.text()).to.match(/35/);
    expect(wrapper.text()).to.match(/40/);
    expect(wrapper.find('.mobile-mode__hint').exists()).eq(false);
    wrapper.unmount();
  });

  it('puts the active player first', () => {
    const {wrapper} = mountRivals({
      alice: {isActive: false},
      bob: {isActive: true},
    });
    const sheets = wrapper.findAll('[data-test^="mobile-player-sheet-"]');
    expect(sheets[0].attributes('data-test')).eq('mobile-player-sheet-red');
    wrapper.unmount();
  });

  it('shows TR and VP icons in the meta row', () => {
    const {wrapper} = mountRivals();
    expect(wrapper.find('.mobile-player-sheet__icon--tr').exists()).eq(true);
    expect(wrapper.find('.mobile-player-sheet__icon--vp').exists()).eq(true);
    expect(wrapper.find('.mobile-player-sheet__stat--tr').text()).to.match(/21/);
    wrapper.unmount();
  });

  it('opens a played-cards sheet for a rival', async () => {
    const {wrapper} = mountRivals();
    const bobPlayed = wrapper.find('[data-test="mobile-player-sheet-red"] [data-test="mobile-player-played"]');
    expect(bobPlayed.exists()).eq(true);
    await bobPlayed.trigger('click');
    expect((wrapper.vm as any).viewingPlayer?.name).eq('Bob');
    // Teleported into document.body
    const sheet = document.querySelector('[data-test="mobile-played-sheet"]');
    expect(sheet).to.not.eq(null);
    expect(sheet?.textContent ?? '').to.include('Bob');
    expect(sheet?.textContent ?? '').to.include('played cards');
    wrapper.unmount();
  });

  it('emits open-empire when viewing your own played cards', async () => {
    const {wrapper} = mountRivals();
    const selfPlayed = wrapper.find('[data-test="mobile-player-sheet-blue"] [data-test="mobile-player-played"]');
    await selfPlayed.trigger('click');
    expect(wrapper.emitted('open-empire')).length(1);
    expect(wrapper.find('[data-test="mobile-played-sheet"]').exists()).eq(false);
    wrapper.unmount();
  });
});
