import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import BoardSpace from '@/client/components/BoardSpace.vue';

describe('BoardSpace', () => {
  it('has visible tile', async () => {
    const wrapper = mount(BoardSpace, {
      ...globalConfig,
      props: {
        space: {id: 'm1', bonus: []},
        tileView: 'show',
      },
    });

    expect(wrapper.find('[data-test="tile"]').classes()).to.not.contain('board-hidden-tile');
  });

  it('has hidden tile if hidden props is passed', async () => {
    const wrapper = mount(BoardSpace, {
      ...globalConfig,
      props: {
        space: {id: 'm1', bonus: []},
        tileView: 'hide',
      },
    });

    expect(wrapper.find('[data-test="tile"]').classes()).to.contain('board-hidden-tile');
  });

  it('shows a lock indicator on locked frontier spaces', () => {
    const wrapper = mount(BoardSpace, {
      ...globalConfig,
      props: {
        space: {id: '042', bonus: [], bridge: 1, locked: true},
        tileView: 'show',
      },
    });
    expect(wrapper.classes()).to.contain('board-space--frontier-locked');
    const lock = wrapper.find('[data-test="frontier-lock"]');
    expect(lock.exists()).is.true;
    expect(lock.attributes('title')).to.include('Bridge (Sector 1)');
  });

  it('hides the lock indicator once unlocked', () => {
    const wrapper = mount(BoardSpace, {
      ...globalConfig,
      props: {
        space: {id: '042', bonus: [], bridge: 1, locked: false},
        tileView: 'show',
      },
    });
    expect(wrapper.find('[data-test="frontier-lock"]').exists()).is.false;
  });
});
