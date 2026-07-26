import {CardName} from '../../../common/cards/CardName';
import {ModuleManifest} from '../ModuleManifest';
import {CoreSamplingStandardProject} from './standardProjects/CoreSamplingStandardProject';
import {SiderophileExtraction} from './SiderophileExtraction';
import {SalvageClaim} from './SalvageClaim';
import {AssayRights} from './AssayRights';
import {CoreSampleSurvey} from './CoreSampleSurvey';
import {DeepCrustMapping} from './DeepCrustMapping';
import {ImpactBasinClaim} from './ImpactBasinClaim';
import {RegolithSifters} from './RegolithSifters';
import {ProspectorsCamp} from './ProspectorsCamp';
import {MeteoriticRefinery} from './MeteoriticRefinery';
import {IridiumCartel} from './IridiumCartel';

export const CONSORTIUM_CARD_MANIFEST = new ModuleManifest({
  module: 'consortium',
  projectCards: {
    [CardName.SIDEROPHILE_EXTRACTION]: {Factory: SiderophileExtraction},
    [CardName.SALVAGE_CLAIM]: {Factory: SalvageClaim},
    [CardName.ASSAY_RIGHTS]: {Factory: AssayRights},
    [CardName.CORE_SAMPLE_SURVEY]: {Factory: CoreSampleSurvey},
    [CardName.DEEP_CRUST_MAPPING]: {Factory: DeepCrustMapping},
    [CardName.IMPACT_BASIN_CLAIM]: {Factory: ImpactBasinClaim},
    [CardName.REGOLITH_SIFTERS]: {Factory: RegolithSifters},
    [CardName.PROSPECTORS_CAMP]: {Factory: ProspectorsCamp},
    [CardName.METEORITIC_REFINERY]: {Factory: MeteoriticRefinery},
    [CardName.IRIDIUM_CARTEL]: {Factory: IridiumCartel},
  },
  standardProjects: {
    [CardName.CORE_SAMPLING_STANDARD_PROJECT]: {Factory: CoreSamplingStandardProject},
  },
});
