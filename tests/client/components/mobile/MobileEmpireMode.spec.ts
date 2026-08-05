import {expect} from 'chai';
import {mount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import MobileEmpireMode from '@/client/components/mobile/MobileEmpireMode.vue';
import {CardName} from '@/common/cards/CardName';
import {PlayerViewModel} from '@/common/models/PlayerModel';

function stubView(): PlayerViewModel {
  return {
    id: 'p1',
    runId: 'r1',
    cardsInHand: [],
    preludeCardsInHand: [],
    ceoCardsInHand: [],
    thisPlayer: {
      color: 'blue',
      tableau: [
        {name: CardName.ECOLINE},
        {name: CardName.MOHOLE},
        {name: CardName.ALGAE},
        {name: CardName.BIRDS},
      ],
    },
    players: [],
    game: {gameOptions: {expansions: {}}},
  } as unknown as PlayerViewModel;
}

describe('MobileEmpireMode size control', () => {
  it('shared S/M/L resizes played cards even when hand is empty', async () => {
    const wrapper = mount(MobileEmpireMode, {
      ...globalConfig,
      props: {playerView: stubView()},
      global: {
        ...globalConfig.global,
        stubs: {MobileCardFocusSheet: true, Teleport: true, Card: true},
      },
      attachTo: document.body,
    });

    expect(wrapper.find('[data-test="mobile-empire-size"]').exists()).eq(true);
    const tableau = wrapper.find('[data-test="mobile-tableau"]');
    expect(tableau.findAll('.mobile-card-tile')).length(4);

    await wrapper.find('[data-test="mobile-card-size-s"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as {gridSize: string}).gridSize).eq('s');
    expect(tableau.find('[data-test="mobile-card-grid"]').classes())
      .to.include('mobile-card-grid--s');

    await wrapper.find('[data-test="mobile-card-size-l"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as unknown as {gridSize: string}).gridSize).eq('l');
    expect(tableau.find('[data-test="mobile-card-grid"]').classes())
      .to.include('mobile-card-grid--l');

    wrapper.unmount();
  });
});
