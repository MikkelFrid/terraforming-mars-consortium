import {mount, shallowMount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {expect} from 'chai';
import CreateGameForm from '@/client/components/create/CreateGameForm.vue';
import {CreateGameSettingsStorage} from '@/client/components/create/CreateGameSettingsStorage';
import {FakeLocalStorage} from '../FakeLocalStorage';
import {BoardName} from '@/common/boards/BoardName';
import {RandomBoardOption} from '@/common/boards/RandomBoardOption';
import {DEFAULT_EXPANSIONS} from '@/common/cards/GameModule';
import {JSONObject} from '@/common/Types';
import {defineComponent} from 'vue';

// Minimal serialized Create Game payload used by settings restore tests.
function createGameSettings(overrides: JSONObject = {}): JSONObject {
  return {
    players: [
      {name: 'Alice', color: 'red', beginner: false, handicap: 0},
      {name: 'Bob', color: 'blue', beginner: false, handicap: 0},
    ],
    expansions: DEFAULT_EXPANSIONS,
    board: BoardName.HELLAS,
    draftVariant: false,
    solarPhaseOption: true,
    ...overrides,
  };
}

describe('CreateGameForm', () => {
  let localStorage: FakeLocalStorage;

  beforeEach(() => {
    localStorage = new FakeLocalStorage();
    FakeLocalStorage.register(localStorage);
  });

  afterEach(() => {
    FakeLocalStorage.deregister(localStorage);
  });

  it('mounts without errors', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('keeps Consortium expansion and board input ids distinct', async () => {
    // Regression: board radios used id=`${boardName}-checkbox`, colliding with
    // the Consortium expansion checkbox (`consortium-checkbox`). Clicking the
    // Consortium map then toggled the expansion off instead of selecting the board.
    const wrapper = mount(CreateGameForm, {
      ...globalConfig,
    });
    (wrapper.vm as any).expansions.consortium = true;
    await wrapper.vm.$nextTick();

    const expansion = wrapper.find('#consortium-checkbox');
    const board = wrapper.find('#board-consortium-radio');
    expect(expansion.exists()).to.be.true;
    expect(board.exists()).to.be.true;
    expect(expansion.attributes('type')).eq('checkbox');
    expect(board.attributes('type')).eq('radio');
    expect(wrapper.find('label[for="consortium-checkbox"]').exists()).to.be.true;
    expect(wrapper.find('label[for="board-consortium-radio"]').exists()).to.be.true;

    await board.setValue(BoardName.CONSORTIUM);
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).board).eq(BoardName.CONSORTIUM);
    expect((wrapper.vm as any).expansions.consortium).eq(true);
  });

  it('lists Consortium maps plus all boards when the expansion is enabled', async () => {
    const wrapper = mount(CreateGameForm, {
      ...globalConfig,
    });
    (wrapper.vm as any).board = BoardName.THARSIS;
    (wrapper.vm as any).expansions.consortium = true;
    await wrapper.vm.$nextTick();

    // Overlay mode: keep the current board; do not force Massif.
    expect((wrapper.vm as any).board).eq(BoardName.THARSIS);
    expect((wrapper.vm as any).boards).to.include.members([
      BoardName.CONSORTIUM,
      BoardName.CONSORTIUM_RIFT,
      BoardName.CONSORTIUM_ARCHIPELAGO,
      BoardName.THARSIS,
      BoardName.HELLAS,
    ]);
    expect(wrapper.find('#board-consortium-radio').exists()).to.be.true;
    expect(wrapper.find('#board-rift-basin-radio').exists()).to.be.true;
    expect(wrapper.find('#board-archipelago-radio').exists()).to.be.true;
    expect(wrapper.find('#board-consortium-radio').attributes('disabled')).to.equal(undefined);
    expect(wrapper.text()).to.include('Consortium maps');
    expect(wrapper.text()).to.include('Massif');
    expect(wrapper.text()).to.include('Rift Basin');
    expect(wrapper.text()).to.include('Archipelago');
    expect(wrapper.text()).to.include('All maps (terrain overlay)');

    await wrapper.find('#board-rift-basin-radio').setValue(BoardName.CONSORTIUM_RIFT);
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).board).eq(BoardName.CONSORTIUM_RIFT);

    (wrapper.vm as any).expansions.consortium = false;
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).board).eq(BoardName.THARSIS);
    expect((wrapper.vm as any).boards).to.include(BoardName.THARSIS);
    expect((wrapper.vm as any).boards).to.not.include(BoardName.CONSORTIUM);
  });

  it('shows a map preview for every concrete board, including non-Consortium maps', async () => {
    const wrapper = mount(CreateGameForm, {
      ...globalConfig,
    });

    // Default Tharsis — preview without Consortium expansion.
    let preview = wrapper.find('[data-test="board-map-preview"]');
    expect(preview.exists()).to.be.true;
    expect(preview.find('img').attributes('src')).eq('/assets/maps/tharsis.png');
    expect(preview.text()).to.include('tharsis');

    await wrapper.find('#board-hellas-radio').setValue(BoardName.HELLAS);
    await wrapper.vm.$nextTick();
    expect(preview.find('img').attributes('src')).eq('/assets/maps/hellas.png');

    (wrapper.vm as any).expansions.consortium = true;
    await wrapper.vm.$nextTick();

    preview = wrapper.find('[data-test="board-map-preview"]');
    expect(preview.exists()).to.be.true;
    // Enabling Consortium keeps the current board; overlay blurb appears.
    expect(preview.find('img').attributes('src')).eq('/assets/maps/hellas.png');
    expect(preview.text()).to.include('overlay');

    await wrapper.find('#board-consortium-radio').setValue(BoardName.CONSORTIUM);
    await wrapper.vm.$nextTick();
    expect(preview.find('img').attributes('src')).eq('/assets/consortium/maps/massif.png');
    expect(preview.text()).to.include('Massif');
    expect(preview.text()).to.include('Balanced');

    await wrapper.find('#board-rift-basin-radio').setValue(BoardName.CONSORTIUM_RIFT);
    await wrapper.vm.$nextTick();
    expect(preview.find('img').attributes('src')).eq('/assets/consortium/maps/rift.png');
    expect(preview.text()).to.include('Rift Basin');

    await wrapper.find('#board-archipelago-radio').setValue(BoardName.CONSORTIUM_ARCHIPELAGO);
    await wrapper.vm.$nextTick();
    expect(preview.find('img').attributes('src')).eq('/assets/consortium/maps/archipelago.png');
    expect(preview.text()).to.include('Archipelago');

    // Random options hide the preview.
    (wrapper.vm as any).board = RandomBoardOption.OFFICIAL;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="board-map-preview"]').exists()).to.be.false;
  });

  it('links Consortium board info to the in-instance rulebook map anchors', async () => {
    // Upstream wiki Maps#consortium is empty / not editable from this fork.
    const wrapper = mount(CreateGameForm, {
      ...globalConfig,
    });
    (wrapper.vm as any).expansions.consortium = true;
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).boardHref(BoardName.CONSORTIUM))
      .eq('/assets/consortium/rulebook.html#massif');
    expect((wrapper.vm as any).boardHref(BoardName.CONSORTIUM_RIFT))
      .eq('/assets/consortium/rulebook.html#rift-basin');
    expect((wrapper.vm as any).boardHref(BoardName.CONSORTIUM_ARCHIPELAGO))
      .eq('/assets/consortium/rulebook.html#archipelago');
    expect((wrapper.vm as any).boardHref(BoardName.THARSIS))
      .eq('https://github.com/terraforming-mars/terraforming-mars/wiki/Maps#tharsis');
  });

  it('restores the last saved game settings on load', async () => {
    new CreateGameSettingsStorage(localStorage).saveSettings(createGameSettings({
      expansions: {...DEFAULT_EXPANSIONS, venus: true},
    }));

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).playersCount).eq(2);
    expect((wrapper.vm as any).players[0].name).eq('Alice');
    expect((wrapper.vm as any).players[1].name).eq('Bob');
    expect((wrapper.vm as any).board).eq(BoardName.HELLAS);
    expect((wrapper.vm as any).draftVariant).eq(false);
    expect((wrapper.vm as any).expansions.venus).eq(true);
    expect((wrapper.vm as any).solarPhaseOption).eq(true);
  });

  it('shows warnings when restoring saved settings', async () => {
    const alerts: Array<{title: string, message: string}> = [];
    const Root = defineComponent({
      components: {
        CreateGameForm,
      },
      template: '<CreateGameForm ref="form" />',
    });
    const wrapper = mount(Root, {
      ...globalConfig,
    });
    const form = wrapper.findComponent(CreateGameForm);
    (form.vm.$root as any).showAlert = (title: string, message: string) => {
      alerts.push({title, message});
    };

    new CreateGameSettingsStorage(localStorage).saveSettings(createGameSettings({
      customPreludes: ['Bad Prelude Name'],
    }));

    (form.vm as any).restoreLastSettings();
    await form.vm.$nextTick();

    expect(alerts).deep.eq([{
      title: 'Restore settings',
      message: "Settings loaded with these warnings: \nUnknown card name 'Bad Prelude Name' in customPreludes",
    }]);
  });

  it('resets the form and clears saved settings', async () => {
    const settingsStorage = new CreateGameSettingsStorage(localStorage);
    settingsStorage.saveSettings(createGameSettings());

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).board).eq(BoardName.HELLAS);

    (wrapper.vm as any).resetSettings();
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).board).eq(BoardName.THARSIS);
    expect((wrapper.vm as any).draftVariant).eq(true);
    expect(settingsStorage.loadSettings()).eq(undefined);
    expect(wrapper.findAllComponents({name: 'AppButton'}).map((button) => button.props('title'))).includes('Reset');
  });

  it('clears uploading when applying settings throws', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });

    expect(() => (wrapper.vm as any).applySettings(createGameSettings({
      players: [
        {name: 'Alice', color: 'red', beginner: false, handicap: 0},
        {name: 'Bob', color: 'red', beginner: false, handicap: 0},
      ],
    }))).throws('Colors are duplicated');
    expect((wrapper.vm as any).uploading).eq(false);
  });

  it('saves current settings before creating a game', async () => {
    const originalFetch = global.fetch;
    const originalAlert = global.alert;
    global.fetch = (() => Promise.reject(new Error('stop after saving'))) as typeof fetch;
    global.alert = (() => {}) as typeof alert;

    try {
      const wrapper = shallowMount(CreateGameForm, {
        ...globalConfig,
      });
      (wrapper.vm as any).playersCount = 2;
      (wrapper.vm as any).randomFirstPlayer = false;
      (wrapper.vm as any).players[0].name = 'Alice';
      (wrapper.vm as any).players[1].name = 'Bob';
      (wrapper.vm as any).board = BoardName.ELYSIUM;

      await (wrapper.vm as any).createGame();

      const savedSettings = new CreateGameSettingsStorage(localStorage).loadSettings();
      expect(savedSettings?.board).eq(BoardName.ELYSIUM);
      expect((savedSettings?.players as Array<{name: string}>).map((player) => player.name)).deep.eq(['Alice', 'Bob']);
    } finally {
      global.fetch = originalFetch;
      global.alert = originalAlert;
    }
  });
});
