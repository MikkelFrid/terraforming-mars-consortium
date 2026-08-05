import {expect} from 'chai';
import {mount, shallowMount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import MobileSelectCard from '@/client/components/mobile/MobileSelectCard.vue';
import SelectCard from '@/client/components/SelectCard.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {fakePlayerViewModel} from '../testHelpers';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {FakeLocalStorage} from '../FakeLocalStorage';

function stubCard(name: CardName): CardModel {
  return {name, isDisabled: false} as CardModel;
}

function buyInput(cards: Array<CardModel>) {
  return {
    title: 'Select card(s) to buy',
    buttonLabel: 'Buy',
    type: 'card' as const,
    cards,
    max: 4,
    min: 0,
    showOnlyInLearnerMode: false,
    selectBlueCardAction: false,
    showOwner: false,
    showSelectAll: false,
  };
}

describe('MobileSelectCard', () => {
  it('toggles selection and saves card names', async () => {
    const algae = stubCard(CardName.ALGAE);
    const mohole = stubCard(CardName.MOHOLE);
    let saved: Array<CardName> | undefined;
    const wrapper = mount(MobileSelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: buyInput([algae, mohole]),
        onsave: (out: {type: string; cards: Array<CardName>}) => {
          saved = out.cards;
        },
        showsave: true,
      },
    });

    expect(wrapper.find('[data-test="mobile-select-card"]').exists()).eq(true);
    expect(wrapper.find('[data-test="mobile-select-card-bar"]').exists()).eq(true);
    expect(wrapper.find('.mobile-select-card__end-spacer').exists()).eq(true);
    expect(wrapper.find('.mobile-card-grid__toolbar--split').exists()).eq(false);
    const tiles = wrapper.findAll('.mobile-card-tile');
    expect(tiles.length).eq(2);
    await tiles[0].trigger('click');
    expect(wrapper.emitted('cardschanged')?.[0]).deep.eq([[CardName.ALGAE]]);
    expect(tiles[0].classes()).to.include('mobile-card-tile--selected');
    await tiles[1].trigger('click');
    expect(wrapper.emitted('cardschanged')?.at(-1)).deep.eq([[CardName.ALGAE, CardName.MOHOLE]]);

    const buy = wrapper.findAll('.btn').find((b) => b.text().includes('Buy'));
    expect(buy).to.not.eq(undefined);
    await buy!.trigger('click');
    expect(saved).deep.eq([CardName.ALGAE, CardName.MOHOLE]);
  });

  it('radio mode keeps a single selection', async () => {
    const algae = stubCard(CardName.ALGAE);
    const mohole = stubCard(CardName.MOHOLE);
    const wrapper = mount(MobileSelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          ...buyInput([algae, mohole]),
          title: 'Select a card',
          max: 1,
          min: 1,
          buttonLabel: 'Save',
        },
        onsave: () => {},
        showsave: false,
      },
    });
    const tiles = wrapper.findAll('.mobile-card-tile');
    await tiles[0].trigger('click');
    await tiles[1].trigger('click');
    expect(wrapper.emitted('cardschanged')?.at(-1)).deep.eq([[CardName.MOHOLE]]);
  });
});

describe('SelectCard mobile branch', () => {
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

  it('renders MobileSelectCard when mobile client is on', () => {
    PreferencesManager.INSTANCE.set('mobile_client', 'on');
    const wrapper = shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: buyInput([]),
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.findComponent(MobileSelectCard).exists()).eq(true);
  });
});
