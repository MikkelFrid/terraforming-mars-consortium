import {expect} from 'chai';
import {mount} from '@vue/test-utils';
import {globalConfig} from '@/../tests/client/components/getLocalVue';
import MobileBottomNav from '@/client/components/mobile/MobileBottomNav.vue';
import MobileHud from '@/client/components/mobile/MobileHud.vue';
import {Color} from '@/common/Color';
import {Phase} from '@/common/Phase';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

describe('MobileBottomNav', () => {
  it('emits mode updates and shows turn badge', async () => {
    const wrapper = mount(MobileBottomNav, {
      ...globalConfig,
      props: {mode: 'table', turnBadge: true},
    });
    expect(wrapper.findAll('.mobile-bottom-nav__item')).length(5);
    expect(wrapper.findAll('.mobile-bottom-nav__icon')).length(5);
    expect(wrapper.find('.mobile-bottom-nav__item--badge').exists()).eq(true);
    expect(wrapper.find('.mobile-bottom-nav__item--active').text()).to.include('Table');
    await wrapper.findAll('.mobile-bottom-nav__item')[0].trigger('click');
    expect(wrapper.emitted('update:mode')?.[0]).deep.eq(['turn']);
  });
});

describe('MobileHud', () => {
  function stubGame(partial: Partial<GameModel> = {}): GameModel {
    return {
      generation: 3,
      phase: Phase.ACTION,
      temperature: -20,
      oxygenLevel: 2,
      oceans: 1,
      venusScaleLevel: 0,
      gameOptions: {expansions: {consortium: true}} as GameModel['gameOptions'],
      ...partial,
    } as GameModel;
  }

  function stubPlayer(partial: Partial<PublicPlayerModel> = {}): PublicPlayerModel {
    return {
      color: 'blue' as Color,
      megacredits: 40,
      steel: 1,
      titanium: 2,
      iridium: 3,
      plants: 0,
      energy: 1,
      heat: 2,
      terraformRating: 22,
      ...partial,
    } as PublicPlayerModel;
  }

  it('shows iridium when consortium is on', () => {
    const wrapper = mount(MobileHud, {
      ...globalConfig,
      props: {
        game: stubGame(),
        player: stubPlayer(),
        isYourTurn: true,
      },
    });
    expect(wrapper.find('.mobile-hud__res--iridium').exists()).eq(true);
    expect(wrapper.find('.mobile-hud__res--iridium').text()).to.contain('3');
    expect(wrapper.find('.mobile-hud__acting--you').exists()).eq(true);
  });
});
