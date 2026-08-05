import {isIDescription} from '@/common/cards/render/ICardRenderDescription';
import {CardRequirementDescriptor, requirementType} from '@/common/cards/CardRequirementDescriptor';
import {RequirementType} from '@/common/cards/RequirementType';
import {
  ICardRenderRoot,
  isICardRenderCorpBoxAction,
  isICardRenderCorpBoxEffect,
  isICardRenderCorpBoxEffectAction,
  isICardRenderEffect,
  isICardRenderProductionBox,
  isICardRenderRoot,
  isICardRenderSymbol,
  ItemType,
} from '@/common/cards/render/Types';
import {CardRenderSymbolType} from '@/common/cards/render/CardRenderSymbolType';
import {ClientCard} from '@/common/cards/ClientCard';
import {CardType} from '@/common/cards/CardType';
import {CardModel} from '@/common/models/CardModel';
import {Tag} from '@/common/cards/Tag';
import {CountableVictoryPoints} from '@/common/cards/CountableVictoryPoints';
import {CardRenderDynamicVictoryPoints} from '@/common/cards/render/CardRenderDynamicVictoryPoints';

export type MobileRulesSectionKind = 'starting' | 'on_play' | 'production' | 'effect' | 'action' | 'mixed';

export type MobileRulesSection = {
  kind: MobileRulesSectionKind;
  title: string;
  /** Icon tree to render with existing CardRenderData (no card chrome). */
  renderData: ICardRenderRoot;
};

export type MobileCardRulesModel = {
  name: string;
  type: CardType;
  typeLabel: string;
  cost: number | undefined;
  reducedCost: number | undefined;
  tags: ReadonlyArray<Tag>;
  requirements: ReadonlyArray<string>;
  hasMaxRequirement: boolean;
  sections: ReadonlyArray<MobileRulesSection>;
  description: string | undefined;
  victoryPoints: string | undefined;
  resourceType: string | undefined;
  resourcesOnCard: number | undefined;
  hasAction: boolean;
};

const TYPE_LABELS: Record<CardType, string> = {
  [CardType.EVENT]: 'Event',
  [CardType.ACTIVE]: 'Active',
  [CardType.AUTOMATED]: 'Automated',
  [CardType.PRELUDE]: 'Prelude',
  [CardType.CORPORATION]: 'Corporation',
  [CardType.CEO]: 'CEO',
  [CardType.STANDARD_PROJECT]: 'Standard project',
  [CardType.STANDARD_ACTION]: 'Standard action',
  [CardType.PROXY]: 'Proxy',
};

export function cardTypeLabel(type: CardType): string {
  return TYPE_LABELS[type] ?? String(type);
}

