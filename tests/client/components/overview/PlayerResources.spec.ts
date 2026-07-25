import {mount, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayerResources from '@/client/components/overview/PlayerResources.vue';
import {fakePublicPlayerModel} from '../testHelpers';
import {Resource} from '@/common/Resource';

describe('PlayerResources', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(PlayerResources, {
      ...globalConfig,
      props: {
        player: fakePublicPlayerModel(),
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('places iridium last, after heat', () => {
    const wrapper = mount(PlayerResources, {
      ...globalConfig,
      props: {
        player: fakePublicPlayerModel({iridium: 5}),
      },
    });
    const items = wrapper.findAll('.resource_item');
    expect(items).to.have.length(7);
    expect(items[0].classes()).to.include('resource_item--' + Resource.MEGACREDITS);
    expect(items[1].classes()).to.include('resource_item--' + Resource.STEEL);
    expect(items[2].classes()).to.include('resource_item--' + Resource.TITANIUM);
    expect(items[3].classes()).to.include('resource_item--' + Resource.PLANTS);
    expect(items[4].classes()).to.include('resource_item--' + Resource.ENERGY);
    expect(items[5].classes()).to.include('resource_item--' + Resource.HEAT);
    expect(items[6].classes()).to.include('resource_item--iridium');
    expect(items[6].find('[data-test="iridium-stock-count"]').text()).eq('5');
  });
});
