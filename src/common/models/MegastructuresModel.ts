import {Color} from '../Color';
import {MegastructureId, MegastructureKind} from '../consortium/MegastructureKind';

/** Why the viewing player cannot contribute to a structure. */
export type MegastructureIneligibility = 'cannot_afford' | 'missing_foundation' | 'completed';

export type MegastructureSegmentModel = {
  /** Player colour of the owner, or undefined if empty. */
  ownerColor: Color | undefined;
  isKeystone: boolean;
  /** Present on the keystone cell so the iridium gate is visible before it is next. */
  keystoneMinIridium?: number;
};

export type MegastructureContributorModel = {
  color: Color;
  name: string;
  count: number;
  /** True if this player placed the keystone. */
  keystone: boolean;
};

/** Resource / effect icons used in the compact megastructure outcome strip. */
export type MegastructureRewardIconKind =
  | 'megacredits'
  | 'heat'
  | 'plants'
  | 'titanium'
  | 'iridium'
  | 'temperature'
  | 'vp'
  | 'space';

export type MegastructureRewardIcon = {
  kind: MegastructureRewardIconKind;
  /** Wrap in a production box (brown frame). */
  production?: boolean;
  /** Optional numeral drawn on/near the icon (e.g. "1", "−2"). */
  text?: string;
};

/** One chip in the outcome strip: label + icons + optional suffix. */
export type MegastructureOutcomeChip = {
  label?: string;
  icons?: ReadonlyArray<MegastructureRewardIcon>;
  suffix?: string;
};

export type MegastructureModel = {
  id: MegastructureId;
  kind: MegastructureKind;
  name: string;
  sector?: number;
  segments: ReadonlyArray<MegastructureSegmentModel>;
  completed: boolean;
  /** Cost of the next empty segment in M€; undefined when complete. */
  nextSegmentCost: number | undefined;
  nextIsKeystone: boolean;
  /** Min iridium required if the next segment is the keystone; else 0. */
  nextMinIridium: number;
  keystoneMinIridium: number;
  /** Viewing-player eligibility (false for spectators). */
  canContribute: boolean;
  ineligibility: MegastructureIneligibility | undefined;
  contributors: ReadonlyArray<MegastructureContributorModel>;
  /** Short description of what completion granted (stub until phase 6c). */
  completionGranted: string | undefined;
  /** Always-on outcome blurb (unlock / global / contributor reward). */
  outcome: string;
  /** Icon-backed outcome chips for the strip UI (additive; older clients ignore). */
  outcomeChips: ReadonlyArray<MegastructureOutcomeChip>;
};

export type MegastructuresModel = {
  structures: ReadonlyArray<MegastructureModel>;
};
