import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HelpIconology from '@/client/components/help/HelpIconology.vue';

describe('HelpIconology', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(HelpIconology, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('documents Consortium iridium and both new tags', () => {
    const wrapper = shallowMount(HelpIconology, {
      ...globalConfig,
    });
    const html = wrapper.html();
    expect(html).to.include('help-icon-resource iridium');
    expect(html).to.include('tag-structure');
    expect(html).to.include('tag-prospecting');
    expect(html).to.include('expansion-icon-consortium');
  });
});
