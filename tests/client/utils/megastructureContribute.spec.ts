import {expect} from 'chai';
import {buildContributeResponse} from '@/client/utils/megastructureContribute';
import {OrOptionsModel} from '@/common/models/PlayerInputModel';

describe('buildContributeResponse', () => {
  it('selects a nested megastructure option by id', () => {
    const waitingFor: OrOptionsModel = {
      type: 'or',
      title: 'Take action',
      buttonLabel: 'Save',
      options: [
        {type: 'option', title: 'Pass', buttonLabel: 'Pass'},
        {
          type: 'or',
          title: 'Contribute to a megastructure',
          buttonLabel: 'Contribute',
          options: [
            {
              type: 'option',
              title: 'Contribute segment 1 to Bridge (Sector 0) [bridge-0] (12 M€)',
              buttonLabel: 'Confirm',
            },
            {
              type: 'option',
              title: 'Contribute segment 1 to Bridge (Sector 1) [bridge-1] (12 M€)',
              buttonLabel: 'Confirm',
            },
          ],
        },
      ],
    };
    expect(buildContributeResponse(waitingFor, 'bridge-1')).to.deep.eq({
      type: 'or',
      index: 1,
      response: {type: 'or', index: 1, response: {type: 'option'}},
    });
  });

  it('returns undefined when the structure is not contributable', () => {
    const waitingFor: OrOptionsModel = {
      type: 'or',
      title: 'Take action',
      buttonLabel: 'Save',
      options: [
        {type: 'option', title: 'Pass', buttonLabel: 'Pass'},
      ],
    };
    expect(buildContributeResponse(waitingFor, 'bridge-0')).is.undefined;
  });
});
