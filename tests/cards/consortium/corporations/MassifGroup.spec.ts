import {expect} from 'chai';
import {MassifGroup} from '../../../../src/server/cards/consortium/corporations/MassifGroup';
import {HighlandTerrace} from '../../../../src/server/cards/consortium/HighlandTerrace';
import {Algae} from '../../../../src/server/cards/base/Algae';
import {testGame} from '../../../TestGame';
import {runAllActions} from '../../../TestingUtils';
import {cast} from '../../../../src/common/utils/utils';
import {BoardName} from '../../../../src/common/boards/BoardName';
import {SpaceType} from '../../../../src/common/boards/SpaceType';
import {TileType} from '../../../../src/common/TileType';
import {SelectSpace} from '../../../../src/server/inputs/SelectSpace';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../../src/common/consortium/MegastructureConstants';

describe('MassifGroup', () => {
  it('places a special tile on a highland when played', () => {
    const card = new MassifGroup();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    runAllActions(game);
    const select = cast(player.popWaitingFor(), SelectSpace);
    expect(select.spaces.every((s) => s.spaceType === SpaceType.HIGHLAND)).is.true;
    select.cb(select.spaces[0]);
    expect(select.spaces[0].tile?.tileType).eq(TileType.MASSIF_GROUP);
  });

  it('discounts cards that require owning a highland tile by 4 M€', () => {
    const card = new MassifGroup();
    const [/* game */, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    player.playCorporationCard(card);
    const terrace = new HighlandTerrace();
    expect(player.getCardCost(terrace)).eq(terrace.cost - BALANCE.MASSIF_HIGHLAND_CARD_DISCOUNT);
    expect(player.getCardCost(new Algae())).eq(new Algae().cost);
  });
});
