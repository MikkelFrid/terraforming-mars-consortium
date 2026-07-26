import {expect} from 'chai';
import {FrontierSurvey} from '../../../src/server/cards/consortium/FrontierSurvey';
import {testGame} from '../../TestGame';
import {cast} from '../../../src/common/utils/utils';
import {BoardName} from '../../../src/common/boards/BoardName';
import {fakeCard} from '../../TestingUtils';
import {Megastructures} from '../../../src/server/consortium/Megastructures';
import {Payment} from '../../../src/common/inputs/Payment';
import {MEGASTRUCTURE_BALANCE as BALANCE} from '../../../src/common/consortium/MegastructureConstants';
import {Frontier} from '../../../src/server/consortium/Frontier';

function completeBridge(game: any, player: any, bridgeId: string) {
  const bridge = game.megastructuresData!.structures.find((s: any) => s.id === bridgeId)!;
  player.megaCredits = 200;
  player.iridium = 10;
  game.iridiumBank = 20;
  for (let i = 0; i < BALANCE.BRIDGE_SEGMENT_COUNT - 1; i++) {
    Megastructures.placeSegment(player, bridge, Payment.of({megacredits: BALANCE.BRIDGE_SEGMENT_COST_MC}));
  }
  Megastructures.placeSegment(player, bridge, Payment.of({iridium: BALANCE.BRIDGE_KEYSTONE_MIN_IRIDIUM}));
  expect(bridge.completed).is.true;
}

describe('FrontierSurvey', () => {
  it('draws 1 + open sectors at 0, 1, 2 and 3 open sectors', () => {
    const card = new FrontierSurvey();
    for (const open of [0, 1, 2, 3]) {
      const [game, player] = testGame(1, {consortiumExpansion: true, boardName: BoardName.CONSORTIUM});
      for (let i = 0; i < open; i++) {
        completeBridge(game, player, `bridge-${i}`);
      }
      expect(Frontier.countOpenSectors(game)).eq(open);

      const drawn = Array.from({length: 1 + open}, (_, i) => fakeCard({name: `D${open}-${i}` as any}));
      game.projectDeck.drawPile.push(...[...drawn].reverse());
      player.cardsInHand.length = 0;

      cast(card.play(player), undefined);
      expect(player.cardsInHand).to.have.length(1 + open);
      expect(player.cardsInHand).to.have.members(drawn);
    }
  });
});
