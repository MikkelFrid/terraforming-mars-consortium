import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import BoardSpaceTile from '@/client/components/board/BoardSpaceTile.vue';
import {SpaceType} from '@/common/boards/SpaceType';
import {TileType} from '@/common/TileType';

describe('BoardSpaceTile', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(BoardSpaceTile, {
      ...globalConfig,
      props: {
        space: {
          id: '01',
          x: 0,
          y: 0,
          bonus: [],
          color: undefined,
          tileType: undefined,
          spaceType: SpaceType.LAND,
          highlight: undefined,
        },
        aresExtension: false,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('renders Highland Anchor with its board CSS class', () => {
    const wrapper = shallowMount(BoardSpaceTile, {
      ...globalConfig,
      props: {
        space: {
          id: '02',
          x: 1,
          y: 0,
          bonus: [],
          color: 'blue',
          tileType: TileType.HIGHLAND_ANCHOR,
          spaceType: SpaceType.HIGHLAND,
          highlight: undefined,
        },
        aresExtension: false,
      },
    });
    expect(wrapper.classes().some((c) => c.includes('highland_anchor'))).to.be.true;
  });

  it('renders Trailhead Camp with its board CSS class', () => {
    const wrapper = shallowMount(BoardSpaceTile, {
      ...globalConfig,
      props: {
        space: {
          id: '03',
          x: 2,
          y: 0,
          bonus: [],
          color: 'red',
          tileType: TileType.TRAILHEAD_CAMP,
          spaceType: SpaceType.LAND,
          highlight: undefined,
        },
        aresExtension: false,
      },
    });
    expect(wrapper.classes().some((c) => c.includes('trailhead_camp'))).to.be.true;
  });

  it('renders Basalt Quarry with its board CSS class', () => {
    const wrapper = shallowMount(BoardSpaceTile, {
      ...globalConfig,
      props: {
        space: {
          id: '04',
          x: 3,
          y: 0,
          bonus: [],
          color: 'red',
          tileType: TileType.BASALT_QUARRY,
          spaceType: SpaceType.HIGHLAND,
          highlight: undefined,
        },
        aresExtension: false,
      },
    });
    expect(wrapper.classes().some((c) => c.includes('basalt_quarry'))).to.be.true;
  });
});
