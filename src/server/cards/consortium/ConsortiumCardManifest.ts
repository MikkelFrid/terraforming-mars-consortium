import {CardName} from '../../../common/cards/CardName';
import {ModuleManifest} from '../ModuleManifest';
import {CoreSamplingStandardProject} from './standardProjects/CoreSamplingStandardProject';

export const CONSORTIUM_CARD_MANIFEST = new ModuleManifest({
  module: 'consortium',
  projectCards: {},
  standardProjects: {
    [CardName.CORE_SAMPLING_STANDARD_PROJECT]: {Factory: CoreSamplingStandardProject},
  },
});