export function formatRequirement(req: CardRequirementDescriptor): string {
  const type = requirementType(req);
  const max = req.max === true;
  const all = req.all === true ? ' (any player)' : '';
  const prefix = max ? 'Max ' : '';

  switch (type) {
  case RequirementType.OXYGEN: {
    const count = req.oxygen ?? req.count ?? 0;
    return `${prefix}Oxygen ${max ? '≤' : '≥'} ${count}%${all}`;
  }
  case RequirementType.TEMPERATURE: {
    const count = req.temperature ?? req.count ?? 0;
    return `${prefix}Temperature ${max ? '≤' : '≥'} ${count}°C${all}`;
  }
  case RequirementType.OCEANS: {
    const count = req.oceans ?? req.count ?? 0;
    return `${prefix}Oceans ${max ? '≤' : '≥'} ${count}${all}`;
  }
  case RequirementType.VENUS: {
    const count = req.venus ?? req.count ?? 0;
    return `${prefix}Venus ${max ? '≤' : '≥'} ${count}%${all}`;
  }
  case RequirementType.TAG: {
    const tag = req.tag ?? 'tag';
    const count = req.count ?? 1;
    const n = count === 1 ? '' : `${count} `;
    return `${prefix}${n}${tag} tag${count === 1 ? '' : 's'}${all}`;
  }
  case RequirementType.CITIES: {
    const count = req.cities ?? req.count ?? 0;
    return `${prefix}Cities ${max ? '≤' : '≥'} ${count}${all}`;
  }
  case RequirementType.GREENERIES: {
    const count = req.greeneries ?? req.count ?? 0;
    return `${prefix}Greeneries ${max ? '≤' : '≥'} ${count}${all}`;
  }
  case RequirementType.PRODUCTION: {
    const count = req.count ?? 1;
    return `${prefix}${req.production ?? 'resource'} production ≥ ${count}${all}`;
  }
  case RequirementType.TR: {
    const count = req.tr ?? req.count ?? 0;
    return `${prefix}TR ${max ? '≤' : '≥'} ${count}${all}`;
  }
  case RequirementType.RESOURCE_TYPES: {
    const count = req.resourceTypes ?? req.count ?? 0;
    return `${prefix}Resource types ≥ ${count}${all}`;
  }
  case RequirementType.REMOVED_PLANTS:
    return 'Requires that you removed plants this generation';
  case RequirementType.FLOATERS: {
    const count = req.floaters ?? req.count ?? 0;
    return `${prefix}Floaters ≥ ${count}${all}`;
  }
  case RequirementType.COLONIES: {
    const count = req.colonies ?? req.count ?? 0;
    return `${prefix}Colonies ≥ ${count}${all}`;
  }
  case RequirementType.PARTY:
    return `Requires ${req.party ?? 'party'} ruling`;
  case RequirementType.PARTY_LEADERS:
    return 'Requires that you are a party leader';
  case RequirementType.CHAIRMAN:
    return 'Requires that you are chairman';
  case RequirementType.HABITAT_RATE: {
    const count = req.habitatRate ?? req.count ?? 0;
    return `${prefix}Moon habitat rate ≥ ${count}`;
  }
  case RequirementType.MINING_RATE: {
    const count = req.miningRate ?? req.count ?? 0;
    return `${prefix}Moon mining rate ≥ ${count}`;
  }
  case RequirementType.LOGISTIC_RATE: {
    const count = req.logisticRate ?? req.count ?? 0;
    return `${prefix}Moon logistic rate ≥ ${count}`;
  }
  case RequirementType.HABITAT_TILES: {
    const count = req.habitatTiles ?? req.count ?? 0;
    return `${prefix}Moon habitats ≥ ${count}${all}`;
  }
  case RequirementType.MINING_TILES: {
    const count = req.miningTiles ?? req.count ?? 0;
    return `${prefix}Moon mines ≥ ${count}${all}`;
  }
  case RequirementType.ROAD_TILES: {
    const count = req.roadTiles ?? req.count ?? 0;
    return `${prefix}Moon roads ≥ ${count}${all}`;
  }
  case RequirementType.IRIDIUM: {
    const count = req.iridium ?? req.count ?? 0;
    return `${prefix}Iridium ≥ ${count}`;
  }
  default:
    return 'Special requirement';
  }
}

function asRoot(rows: Array<Array<ItemType>>): ICardRenderRoot {
  return {is: 'root', rows};
}

/**
 * Split renderData into labeled sections so the phone panel is not one icon soup.
 * Falls back to a single "On play" / "Starting" block when structure is flat.
 */
export function buildRulesSections(clientCard: ClientCard): Array<MobileRulesSection> {
  const renderData = clientCard.metadata.renderData;
  if (!isICardRenderRoot(renderData) || renderData.rows.length === 0) {
    return [];
  }

  const isCorp = clientCard.type === CardType.CORPORATION;
  const sections: Array<MobileRulesSection> = [];
  const looseRows: Array<Array<ItemType>> = [];

  for (const row of renderData.rows) {
    const remaining: Array<ItemType> = [];
    for (const item of row) {
      if (isICardRenderProductionBox(item)) {
        // Keep the production-box wrapper — CSS styles icons only inside it.
        sections.push({
          kind: 'production',
          title: 'Production',
          renderData: asRoot([[item]]),
        });
      } else if (isICardRenderCorpBoxEffect(item)) {
        sections.push({
          kind: 'effect',
          title: 'Effect',
          renderData: asRoot([[item]]),
        });
      } else if (isICardRenderCorpBoxAction(item)) {
        sections.push({
          kind: 'action',
          title: 'Action',
          renderData: asRoot([[item]]),
        });
      } else if (isICardRenderCorpBoxEffectAction(item)) {
        sections.push({
          kind: 'mixed',
          title: 'Effect / Action',
          renderData: asRoot([[item]]),
        });
      } else if (isICardRenderEffect(item)) {
        // Keep the effect wrapper for arrow/cause→effect layout CSS.
        const hasArrow = item.rows.some((r) =>
          r.some((cell) => isICardRenderSymbol(cell) && cell.type === CardRenderSymbolType.ARROW));
        sections.push({
          kind: hasArrow ? 'action' : 'effect',
          title: hasArrow ? 'Action' : 'Effect',
          renderData: asRoot([[item]]),
        });
      } else {
        remaining.push(item);
      }
    }
    if (remaining.length > 0) {
      looseRows.push(remaining);
    }
  }

  if (looseRows.length > 0) {
    if (isCorp && looseRows.length >= 1) {
      sections.unshift({
        kind: 'starting',
        title: 'Starting',
        renderData: asRoot([looseRows[0]]),
      });
      if (looseRows.length > 1) {
        sections.splice(1, 0, {
          kind: 'on_play',
          title: 'On play',
          renderData: asRoot(looseRows.slice(1)),
        });
      }
    } else {
      sections.unshift({
        kind: 'on_play',
        title: clientCard.hasAction ? 'Card' : 'On play',
        renderData: asRoot(looseRows),
      });
    }
  }

  return sections;
}

