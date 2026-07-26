import {expect} from 'chai';
import {WayfarerCompact} from '../../../src/server/cards/consortium/WayfarerCompact';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {unlockBridgeSector} from '../../../src/server/boards/ConsortiumBoard';

describe('WayfarerCompact', () => {
  it('requires 2 open frontier sectors', () => {
    const card = new WayfarerCompact();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    expect(card.canPlay(player)).is.false;

    unlockBridgeSector(game.board.spaces, 0);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-0')!.completed = true;
    expect(card.canPlay(player)).is.false;

    unlockBridgeSector(game.board.spaces, 1);
    game.megastructuresData!.structures.find((s) => s.id === 'bridge-1')!.completed = true;
    expect(card.canPlay(player)).is.true;
  });

  it('raises M€ production 3 steps', () => {
    const card = new WayfarerCompact();
    const [game, player] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    for (const id of ['bridge-0', 'bridge-1']) {
      unlockBridgeSector(game.board.spaces, Number(id.slice(-1)));
      game.megastructuresData!.structures.find((s) => s.id === id)!.completed = true;
    }
    cast(card.play(player), undefined);
    expect(player.production.megacredits).eq(3);
    expect(card.getVictoryPoints(player)).eq(1);
  });
});
