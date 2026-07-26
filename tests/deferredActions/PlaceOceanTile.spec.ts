import {expect} from 'chai';
import {testGame} from '../TestGame';
import {BoardName} from '../../src/common/boards/BoardName';
import {PlaceOceanTile} from '../../src/server/deferredActions/PlaceOceanTile';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {cast} from '../../src/common/utils/utils';

describe('PlaceOceanTile', () => {
  it('soft-skips when the board has no ocean spaces (Consortium)', () => {
    const [/* game */, player] = testGame(2, {
      consortiumExpansion: true,
      boardName: BoardName.CONSORTIUM,
    });
    expect(player.game.board.getAvailableSpacesForOcean(player)).to.have.length(0);

    const action = new PlaceOceanTile(player);
    expect(action.execute()).to.be.undefined;
  });

  it('still offers SelectSpace on boards with oceans', () => {
    const [/* game */, player] = testGame(2, {});
    const action = new PlaceOceanTile(player);
    cast(action.execute(), SelectSpace);
  });
});
