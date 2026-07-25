export type Preferences = {
  learner_mode: boolean,
  enable_sounds: boolean,
  magnify_cards: boolean,
  show_alerts: boolean,
  hide_hand: boolean,
  hide_awards_and_milestones: boolean,
  show_milestone_details: boolean,
  show_award_details: boolean,
  hide_top_bar: boolean,
  small_cards: boolean,
  remove_background: boolean,
  hide_active_cards: boolean,
  hide_automated_cards: boolean,
  hide_event_cards: boolean,
  hide_tile_confirmation: boolean,
  hide_discount_on_cards: boolean,
  hide_animated_sidebar: boolean,
  debug_view: boolean,
  symbol_overlay: boolean,
  animated_title: boolean,
  experimental_ui: boolean,
  /** Display scale for the Consortium board (0.7–1.0, step 0.05). */
  consortium_board_scale: number,
  lang: string,
}

export type Preference = keyof Preferences;

/** Boolean preferences (everything except lang + numeric scale). */
export type BooleanPreference = Exclude<Preference, 'lang' | 'consortium_board_scale'>;

const defaults: Preferences = {
  learner_mode: true,
  enable_sounds: true,
  magnify_cards: true,
  show_alerts: true,
  lang: 'en',

  hide_hand: false,
  hide_awards_and_milestones: false,
  show_milestone_details: true,
  show_award_details: true,
  hide_top_bar: false,
  small_cards: false,
  remove_background: false,
  hide_active_cards: false,
  hide_automated_cards: false,
  hide_event_cards: false,
  hide_tile_confirmation: false,
  hide_discount_on_cards: false,
  hide_animated_sidebar: false,

  symbol_overlay: false,
  animated_title: true,

  experimental_ui: false,
  debug_view: false,

  consortium_board_scale: 0.85,
};

const SCALE_MIN = 0.7;
const SCALE_MAX = 1.0;
const SCALE_STEP = 0.05;

function clampConsortiumBoardScale(n: number): number {
  if (!Number.isFinite(n)) {
    return defaults.consortium_board_scale;
  }
  const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, n));
  // Snap to 0.05 steps (toFixed avoids floating-point dust like 0.7000000001).
  return Number((Math.round(clamped / SCALE_STEP) * SCALE_STEP).toFixed(2));
}

export class PreferencesManager {
  public static INSTANCE = new PreferencesManager();
  private readonly _values: Preferences;

  private localStorageSupported(): boolean {
    return typeof localStorage !== 'undefined';
  }

  public static resetForTest() {
    this.INSTANCE = new PreferencesManager();
  }

  private constructor() {
    this._values = {...defaults};
    for (const key of Object.keys(defaults) as Array<Preference>) {
      const value = this.localStorageSupported() ? localStorage.getItem(key) : undefined;
      if (value !== null && value !== undefined) {
        this._set(key, value);
      }
    }
    this.applyToDom();
  }

  private _set(key: Preference, val: string | boolean | number) {
    if (key === 'lang') {
      this._values.lang = String(val);
    } else if (key === 'consortium_board_scale') {
      const n = typeof val === 'number' ? val : Number.parseFloat(String(val));
      this._values.consortium_board_scale = clampConsortiumBoardScale(n);
    } else {
      this._values[key] = typeof(val) === 'boolean' ? val : (val === '1');
    }
  }

  // Making this Readonly means that it's Typescript-impossible to
  // set preferences through the fields themselves.
  values(): Readonly<Preferences> {
    return this._values;
  }

  set(name: Preference, val: string | boolean | number, setOnChange = false): void {
    // Don't set values if nothing has changed.
    if (setOnChange && this._values[name] === val) {
      return;
    }
    this._set(name, val);
    if (this.localStorageSupported()) {
      if (name === 'lang') {
        localStorage.setItem(name, this._values.lang);
      } else if (name === 'consortium_board_scale') {
        localStorage.setItem(name, String(this._values.consortium_board_scale));
      } else {
        localStorage.setItem(name, this._values[name] ? '1' : '0');
      }
    }
    if (name === 'consortium_board_scale') {
      this.applyToDom();
    }
  }

  /** Push CSS custom properties used by preference-driven layout. */
  applyToDom(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const target = document.getElementById('ts-preferences-target') ?? document.documentElement;
    target.style.setProperty('--consortium-board-scale', String(this._values.consortium_board_scale));
  }
}

export function getPreferences(): Readonly<Preferences> {
  return PreferencesManager.INSTANCE.values();
}
