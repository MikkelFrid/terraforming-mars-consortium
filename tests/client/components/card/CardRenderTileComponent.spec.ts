import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CardRenderTileComponent from '@/client/components/card/CardRenderTileComponent.vue';
import {TileType} from '@/common/TileType';

describe('CardRenderTileComponent', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(CardRenderTileComponent, {
      ...globalConfig,
      props: {
        item: {
          is: 'tile',
          tile: TileType.CITY,
        },
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('renders Highland Anchor with its card symbol class', () => {
    const wrapper = shallowMount(CardRenderTileComponent, {
      ...globalConfig,
      props: {
        item: {
          is: 'tile',
          tile: TileType.HIGHLAND_ANCHOR,
          hasSymbol: true,
        },
      },
    });
    const html = wrapper.html();
    expect(html).to.include('card-tile-symbol-highland-anchor');
  });

  it('renders Chasm Descent with its card symbol class', () => {
    const wrapper = shallowMount(CardRenderTileComponent, {
      ...globalConfig,
      props: {
        item: {
          is: 'tile',
          tile: TileType.CHASM_DESCENT,
          hasSymbol: true,
        },
      },
    });
    expect(wrapper.html()).to.include('card-tile-symbol-chasm-descent');
  });

  it('renders Ejecta Blanket with its card symbol class', () => {
    const wrapper = shallowMount(CardRenderTileComponent, {
      ...globalConfig,
      props: {
        item: {
          is: 'tile',
          tile: TileType.EJECTA_BLANKET,
          hasSymbol: true,
        },
      },
    });
    expect(wrapper.html()).to.include('card-tile-symbol-ejecta-blanket');
  });

  it('renders Massif Group with its card symbol class', () => {
    const wrapper = shallowMount(CardRenderTileComponent, {
      ...globalConfig,
      props: {
        item: {
          is: 'tile',
          tile: TileType.MASSIF_GROUP,
          hasSymbol: true,
        },
      },
    });
    expect(wrapper.html()).to.include('card-tile-symbol-massif-group');
  });
});
