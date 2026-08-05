import {expect} from 'chai';
import {defineComponent, h} from 'vue';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import MobileTurnMode from '@/client/components/mobile/MobileTurnMode.vue';
import MobileCardGrid from '@/client/components/mobile/MobileCardGrid.vue';
import {CardName} from '@/common/cards/CardName';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {MOBILE_CARD_GRID_SIZE_KEY} from '@/client/components/mobile/mobileCardLayout';

const WaitingForStub = defineComponent({
  name: 'WaitingFor',
  props: ['playerView', 'waitingfor'],
  render() {
    return h('div', {'data-test': 'waiting-for-stub'}, 'waiting');
  },
});

function stubView(overrides: Partial<PlayerViewModel> = {}): PlayerViewModel {
  return {
    id: 'p1',
    runId: 'r1',
    cardsInHand: [],
    preludeCardsInHand: [],
    ceoCardsInHand: [],
    dealtCorporationCards: [],
    dealtPreludeCards: [],
    dealtCeoCards: [],
    dealtProjectCards: [],
    draftedCards: [],
    pickedCorporationCard: [],
    players: [],
    thisPlayer: {
      color: 'blue',
      tableau: [{name: CardName.ECOLINE}],
    },
    game: {
      phase: Phase.ACTION,
      gameOptions: {expansions: {}},
    },
    waitingFor: undefined,
    ...overrides,
  } as unknown as PlayerViewModel;
}

describe('MobileCardGrid', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(MOBILE_CARD_GRID_SIZE_KEY);
    }
  });

  it('renders cards in a grid and changes size preset', async () => {
    const wrapper = mount(MobileCardGrid, {
      ...globalConfig,
      props: {
        cards: [{name: CardName.ALGAE}, {name: CardName.BIRDS}] as never,
      },
      attachTo: document.body,
    });
    expect(wrapper.find('[data-test="mobile-card-grid"]').exists()).eq(true);
    expect(wrapper.findAll('.mobile-card-tile')).length(2);
    await wrapper.find('[data-test="mobile-card-size-s"]').trigger('click');
    if (typeof localStorage !== 'undefined') {
      expect(localStorage.getItem(MOBILE_CARD_GRID_SIZE_KEY)).eq('s');
    }
    expect(wrapper.find('[data-test="mobile-card-size-s"]').classes())
      .to.include('mobile-card-grid__size--active');
    wrapper.unmount();
  });
});

describe('MobileTurnMode', () => {
  it('shows played cards when hand is empty and can open Empire', async () => {
    const wrapper = mount(MobileTurnMode, {
      ...globalConfig,
      props: {playerView: stubView()},
      global: {
        ...globalConfig.global,
        stubs: {WaitingFor: WaitingForStub},
      },
    });
    expect(wrapper.find('[data-test="mobile-turn-cards"]').exists()).eq(true);
    expect(wrapper.find('[data-test="mobile-card-grid"]').exists()).eq(true);
    expect(wrapper.text()).to.include('Hand is empty');
    // Size control sits left of All cards in the grid toolbar
    const toolbar = wrapper.find('.mobile-card-grid__toolbar');
    expect(toolbar.exists()).eq(true);
    expect(toolbar.find('[data-test="mobile-card-size-control"]').exists()).eq(true);
    expect(toolbar.find('[data-test="mobile-turn-open-empire"]').exists()).eq(true);
    await wrapper.find('[data-test="mobile-turn-open-empire"]').trigger('click');
    expect(wrapper.emitted('open-empire')).to.have.length(1);
  });

  it('prefers hand cards when present', () => {
    const wrapper = mount(MobileTurnMode, {
      ...globalConfig,
      props: {
        playerView: stubView({
          cardsInHand: [{name: CardName.ALGAE} as never],
        }),
      },
      global: {
        ...globalConfig.global,
        stubs: {WaitingFor: WaitingForStub},
      },
    });
    expect(wrapper.text()).to.not.include('Hand is empty');
  });
});
