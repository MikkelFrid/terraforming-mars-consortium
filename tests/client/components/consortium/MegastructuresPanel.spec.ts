import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MegastructuresPanel from '@/client/components/consortium/MegastructuresPanel.vue';
import {MegastructuresModel} from '@/common/models/MegastructuresModel';
import {PreferencesManager} from '@/client/utils/PreferencesManager';

function fiveStructures(overrides?: Partial<MegastructuresModel['structures'][0]>): MegastructuresModel {
  const base = {
    kind: 'bridge' as const,
    sector: 0,
    segments: [
      {ownerColor: undefined, isKeystone: false},
      {ownerColor: undefined, isKeystone: false},
      {ownerColor: undefined, isKeystone: false},
      {ownerColor: undefined, isKeystone: true},
    ],
    completed: false,
    nextSegmentCost: 12,
    nextIsKeystone: false,
    keystoneMinIridium: 2,
    canContribute: true,
    ineligibility: undefined,
    contributors: [],
    completionGranted: undefined,
  };
  return {
    structures: [
      {...base, id: 'bridge-0', name: 'Bridge (Sector 0)', sector: 0, ...overrides},
      {...base, id: 'bridge-1', name: 'Bridge (Sector 1)', sector: 1, kind: 'bridge'},
      {...base, id: 'bridge-2', name: 'Bridge (Sector 2)', sector: 2, kind: 'bridge'},
      {
        ...base,
        id: 'space_elevator',
        name: 'Space Elevator',
        kind: 'space_elevator',
        sector: undefined,
        segments: [
          {ownerColor: 'blue', isKeystone: false},
          {ownerColor: 'red', isKeystone: false},
          {ownerColor: undefined, isKeystone: false},
          {ownerColor: undefined, isKeystone: false},
          {ownerColor: undefined, isKeystone: false},
          {ownerColor: undefined, isKeystone: true},
        ],
        nextSegmentCost: 16,
        canContribute: false,
        ineligibility: 'missing_foundation',
      },
      {
        ...base,
        id: 'mohole',
        name: 'Mohole',
        kind: 'mohole',
        sector: undefined,
        segments: Array.from({length: 6}, (_, i) => ({
          ownerColor: 'blue' as const,
          isKeystone: i === 5,
        })),
        completed: true,
        nextSegmentCost: undefined,
        nextIsKeystone: false,
        canContribute: false,
        ineligibility: 'completed',
        contributors: [
          {color: 'blue', name: 'Blue', count: 6, keystone: true},
        ],
        completionGranted: 'Mohole effect (stub). Contributors: 1 VP/segment + 2 VP keystone bonus.',
      },
    ],
  };
}

describe('MegastructuresPanel', () => {
  beforeEach(() => {
    PreferencesManager.resetForTest();
  });

  it('renders all five structures when expanded', async () => {
    PreferencesManager.INSTANCE.set('show_megastructure_details', true);
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        canAct: true,
        preferences: PreferencesManager.INSTANCE.values(),
      },
    });
    expect(wrapper.find('[data-test="megastructures-panel"]').exists()).is.true;
    expect(wrapper.findAll('[data-test^="megastructure-"]')).to.have.length(5);
    expect(wrapper.find('[data-test="megastructure-bridge-0"]').exists()).is.true;
    expect(wrapper.find('[data-test="megastructure-space_elevator"]').exists()).is.true;
    expect(wrapper.find('[data-test="megastructure-mohole"]').exists()).is.true;
  });

  it('shows segment ownership with player colours', () => {
    PreferencesManager.INSTANCE.set('show_megastructure_details', true);
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        canAct: false,
        preferences: PreferencesManager.INSTANCE.values(),
      },
    });
    const elevator = wrapper.find('[data-test="megastructure-space_elevator"]');
    const filled = elevator.findAll('[data-owner-color]');
    const colors = filled.map((n) => n.attributes('data-owner-color')).filter((c) => c);
    expect(colors).to.include('blue');
    expect(colors).to.include('red');
    expect(elevator.find('.board-cube--blue').exists()).is.true;
    expect(elevator.find('.board-cube--red').exists()).is.true;
  });

  it('marks the keystone segment as distinguishable', () => {
    PreferencesManager.INSTANCE.set('show_megastructure_details', true);
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        preferences: PreferencesManager.INSTANCE.values(),
      },
    });
    const bridge = wrapper.find('[data-test="megastructure-bridge-0"]');
    const keystone = bridge.find('[data-test="segment-keystone"]');
    expect(keystone.exists()).is.true;
    expect(keystone.classes()).to.include('megastructure-segment--keystone');
    // Ordinary segments lack the keystone class.
    const ordinary = bridge.findAll('[data-test="segment"]');
    expect(ordinary.length).to.be.greaterThan(0);
    ordinary.forEach((seg) => {
      expect(seg.classes()).to.not.include('megastructure-segment--keystone');
    });
  });

  it('displays ineligibility reason when the viewer cannot contribute', () => {
    PreferencesManager.INSTANCE.set('show_megastructure_details', true);
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        canAct: true,
        preferences: PreferencesManager.INSTANCE.values(),
      },
    });
    const elevator = wrapper.find('[data-test="megastructure-space_elevator"]');
    const reason = elevator.find('[data-test="ineligibility"]');
    expect(reason.exists()).is.true;
    expect(reason.text()).to.include('Missing highland foundation');
  });

  it('defaults to collapsed and remembers expand state', async () => {
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        preferences: PreferencesManager.INSTANCE.values(),
      },
    });
    expect(wrapper.vm.showDetails).is.false;
    expect(wrapper.find('[data-test="megastructures-details"]').attributes('style') ?? '')
      .to.match(/display:\s*none/);
    await wrapper.find('[data-test="toggle-megastructures"]').trigger('click');
    expect(wrapper.vm.showDetails).is.true;
    expect(PreferencesManager.INSTANCE.values().show_megastructure_details).is.true;
  });
});
