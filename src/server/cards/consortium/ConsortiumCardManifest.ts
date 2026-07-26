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
import {ScaffoldYard} from './ScaffoldYard';
import {SurveyStake} from './SurveyStake';
import {ModularTruss} from './ModularTruss';
import {SiteForeman} from './SiteForeman';
import {BondedLabour} from './BondedLabour';
import {HighlandAnchor} from './HighlandAnchor';
import {SegmentPrefabrication} from './SegmentPrefabrication';
import {ConsortiumCharter} from './ConsortiumCharter';
import {KeystoneRights} from './KeystoneRights';
import {UnionHall} from './UnionHall';
import {StructuralEngineers} from './StructuralEngineers';
import {LoadBearingStudy} from './LoadBearingStudy';
import {GrandContractor} from './GrandContractor';
import {MonumentFinancing} from './MonumentFinancing';
import {TrailheadCamp} from './TrailheadCamp';
import {FrontierSurvey} from './FrontierSurvey';
import {RimOutpost} from './RimOutpost';
import {ChasmDescent} from './ChasmDescent';
import {OverlandConvoy} from './OverlandConvoy';
import {SectorClaim} from './SectorClaim';
import {DeepReachRover} from './DeepReachRover';
import {FarSideBoomtown} from './FarSideBoomtown';
import {WayfarerCompact} from './WayfarerCompact';
import {FrontierCharter} from './FrontierCharter';

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
    [CardName.SCAFFOLD_YARD]: {Factory: ScaffoldYard},
    [CardName.SURVEY_STAKE]: {Factory: SurveyStake},
    [CardName.MODULAR_TRUSS]: {Factory: ModularTruss},
    [CardName.SITE_FOREMAN]: {Factory: SiteForeman},
    [CardName.BONDED_LABOUR]: {Factory: BondedLabour},
    [CardName.HIGHLAND_ANCHOR]: {Factory: HighlandAnchor},
    [CardName.SEGMENT_PREFABRICATION]: {Factory: SegmentPrefabrication},
    [CardName.CONSORTIUM_CHARTER]: {Factory: ConsortiumCharter},
    [CardName.KEYSTONE_RIGHTS]: {Factory: KeystoneRights},
    [CardName.UNION_HALL]: {Factory: UnionHall},
    [CardName.STRUCTURAL_ENGINEERS]: {Factory: StructuralEngineers},
    [CardName.LOAD_BEARING_STUDY]: {Factory: LoadBearingStudy},
    [CardName.GRAND_CONTRACTOR]: {Factory: GrandContractor},
    [CardName.MONUMENT_FINANCING]: {Factory: MonumentFinancing},
    [CardName.TRAILHEAD_CAMP]: {Factory: TrailheadCamp},
    [CardName.FRONTIER_SURVEY]: {Factory: FrontierSurvey},
    [CardName.RIM_OUTPOST]: {Factory: RimOutpost},
    [CardName.CHASM_DESCENT]: {Factory: ChasmDescent},
    [CardName.OVERLAND_CONVOY]: {Factory: OverlandConvoy},
    [CardName.SECTOR_CLAIM]: {Factory: SectorClaim},
    [CardName.DEEP_REACH_ROVER]: {Factory: DeepReachRover},
    [CardName.FAR_SIDE_BOOMTOWN]: {Factory: FarSideBoomtown},
    [CardName.WAYFARER_COMPACT]: {Factory: WayfarerCompact},
    [CardName.FRONTIER_CHARTER]: {Factory: FrontierCharter},
  },
  standardProjects: {
    [CardName.CORE_SAMPLING_STANDARD_PROJECT]: {Factory: CoreSamplingStandardProject},
  },
});
