import {expect} from 'chai';
import {HighlandTerrace} from '../../../src/server/cards/consortium/HighlandTerrace';
import {RoboticWorkforce} from '../../../src/server/cards/base/RoboticWorkforce';
import {testGame} from '../../TestGame';
import {runAllActions} from '../../TestingUtils';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {SpaceType} from '../../../src/common/boards/SpaceType';
import {TileType} from '../../../src/common/TileType';
import {SelectCard} from '../../../src/server/inputs/SelectCard';
import {Units} from '../../../src/common/Units';

describe('HighlandTerrace', () => {
  it('requires owning a highland tile and raises plant production', () => {
    const card = new HighlandTerrace();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    const highland = game.board.spaces.find((s) =>
      s.spaceType === SpaceType.HIGHLAND && s.tile === undefined)!;
    game.addTile(player, highland, {tileType: TileType.CITY});
    expect(card.canPlay(player)).is.true;

    cast(card.play(player), undefined);
    expect(player.production.plants).eq(1);
    expect(player.plants).eq(1);
  });

  it('is copyable by Robotic Workforce', () => {
    const card = new HighlandTerrace();
    const robotic = new RoboticWorkforce();
    const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playedCards.push(card);
    player.production.override(Units.of({}));
    cast(robotic.play(player), undefined);
    runAllActions(game);
    const selectCard = cast(player.popWaitingFor(), SelectCard);
    expect(selectCard.cards).to.include(card);
    selectCard.cb([card]);
    expect(player.production.plants).eq(1);
  });
});
