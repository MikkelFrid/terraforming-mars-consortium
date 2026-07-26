import {expect} from 'chai';
import {StructuralEngineers} from '../../../src/server/cards/consortium/StructuralEngineers';
import {testGame} from '../../TestGame';
import {BoardName} from '../../../src/common/boards/BoardName';
import {Payment} from '../../../src/common/inputs/Payment';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';
import {FOUNDATION_REQUIRED_KINDS} from '../../../src/common/consortium/MegastructureKind';
import {SeededRandom} from '../../../src/common/utils/Random';

describe('StructuralEngineers', () => {
  it('bypasses the highland foundation gate only for its owner', () => {
    const [game, owner, other] = testGame(2, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
    let structure = game.megastructuresData!.structures.find((s) => FOUNDATION_REQUIRED_KINDS.has(s.kind));
    if (structure === undefined) {
      structure = Megastructures.initialize(new SeededRandom(0.42)).structures
        .find((s) => FOUNDATION_REQUIRED_KINDS.has(s.kind))!;
      game.megastructuresData!.structures.push(structure);
    }

    owner.megaCredits = 100;
    other.megaCredits = 100;
    expect(Megastructures.playerOwnsHighlandTile(owner)).is.false;
    expect(Megastructures.playerOwnsHighlandTile(other)).is.false;
    expect(Megastructures.canContribute(owner, structure)).is.false;
    expect(Megastructures.canContribute(other, structure)).is.false;

    owner.playedCards.push(new StructuralEngineers());
    expect(Megastructures.canContribute(owner, structure)).is.true;
    expect(Megastructures.canContribute(other, structure)).is.false;

    Megastructures.placeSegment(owner, structure, Payment.of({megacredits: BALANCE.GRAND_SEGMENT_COST_MC}));
    expect(structure.segments[0].owner).eq(owner.id);
  });
});