function victoryPointsLabel(clientCard: ClientCard): string | undefined {
  const vp = clientCard.victoryPoints ?? clientCard.metadata.victoryPoints;
  if (vp === undefined) {
    return undefined;
  }
  if (vp === 'special') {
    return 'Special VP';
  }
  if (typeof vp === 'number') {
    return `${vp} VP`;
  }
  if ('each' in vp || 'tag' in vp || 'cities' in vp || 'oceans' in vp || 'resourcesHere' in vp || 'colonies' in vp || 'moon' in vp) {
    return formatCountableVictoryPoints(vp as CountableVictoryPoints);
  }
  return formatDynamicVictoryPoints(vp as CardRenderDynamicVictoryPoints);
}

function formatDynamicVictoryPoints(vp: CardRenderDynamicVictoryPoints): string {
  if (vp.targetOneOrMore === true) {
    return `${vp.points} VP if ≥${vp.target}`;
  }
  if (vp.target > 0) {
    return `${vp.points} VP / ${vp.target}`;
  }
  if (vp.points !== 0) {
    return `${vp.points} VP`;
  }
  return 'Special VP';
}

function formatCountableVictoryPoints(vp: CountableVictoryPoints): string {
  const points = vp.each ?? 1;
  const per = vp.per ?? 1;
  const perLabel = per === 1 ? '' : `${per} `;
  if (vp.tag !== undefined) {
    return `${points} VP / ${perLabel}${vp.tag}`;
  }
  if (vp.cities !== undefined) {
    return `${points} VP / ${perLabel}city`;
  }
  if (vp.oceans !== undefined) {
    return `${points} VP / ${perLabel}ocean`;
  }
  if (vp.resourcesHere !== undefined) {
    return `${points} VP / ${perLabel}resource here`;
  }
  if (vp.colonies?.colonies !== undefined) {
    return `${points} VP / ${perLabel}colony`;
  }
  if (vp.moon?.mine !== undefined) {
    return `${points} VP / ${perLabel}moon mine`;
  }
  if (vp.moon?.road !== undefined) {
    return `${points} VP / ${perLabel}moon road`;
  }
  return 'VP';
}

export function buildMobileCardRulesModel(
  clientCard: ClientCard,
  runtime?: CardModel,
): MobileCardRulesModel {
  const description = clientCard.metadata.description;
  let cleaned: string | undefined;
  if (typeof description === 'string') {
    cleaned = description.replace(/^\(|\)$/g, '').trim();
  } else if (isIDescription(description)) {
    cleaned = description.text.replace(/^\(|\)$/g, '').trim();
  }

  return {
    name: clientCard.name,
    type: clientCard.type,
    typeLabel: cardTypeLabel(clientCard.type),
    cost: clientCard.cost,
    reducedCost: runtime?.calculatedCost,
    tags: clientCard.tags,
    requirements: (clientCard.requirements ?? []).map(formatRequirement),
    hasMaxRequirement: (clientCard.requirements ?? []).some((r) => r.max === true),
    sections: buildRulesSections(clientCard),
    description: cleaned && cleaned.length > 0 ? cleaned : undefined,
    victoryPoints: victoryPointsLabel(clientCard),
    resourceType: clientCard.resourceType,
    resourcesOnCard: runtime?.resources,
    hasAction: clientCard.hasAction,
  };
}
