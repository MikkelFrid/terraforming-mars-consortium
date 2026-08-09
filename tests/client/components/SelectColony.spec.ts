import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectColony from '@/client/components/SelectColony.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {ColonyName} from '@/common/colonies/ColonyName';

describe('SelectColony', () => {
  it('mounts with mobile-friendly colony grid markup', () => {
    const wrapper = shallowMount(SelectColony, {
      ...globalConfig,
      props: {
        playerView: {} as PlayerViewModel,
        playerinput: {
          title: 'Select a colony',
          buttonLabel: 'Save',
          type: 'colony',
          coloniesModel: [
            {name: ColonyName.ENCELADUS, isActive: true, colonies: [], trackPosition: 1, visitor: undefined},
            {name: ColonyName.IO, isActive: true, colonies: [], trackPosition: 1, visitor: undefined},
          ],
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.classes()).to.include('wf-component--select-colony');
    expect(wrapper.find('.select-colony__grid').exists()).eq(true);
    expect(wrapper.findAll('.select-colony__option')).has.length(2);
    expect(wrapper.findAll('.select-colony__tile')).has.length(2);
  });
});
