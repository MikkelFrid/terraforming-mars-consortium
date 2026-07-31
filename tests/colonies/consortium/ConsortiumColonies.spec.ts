import {expect} from 'chai';
import {ColonyDealer} from '../../../src/server/colonies/ColonyDealer';
import {ColonyName} from '../../../src/common/colonies/ColonyName';
import {DEFAULT_GAME_OPTIONS} from '../../../src/server/game/GameOptions';
import {SeededRandom} from '../../../src/common/utils/Random';
import {Psyche} from '../../../src/server/colonies/Psyche';
import {Vesta} from '../../../src/server/colonies/Vesta';
import {Davida} from '../../../src/server/colonies/Davida';

describe('ConsortiumColonies', () => {
  it('are not injected into non-Consortium colonies games', () => {
    const dealer = new ColonyDealer(new SeededRandom(0.1), {
      ...DEFAULT_GAME_OPTIONS,
      coloniesExtension: true,
      consortiumExpansion: false,
    });
    dealer.drawColonies(3);
    const names = [...dealer.colonies, ...dealer.discardedColonies].map((c) => c.name);
    expect(names).to.not.include(ColonyName.PSYCHE);
    expect(names).to.not.include(ColonyName.VESTA);
    expect(names).to.not.include(ColonyName.DAVIDA);
  });

  it('enter the pool when Consortium is on', () => {
    const dealer = new ColonyDealer(new SeededRandom(0.1), {
      ...DEFAULT_GAME_OPTIONS,
      coloniesExtension: true,
      consortiumExpansion: true,
    });
    dealer.drawColonies(3);
    const names = [...dealer.colonies, ...dealer.discardedColonies].map((c) => c.name);
    expect(names).to.include(ColonyName.PSYCHE);
    expect(names).to.include(ColonyName.VESTA);
    expect(names).to.include(ColonyName.DAVIDA);
  });

  it('constructs without throwing', () => {
    expect(new Psyche().name).eq(ColonyName.PSYCHE);
    expect(new Vesta().name).eq(ColonyName.VESTA);
    expect(new Davida().name).eq(ColonyName.DAVIDA);
  });
});
