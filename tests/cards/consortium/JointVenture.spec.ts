import {expect} from 'chai';
import {JointVenture} from '../../../src/server/cards/consortium/JointVenture';
import {RoboticWorkforce} from '../../../src/server/cards/base/RoboticWorkforce';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {Units} from '../../../src/common/Units';

describe('JointVenture', () => {
  it('requires a megastructure contribution and raises M€ production 4', () => {
    const card = new JointVenture();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    player.megaCredits = BALANCE.BRIDGE_SEGMENT_COST_MC;
    const bridge = game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!;
    Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.production.megacredits).eq(4);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new JointVenture();
    const robotic = new RoboticWorkforce();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.production.override(Units.of({}));
    cast(robotic.play(player), undefined);
    runAllActions(game);
    const selectCard = cast(player.popWaitingFor(), SelectCard);
    expect(selectCard.cards).to.include(card);
    selectCard.cb([card]);
    expect(player.production.megacredits).eq(4);
  });
});
