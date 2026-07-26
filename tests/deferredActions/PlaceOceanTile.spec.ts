import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {PlaceOceanTile} from '../../src/server/deferredActions/PlaceOceanTile';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {cast} from '../../src/common/utils/utils';
import {SpaceType} from '../../src/common/boards/SpaceType';

describe('PlaceOceanTile', () => {
  it('offers SelectSpace on the Consortium board (has ocean spaces)', () => {
    const [/* game */, player] = testGame(2, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });
    expect(player.game.board.getAvailableSpacesForOcean(player).length).to.be.at.least(9);

    const action = new PlaceOceanTile(player);
    const select = cast(action.execute(), SelectSpace);
    expect(select.spaces.every((s) => s.spaceType === SpaceType.OCEAN)).is.true;
  });

  it('still offers SelectSpace on Tharsis', () => {
    const [/* game */, player] = testGame(2, {});
    const action = new PlaceOceanTile(player);
    cast(action.execute(), SelectSpace);
  });
});
