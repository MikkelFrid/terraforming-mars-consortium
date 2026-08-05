import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {getCardOrThrow} from '@/client/cards/ClientCardManifest';
import {
  buildMobileCardRulesModel,
  buildRulesSections,
  formatRequirement,
} from '@/client/components/mobile/mobileCardRules';

describe('mobileCardRules', () => {
  it('formats oxygen and tag requirements', () => {
    expect(formatRequirement({oxygen: 4})).eq('Oxygen ≥ 4%');
    expect(formatRequirement({oxygen: 2, max: true})).eq('Max Oxygen ≤ 2%');
    expect(formatRequirement({tag: 'plant', count: 2})).eq('2 plant tags');
    expect(formatRequirement({oceans: 5})).eq('Oceans ≥ 5');
  });

  it('splits Algae into on-play stock and production', () => {
    const algae = getCardOrThrow(CardName.ALGAE);
    const sections = buildRulesSections(algae);
    expect(sections.map((s) => s.kind)).deep.eq(['on_play', 'production']);
    const model = buildMobileCardRulesModel(algae);
    expect(model.typeLabel).eq('Automated');
    expect(model.cost).eq(10);
    expect(model.requirements).deep.eq(['Oceans ≥ 5']);
    expect(model.description).to.include('plant production');
  });

  it('labels Birds effect/action style cards', () => {
    const birds = getCardOrThrow(CardName.BIRDS);
    const model = buildMobileCardRulesModel(birds);
    expect(model.type).eq(CardType.ACTIVE);
    expect(model.sections.some((s) => s.kind === 'action' || s.kind === 'effect' || s.kind === 'on_play')).eq(true);
    expect(model.victoryPoints).to.match(/VP/);
  });

  it('builds corporation starting / effect sections for Credicor', () => {
    const corp = getCardOrThrow(CardName.CREDICOR);
    const model = buildMobileCardRulesModel(corp);
    expect(model.typeLabel).eq('Corporation');
    expect(model.sections.length).to.be.greaterThan(0);
    expect(model.sections.some((s) => s.kind === 'starting' || s.kind === 'effect' || s.kind === 'on_play')).eq(true);
  });
});

describe('formatRequirement coverage', () => {
  it('covers party and TR', () => {
    expect(formatRequirement({tr: 20})).eq('TR ≥ 20');
    expect(formatRequirement({party: 'Greens' as never})).to.include('Greens');
    expect(formatRequirement({iridium: 1})).eq('Iridium ≥ 1');
  });
});
