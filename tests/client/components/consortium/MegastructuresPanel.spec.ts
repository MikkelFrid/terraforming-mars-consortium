import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MegastructuresPanel from '@/client/components/consortium/MegastructuresPanel.vue';
import {MegastructuresModel} from '@/common/models/MegastructuresModel';

function fiveStructures(overrides?: Partial<MegastructuresModel['structures'][0]>): MegastructuresModel {
  const base = {
    kind: 'bridge' as const,
    sector: 0,
    segments: [
      {ownerColor: undefined, isKeystone: false},
      {ownerColor: undefined, isKeystone: false},
      {ownerColor: undefined, isKeystone: false},
      {ownerColor: undefined, isKeystone: true, keystoneMinIridium: 2},
    ],
    completed: false,
    nextSegmentCost: 12,
    nextIsKeystone: false,
    nextMinIridium: 0,
    keystoneMinIridium: 2,
    canContribute: true,
    ineligibility: undefined,
    contributors: [],
    completionGranted: undefined,
    outcome: 'Opens sector 0. Contributors: +1 M€ prod / segment.',
  };
  return {
    structures: [
      {...base, id: 'bridge-0', name: 'Bridge (Sector 0)', sector: 0, ...overrides},
      {...base, id: 'bridge-1', name: 'Bridge (Sector 1)', sector: 1, kind: 'bridge',
        outcome: 'Opens sector 1. Contributors: +1 M€ prod / segment.'},
      {...base, id: 'bridge-2', name: 'Bridge (Sector 2)', sector: 2, kind: 'bridge',
        outcome: 'Opens sector 2. Contributors: +1 M€ prod / segment.'},
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
          {ownerColor: undefined, isKeystone: true, keystoneMinIridium: 3},
        ],
        nextSegmentCost: 16,
        nextMinIridium: 0,
        keystoneMinIridium: 3,
        canContribute: false,
        ineligibility: 'missing_foundation',
        outcome: 'All: −2 M€ on space tags. Contributors: titanium prod.',
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
          keystoneMinIridium: i === 5 ? 3 : undefined,
        })),
        completed: true,
        nextSegmentCost: undefined,
        nextIsKeystone: false,
        nextMinIridium: 0,
        keystoneMinIridium: 3,
        canContribute: false,
        ineligibility: 'completed',
        contributors: [
          {color: 'blue', name: 'Blue', count: 6, keystone: true},
        ],
        completionGranted: 'All: +1 heat prod. Contributors: iridium now + each generation.',
        outcome: 'All: +1 heat prod. Contributors: iridium now + each generation.',
      },
    ],
  };
}

describe('MegastructuresPanel', () => {
  it('always shows all five structures (no collapse)', () => {
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        canAct: true,
      },
    });
    expect(wrapper.find('[data-test="megastructures-panel"]').exists()).is.true;
    expect(wrapper.find('[data-test="megastructures-details"]').isVisible()).is.true;
    expect(wrapper.findAll('[data-test^="megastructure-"]')).to.have.length(5);
    expect(wrapper.find('[data-test="toggle-megastructures"]').exists()).is.false;
  });

  it('shows outcome text on every track', () => {
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
      },
    });
    const bridge = wrapper.find('[data-test="megastructure-bridge-0"]');
    expect(bridge.find('[data-test="outcome"]').text()).to.include('Opens sector');
  });

  it('shows segment ownership with player colours', () => {
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        canAct: false,
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

  it('marks the keystone segment as distinguishable and shows its iridium requirement', () => {
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
      },
    });
    const bridge = wrapper.find('[data-test="megastructure-bridge-0"]');
    const keystone = bridge.find('[data-test="segment-keystone"]');
    expect(keystone.exists()).is.true;
    expect(keystone.classes()).to.include('megastructure-segment--keystone');
    expect(keystone.find('[data-test="keystone-iridium"]').text()).to.include('2 Ir');
    expect(bridge.find('[data-test="next-cost"]').text()).to.match(/12 M€/);
    const ordinary = bridge.findAll('[data-test="segment"]');
    expect(ordinary.length).to.be.greaterThan(0);
    ordinary.forEach((seg) => {
      expect(seg.classes()).to.not.include('megastructure-segment--keystone');
    });
  });

  it('shows full next cost including iridium when the next segment is the keystone', () => {
    const model = fiveStructures({
      nextSegmentCost: 8,
      nextIsKeystone: true,
      nextMinIridium: 2,
      segments: [
        {ownerColor: 'blue', isKeystone: false},
        {ownerColor: 'blue', isKeystone: false},
        {ownerColor: 'red', isKeystone: false},
        {ownerColor: undefined, isKeystone: true, keystoneMinIridium: 2},
      ],
    });
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: model,
      },
    });
    const cost = wrapper.find('[data-test="megastructure-bridge-0"] [data-test="next-cost"]');
    expect(cost.text()).to.include('8 M€');
    expect(cost.text()).to.include('2 Ir');
    expect(cost.text()).to.include('keystone');
  });

  it('displays ineligibility reason when the viewer cannot contribute', () => {
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
        canAct: true,
      },
    });
    const elevator = wrapper.find('[data-test="megastructure-space_elevator"]');
    const reason = elevator.find('[data-test="ineligibility"]');
    expect(reason.exists()).is.true;
    expect(reason.text()).to.include('highland');
  });

  it('emits highlight-sector when hovering a bridge track', async () => {
    const wrapper = mount(MegastructuresPanel, {
      ...globalConfig,
      props: {
        megastructures: fiveStructures(),
      },
    });
    await wrapper.find('[data-test="megastructure-bridge-1"]').trigger('mouseenter');
    expect(wrapper.emitted('highlight-sector')?.at(-1)).to.deep.eq([1]);
    await wrapper.find('[data-test="megastructure-bridge-1"]').trigger('mouseleave');
    expect(wrapper.emitted('highlight-sector')?.at(-1)).to.deep.eq([undefined]);
  });
});
