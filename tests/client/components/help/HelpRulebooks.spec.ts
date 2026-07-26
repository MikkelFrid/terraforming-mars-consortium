import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import HelpRulebooks from '@/client/components/help/HelpRulebooks.vue';
import {RULEBOOK_URLS} from '@/client/utils/WikiLinks';

describe('HelpRulebooks', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(HelpRulebooks, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('lists Consortium among fan expansions with the local rulebook URL', () => {
    const wrapper = shallowMount(HelpRulebooks, {
      ...globalConfig,
    });
    const fan = wrapper.vm.$data.fanExpansions as Array<{module: string, url: string, name: string}>;
    const consortium = fan.find((entry) => entry.module === 'consortium');
    expect(consortium).to.not.be.undefined;
    expect(consortium?.name).to.equal('Consortium');
    expect(consortium?.url).to.equal(RULEBOOK_URLS.consortium);
    expect(RULEBOOK_URLS.consortium).to.equal('/assets/consortium/rulebook.html');
  });
});
