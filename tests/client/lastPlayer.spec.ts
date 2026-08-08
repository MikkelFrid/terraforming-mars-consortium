import {expect} from 'chai';
import {
  clearLastPlayerId,
  getLastPlayerId,
  parsePlayerIdFromText,
  playerHref,
  rememberPlayerId,
} from '@/client/utils/lastPlayer';
import {FakeLocalStorage} from './components/FakeLocalStorage';

describe('lastPlayer', () => {
  let storage: FakeLocalStorage;

  beforeEach(() => {
    storage = new FakeLocalStorage();
    FakeLocalStorage.register(storage);
    if (typeof document !== 'undefined') {
      document.cookie = 'tm_last_player=; Max-Age=0; Path=/; SameSite=Lax';
    }
  });

  afterEach(() => {
    FakeLocalStorage.deregister(storage);
    if (typeof document !== 'undefined') {
      document.cookie = 'tm_last_player=; Max-Age=0; Path=/; SameSite=Lax';
    }
  });

  it('parses bare player ids and full URLs', () => {
    expect(parsePlayerIdFromText('pABCDEF12')).eq('pABCDEF12');
    expect(parsePlayerIdFromText(
      'https://terraforming-mars-consortium-production.up.railway.app/player?id=pABCDEF12',
    )).eq('pABCDEF12');
    expect(parsePlayerIdFromText('player?id=pABCDEF12&foo=1')).eq('pABCDEF12');
    expect(parsePlayerIdFromText('not-a-player')).eq(undefined);
  });

  it('remembers and reads the last player id', () => {
    rememberPlayerId('pABCDEF12');
    expect(getLastPlayerId()).eq('pABCDEF12');
    expect(playerHref('pABCDEF12')).eq('player?id=pABCDEF12');
    clearLastPlayerId();
    expect(getLastPlayerId()).eq(undefined);
  });
});
