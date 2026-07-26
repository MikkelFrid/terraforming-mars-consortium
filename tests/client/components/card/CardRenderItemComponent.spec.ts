import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardRenderItemComponent from '@/client/components/card/CardRenderItemComponent.vue';
import {CardRenderItemType} from '@/common/cards/render/CardRenderItemType';

describe('CardRenderItemComponent', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(CardRenderItemComponent, {
      ...globalConfig,
      props: {
        item: {
          is: 'item',
          type: CardRenderItemType.MEGACREDITS,
          amount: 3,
        },
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('renders Consortium iridium with the resource icon class', () => {
    const wrapper = shallowMount(CardRenderItemComponent, {
      ...globalConfig,
      props: {
        item: {
          is: 'item',
          type: CardRenderItemType.IRIDIUM,
          amount: 2,
        },
      },
    });
    expect(wrapper.find('.card-resource-iridium').exists()).to.be.true;
  });
});
