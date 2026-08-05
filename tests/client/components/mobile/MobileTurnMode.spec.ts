import {expect} from 'chai';
import {defineComponent, h} from 'vue';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import MobileTurnMode from '@/client/components/mobile/MobileTurnMode.vue';
import {CardName} from '@/common/cards/CardName';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';

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
    expect(wrapper.find('[data-test="mobile-turn-card-scroller"]').exists()).eq(true);
    expect(wrapper.text()).to.include('Hand is empty');
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
