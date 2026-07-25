import {expect} from 'chai';
import {testGame} from '../TestGame';
import {Game} from '../../src/server/Game';
import {Server} from '../../src/server/models/ServerModel';

describe('ConsortiumExpansion option', () => {
  it('is stored on a new game when enabled', () => {
    const [game] = testGame(1, {consortiumExpansion: true});
    expect(game.gameOptions.consortiumExpansion).is.true;
    expect(game.gameOptions.expansions.consortium).is.true;
  });

  it('round-trips through serialize/deserialize when enabled', () => {
    const [game] = testGame(1, {consortiumExpansion: true});
    const restored = Game.deserialize(game.serialize());
    expect(restored.gameOptions.consortiumExpansion).is.true;
    expect(restored.gameOptions.expansions.consortium).is.true;
    expect(Server.getGameOptionsAsModel(restored.gameOptions).expansions.consortium).is.true;
  });

  it('defaults missing fields to false on deserialize (backward compatibility)', () => {
    const [game] = testGame(1);
    const serialized = game.serialize();
    // Simulate a save from before Consortium existed.
    delete (serialized.gameOptions as {consortiumExpansion?: boolean}).consortiumExpansion;
    delete (serialized.gameOptions.expansions as {consortium?: boolean}).consortium;

    const restored = Game.deserialize(serialized);
    expect(restored.gameOptions.consortiumExpansion).is.false;
    expect(restored.gameOptions.expansions.consortium).is.false;
  });

  it('leaves a normal game alone when the module is off', () => {
    const [game] = testGame(1, {consortiumExpansion: false});
    expect(game.gameOptions.consortiumExpansion).is.false;
    const restored = Game.deserialize(game.serialize());
    expect(restored.gameOptions.consortiumExpansion).is.false;
    expect(restored.gameOptions.expansions.consortium).is.false;
  });
});
