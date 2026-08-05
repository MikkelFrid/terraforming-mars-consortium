import {expect} from 'chai';
import {shallowMount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import MobileTableMode from '@/client/components/mobile/MobileTableMode.vue';
import {fakePlayerViewModel, fakePublicPlayerModel, fakeGameModel} from '../testHelpers';
import {ColonyName} from '@/common/colonies/ColonyName';

describe('MobileTableMode table extras', () => {
  it('shows milestones and awards for multiplayer', () => {
    const wrapper = shallowMount(MobileTableMode, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({
          players: [fakePublicPlayerModel(), fakePublicPlayerModel({color: 'red', name: 'red'})],
          game: fakeGameModel({
            milestones: [{name: 'Terraformer', playerName: undefined} as any],
            awards: [{name: 'Landlord', playerName: undefined} as any],
          }),
        }),
        tileView: 'showTiles',
      },
    });
    expect(wrapper.find('[data-test="mobile-table-ma"]').exists()).eq(true);
  });

  it('hides milestones and awards in solo', () => {
    const wrapper = shallowMount(MobileTableMode, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({
          players: [fakePublicPlayerModel()],
          game: fakeGameModel(),
        }),
        tileView: 'showTiles',
      },
    });
    expect(wrapper.find('[data-test="mobile-table-ma"]').exists()).eq(false);
  });

  it('shows colonies when present', () => {
    const wrapper = shallowMount(MobileTableMode, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({
          players: [fakePublicPlayerModel(), fakePublicPlayerModel({color: 'red', name: 'red'})],
          game: fakeGameModel({
            colonies: [{name: ColonyName.EUROPA, isActive: true} as any],
          }),
        }),
        tileView: 'showTiles',
      },
    });
    expect(wrapper.find('[data-test="mobile-table-colonies"]').exists()).eq(true);
  });
});
