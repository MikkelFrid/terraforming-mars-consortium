import {expect} from 'chai';
import {FarSideBoomtown} from '../../../src/server/cards/consortium/FarSideBoomtown';
import {RoboticWorkforce} from '../../../src/server/cards/base/RoboticWorkforce';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {TileType} from '../../../src/common/TileType';
import {SelectSpace} from '../../../src/server/inputs/SelectSpace';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {Units} from '../../../src/common/Units';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';
import {Frontier} from '../../../src/server/consortium/Frontier';

describe('FarSideBoomtown', () => {
  it('requires an open frontier sector', () => {
    const card = new FarSideBoomtown();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    unlockBridgeSector(game.board.spaces, 0);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!.completed = true;
    expect(card.canPlay(player)).is.true;
  });

  it('places a city on a frontier space and raises M€ production 2 steps', () => {
    const card = new FarSideBoomtown();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    unlockBridgeSector(game.board.spaces, 0);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!.completed = true;

    cast(card.play(player), undefined);
    expect(player.production.megacredits).eq(2);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectSpace);
    expect(select.spaces.every((s) => Frontier.isFrontierSpace(s))).is.true;
    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.CITY);
    expect(card.getVictoryPoints(player)).eq(1);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new FarSideBoomtown();
    const robotic = new RoboticWorkforce();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.production.override(Units.of({}));

    cast(robotic.play(player), undefined);
    runAllActions(game);
    const selectCard = cast(player.popWaitingFor(), SelectCard);
    expect(selectCard.cards).to.include(card);
    selectCard.cb([card]);
    expect(player.production.megacredits).eq(2);
  });
});
