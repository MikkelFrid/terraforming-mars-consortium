import {expect} from 'chai';
import {defineComponent, h} from 'vue';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import BoardCamera from '@/client/components/mobile/BoardCamera.vue';

const Probe = defineComponent({
  name: 'Probe',
  render() {
    return h('div', {class: 'probe'}, 'board');
  },
});

describe('BoardCamera', () => {
  it('renders a world layer for slotted content', () => {
    const wrapper = mount(BoardCamera, {
      ...globalConfig,
      props: {contentWidth: 891, contentHeight: 860},
      slots: {default: Probe},
      attachTo: document.body,
    });
    expect(wrapper.find('.board-camera').exists()).eq(true);
    expect(wrapper.find('.board-camera__world').exists()).eq(true);
    expect(wrapper.find('.probe').text()).eq('board');
    const style = wrapper.find('.board-camera__world').attributes('style') ?? '';
    expect(style).to.include('translate');
    expect(style).to.include('scale');
    wrapper.unmount();
  });
});
