import {expect} from 'chai';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import MobileCardTile from '@/client/components/mobile/MobileCardTile.vue';
import MobileCardFocusSheet from '@/client/components/mobile/MobileCardFocusSheet.vue';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';

function stubCard(name: CardName = CardName.ALGAE): CardModel {
  return {name} as CardModel;
}

describe('MobileCardTile', () => {
  it('emits open with the card on click', async () => {
    const card = stubCard();
    const wrapper = mount(MobileCardTile, {
      ...globalConfig,
      props: {card, size: 'hand'},
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('open')?.[0]).deep.eq([card]);
  });
});

describe('MobileCardFocusSheet', () => {
  it('emits close from the close button and cleans body class', async () => {
    const wrapper = mount(MobileCardFocusSheet, {
      ...globalConfig,
      props: {card: stubCard(CardName.MOHOLE)},
      attachTo: document.body,
    });
    expect(document.body.classList.contains('mobile-card-focus-open')).eq(true);
    await wrapper.find('.mobile-card-focus__close').trigger('click');
    expect(wrapper.emitted('close')).to.have.length(1);
    wrapper.unmount();
    expect(document.body.classList.contains('mobile-card-focus-open')).eq(false);
  });

  it('defaults to Rules tab and can switch to Original', async () => {
    const wrapper = mount(MobileCardFocusSheet, {
      ...globalConfig,
      props: {card: stubCard(CardName.ALGAE)},
      attachTo: document.body,
    });
    expect(wrapper.find('.mobile-card-rules').exists()).eq(true);
    expect(wrapper.find('.mobile-card-focus__tab--active').text()).to.include('Rules');
    const tabs = wrapper.findAll('.mobile-card-focus__tab');
    await tabs[1].trigger('click');
    expect(wrapper.find('.mobile-card-focus__tab--active').text()).to.include('Original');
    expect(wrapper.find('.mobile-card-focus__body--original').isVisible()).eq(true);
    wrapper.unmount();
  });
});
