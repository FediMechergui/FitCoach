/**
 * Centralized iconography (spec §8). Every icon in the app is referenced by a
 * semantic key (e.g. ICONS.strength.barbell) resolved to a {library, name}
 * pair here — so a future icon-set swap or user-selectable themes is a one-file
 * change. Libraries come from @expo/vector-icons (no extra native linking).
 */

export type IconLib =
  | 'Ionicons'
  | 'MaterialCommunityIcons'
  | 'FontAwesome5'
  | 'Feather';

export interface IconDef {
  lib: IconLib;
  name: string;
}

const def = (lib: IconLib, name: string): IconDef => ({ lib, name });

export const ICONS = {
  // §8.1 Navigation & Core
  nav: {
    home: def('Ionicons', 'home'),
    train: def('MaterialCommunityIcons', 'dumbbell'),
    nutrition: def('MaterialCommunityIcons', 'food-apple'),
    stats: def('Ionicons', 'stats-chart'),
    profile: def('Ionicons', 'person-circle'),
  },
  core: {
    start: def('Ionicons', 'play-circle'),
    end: def('Ionicons', 'stop-circle'),
    timer: def('Ionicons', 'timer-outline'),
    notifications: def('Ionicons', 'notifications-outline'),
    add: def('Ionicons', 'add-circle'),
    edit: def('Ionicons', 'create-outline'),
    delete: def('Ionicons', 'trash-outline'),
    calendar: def('Ionicons', 'calendar-outline'),
    streak: def('Ionicons', 'flame'),
    pr: def('MaterialCommunityIcons', 'trophy-award'),
    back: def('Ionicons', 'chevron-back'),
    forward: def('Ionicons', 'chevron-forward'),
    check: def('Ionicons', 'checkmark-circle'),
    close: def('Ionicons', 'close'),
    custom: def('MaterialCommunityIcons', 'shape-outline'),
    settings: def('Ionicons', 'settings-outline'),
    info: def('Ionicons', 'information-circle-outline'),
  },

  // §8.2 Strength & Calisthenics
  strength: {
    barbell: def('MaterialCommunityIcons', 'weight-lifter'),
    dumbbell: def('MaterialCommunityIcons', 'dumbbell'),
    machine: def('MaterialCommunityIcons', 'cog-outline'),
    cable: def('MaterialCommunityIcons', 'cable-data'),
    kettlebell: def('MaterialCommunityIcons', 'kettlebell'),
    band: def('MaterialCommunityIcons', 'vector-line'),
    calisthenics: def('MaterialCommunityIcons', 'human-handsup'),
    pullup: def('MaterialCommunityIcons', 'human-handsup'),
    core: def('MaterialCommunityIcons', 'ab-testing'),
    legs: def('MaterialCommunityIcons', 'yoga'),
    push: def('Ionicons', 'arrow-up-circle-outline'),
    pull: def('Ionicons', 'arrow-down-circle-outline'),
  },

  // §8.3 Cardio, Outdoor & Sports
  cardio: {
    treadmill: def('MaterialCommunityIcons', 'run'),
    running: def('MaterialCommunityIcons', 'run-fast'),
    marathon: def('MaterialCommunityIcons', 'map-marker-distance'),
    cycling: def('MaterialCommunityIcons', 'bike'),
    swimming: def('MaterialCommunityIcons', 'swim'),
    rowing: def('MaterialCommunityIcons', 'rowing'),
    elliptical: def('MaterialCommunityIcons', 'elevation-rise'),
    hiking: def('MaterialCommunityIcons', 'hiking'),
    walk: def('MaterialCommunityIcons', 'walk'),
    steps: def('MaterialCommunityIcons', 'shoe-print'),
    gps: def('Ionicons', 'map-outline'),
    pace: def('MaterialCommunityIcons', 'speedometer'),
    elevation: def('MaterialCommunityIcons', 'image-filter-hdr'),
    stairs: def('MaterialCommunityIcons', 'stairs-up'),
    jumpRope: def('MaterialCommunityIcons', 'jump-rope'),
    interval: def('MaterialCommunityIcons', 'timer-sand'),
    agility: def('MaterialCommunityIcons', 'arrow-decision'),
    plyo: def('MaterialCommunityIcons', 'arrow-expand-up'),
  },
  // Martial arts & combat sports
  martial: {
    gloves: def('MaterialCommunityIcons', 'boxing-glove'),
    strike: def('MaterialCommunityIcons', 'karate'),
    grapple: def('MaterialCommunityIcons', 'human-handsup'),
    bag: def('MaterialCommunityIcons', 'bag-personal-outline'),
    belt: def('MaterialCommunityIcons', 'medal-outline'),
    spar: def('MaterialCommunityIcons', 'sword-cross'),
    kick: def('MaterialCommunityIcons', 'karate'),
    footwork: def('MaterialCommunityIcons', 'shoe-print'),
    defense: def('MaterialCommunityIcons', 'shield-outline'),
    clinch: def('MaterialCommunityIcons', 'account-switch'),
    forms: def('MaterialCommunityIcons', 'vector-square'),
    weapon: def('MaterialCommunityIcons', 'fencing'),
  },

  sport: {
    soccer: def('MaterialCommunityIcons', 'soccer'),
    tennis: def('MaterialCommunityIcons', 'tennis'),
    padel: def('MaterialCommunityIcons', 'tennis-ball'),
    basketball: def('MaterialCommunityIcons', 'basketball'),
    volleyball: def('MaterialCommunityIcons', 'volleyball'),
    badminton: def('MaterialCommunityIcons', 'badminton'),
    handball: def('MaterialCommunityIcons', 'handball'),
    tableTennis: def('MaterialCommunityIcons', 'table-tennis'),
    skate: def('MaterialCommunityIcons', 'skate'),
    ski: def('MaterialCommunityIcons', 'ski'),
    surf: def('MaterialCommunityIcons', 'sail-boat'),
    cricket: def('MaterialCommunityIcons', 'cricket'),
    baseball: def('MaterialCommunityIcons', 'baseball-bat'),
    hockey: def('MaterialCommunityIcons', 'hockey-sticks'),
    football: def('MaterialCommunityIcons', 'football'),
    bowling: def('MaterialCommunityIcons', 'bowling'),
    archery: def('MaterialCommunityIcons', 'bow-arrow'),
    golf: def('MaterialCommunityIcons', 'golf'),
    gym: def('MaterialCommunityIcons', 'arm-flex'),
    dance: def('MaterialCommunityIcons', 'dance-ballroom'),
    horse: def('MaterialCommunityIcons', 'horse'),
    paddle: def('MaterialCommunityIcons', 'kayaking'),
    dive: def('MaterialCommunityIcons', 'diving-scuba'),
    snow: def('MaterialCommunityIcons', 'snowboard'),
    disc: def('MaterialCommunityIcons', 'disc'),
    target: def('MaterialCommunityIcons', 'target'),
    team: def('MaterialCommunityIcons', 'account-group'),
  },

  // §8.4 Mind-Body & Meditation
  mindbody: {
    yoga: def('MaterialCommunityIcons', 'yoga'),
    pilates: def('MaterialCommunityIcons', 'human'),
    stretch: def('MaterialCommunityIcons', 'human-handsdown'),
    meditation: def('MaterialCommunityIcons', 'meditation'),
    breath: def('Ionicons', 'cloud-outline'),
    moodHappy: def('Ionicons', 'happy-outline'),
    moodSad: def('Ionicons', 'sad-outline'),
    spa: def('MaterialCommunityIcons', 'spa-outline'),
    balance: def('MaterialCommunityIcons', 'scale-balance'),
    joint: def('MaterialCommunityIcons', 'sync'),
    barre: def('MaterialCommunityIcons', 'human-handsdown'),
    lungs: def('MaterialCommunityIcons', 'lungs'),
    sleep: def('MaterialCommunityIcons', 'sleep'),
    night: def('MaterialCommunityIcons', 'moon-waning-crescent'),
    gratitude: def('MaterialCommunityIcons', 'hand-heart'),
    journal: def('MaterialCommunityIcons', 'notebook-outline'),
    focus: def('MaterialCommunityIcons', 'target'),
    waves: def('MaterialCommunityIcons', 'waves'),
    candle: def('MaterialCommunityIcons', 'candle'),
    dhikr: def('MaterialCommunityIcons', 'counter'),
    recite: def('MaterialCommunityIcons', 'book-open-page-variant'),
  },

  // §8.5 Nutrition, Water & Caffeine
  nutrition: {
    breakfast: def('MaterialCommunityIcons', 'food-croissant'),
    lunch: def('MaterialCommunityIcons', 'food-drumstick-outline'),
    dinner: def('MaterialCommunityIcons', 'food-turkey'),
    snack: def('MaterialCommunityIcons', 'food-apple-outline'),
    search: def('Ionicons', 'search'),
    honest: def('MaterialCommunityIcons', 'pencil-outline'),
    honestAlt: def('Ionicons', 'chatbubble-ellipses-outline'),
    estimated: def('Ionicons', 'help-circle-outline'),
    barcode: def('Ionicons', 'barcode-outline'),
    water: def('MaterialCommunityIcons', 'cup-water'),
    coffee: def('MaterialCommunityIcons', 'coffee'),
    tea: def('MaterialCommunityIcons', 'tea'),
    energy: def('MaterialCommunityIcons', 'cup'),
    soda: def('MaterialCommunityIcons', 'bottle-soda-classic-outline'),
    caffeine: def('MaterialCommunityIcons', 'lightning-bolt-outline'),
    protein: def('MaterialCommunityIcons', 'egg-fried'),
    carbs: def('MaterialCommunityIcons', 'bread-slice'),
    fat: def('MaterialCommunityIcons', 'oil'),
    calories: def('MaterialCommunityIcons', 'fire'),
  },

  // Smoking tracker (opt-in health module)
  smoking: {
    cigarette: def('MaterialCommunityIcons', 'smoking'),
    smokeFree: def('MaterialCommunityIcons', 'smoking-off'),
    lungs: def('MaterialCommunityIcons', 'lungs'),
    heart: def('MaterialCommunityIcons', 'heart-pulse'),
    money: def('MaterialCommunityIcons', 'cash-multiple'),
    life: def('MaterialCommunityIcons', 'timer-sand'),
    trend: def('MaterialCommunityIcons', 'chart-line-variant'),
  },

  // Sleep tracker
  sleep: {
    moon: def('MaterialCommunityIcons', 'moon-waning-crescent'),
    bed: def('MaterialCommunityIcons', 'bed'),
    quality: def('MaterialCommunityIcons', 'sleep'),
    debt: def('MaterialCommunityIcons', 'alarm-snooze'),
  },

  // Alcohol tracker
  alcohol: {
    beer: def('MaterialCommunityIcons', 'beer'),
    wine: def('MaterialCommunityIcons', 'glass-wine'),
    spirit: def('MaterialCommunityIcons', 'glass-cocktail'),
    cocktail: def('MaterialCommunityIcons', 'glass-cocktail'),
    other: def('MaterialCommunityIcons', 'bottle-wine'),
    bac: def('MaterialCommunityIcons', 'gauge'),
  },

  // Menstrual cycle
  cycle: {
    flower: def('MaterialCommunityIcons', 'flower'),
    calendar: def('MaterialCommunityIcons', 'calendar-heart'),
    drop: def('MaterialCommunityIcons', 'water'),
    ovulation: def('MaterialCommunityIcons', 'egg-outline'),
    phase: def('MaterialCommunityIcons', 'moon-waxing-crescent'),
  },

  // Health conditions
  health: {
    medical: def('MaterialCommunityIcons', 'medical-bag'),
    heart: def('MaterialCommunityIcons', 'heart-pulse'),
    pill: def('MaterialCommunityIcons', 'pill'),
    clipboard: def('MaterialCommunityIcons', 'clipboard-pulse-outline'),
  },

  // Hormones (educational endocrine reference)
  hormone: {
    gland: def('MaterialCommunityIcons', 'water-percent'),
    anabolic: def('MaterialCommunityIcons', 'arm-flex'),
    metabolic: def('MaterialCommunityIcons', 'fire'),
    stress: def('MaterialCommunityIcons', 'head-cog-outline'),
    thyroid: def('MaterialCommunityIcons', 'butterfly-outline'),
    sleep: def('MaterialCommunityIcons', 'moon-waning-crescent'),
    appetite: def('MaterialCommunityIcons', 'stomach'),
    reproductive: def('MaterialCommunityIcons', 'gender-male-female'),
    up: def('MaterialCommunityIcons', 'arrow-up-bold'),
    down: def('MaterialCommunityIcons', 'arrow-down-bold'),
  },

  // Habits tracker
  habits: {
    phone: def('MaterialCommunityIcons', 'cellphone'),
    private: def('MaterialCommunityIcons', 'lock-outline'),
    snack: def('MaterialCommunityIcons', 'food-off-outline'),
    generic: def('MaterialCommunityIcons', 'chart-timeline-variant'),
    free: def('MaterialCommunityIcons', 'check-decagram'),
    time: def('MaterialCommunityIcons', 'timer-sand'),
  },

  // Self-care & hygiene
  care: {
    brush: def('MaterialCommunityIcons', 'toothbrush-paste'),
    shower: def('MaterialCommunityIcons', 'shower-head'),
    relax: def('MaterialCommunityIcons', 'spa-outline'),
    heart: def('MaterialCommunityIcons', 'hand-heart-outline'),
  },

  // Work hours
  work: {
    briefcase: def('MaterialCommunityIcons', 'briefcase-outline'),
    clock: def('MaterialCommunityIcons', 'clock-time-four-outline'),
    focus: def('MaterialCommunityIcons', 'brain'),
  },

  // Micronutrients & supplements
  micro: {
    vitamins: def('MaterialCommunityIcons', 'nutrition'),
    leaf: def('MaterialCommunityIcons', 'leaf'),
  },
  supp: {
    pill: def('MaterialCommunityIcons', 'pill'),
    mineral: def('MaterialCommunityIcons', 'diamond-stone'),
    scoop: def('MaterialCommunityIcons', 'shaker-outline'),
    oil: def('MaterialCommunityIcons', 'fish'),
    sun: def('MaterialCommunityIcons', 'white-balance-sunny'),
    bolt: def('MaterialCommunityIcons', 'lightning-bolt'),
    leaf: def('MaterialCommunityIcons', 'leaf'),
    moon: def('MaterialCommunityIcons', 'moon-waning-crescent'),
  },

  // Prayers & fasting
  faith: {
    crescent: def('MaterialCommunityIcons', 'moon-waning-crescent'),
    dawn: def('MaterialCommunityIcons', 'weather-sunset-up'),
    sunrise: def('MaterialCommunityIcons', 'weather-sunset'),
    sun: def('MaterialCommunityIcons', 'white-balance-sunny'),
    afternoon: def('MaterialCommunityIcons', 'weather-partly-cloudy'),
    sunset: def('MaterialCommunityIcons', 'weather-sunset-down'),
    night: def('MaterialCommunityIcons', 'weather-night'),
    fasting: def('MaterialCommunityIcons', 'food-off'),
    location: def('Ionicons', 'location-outline'),
  },

  // Athlete card & reports
  card: {
    trophy: def('MaterialCommunityIcons', 'card-account-details-star-outline'),
    star: def('MaterialCommunityIcons', 'star-four-points'),
    camera: def('Ionicons', 'camera-outline'),
    share: def('Ionicons', 'share-social-outline'),
    download: def('Ionicons', 'download-outline'),
  },
  report: {
    pdf: def('MaterialCommunityIcons', 'file-pdf-box'),
    nutritionist: def('MaterialCommunityIcons', 'nutrition'),
    coach: def('MaterialCommunityIcons', 'whistle'),
    doc: def('MaterialCommunityIcons', 'file-document-outline'),
  },

  // §8.6 Stats & Body
  stats: {
    weight: def('MaterialCommunityIcons', 'scale-bathroom'),
    bodyFat: def('MaterialCommunityIcons', 'human-male-height'),
    muscleMap: def('MaterialCommunityIcons', 'human'),
    volume: def('Ionicons', 'bar-chart-outline'),
    progression: def('Ionicons', 'trending-up'),
    heatmap: def('Ionicons', 'grid-outline'),
    coachTip: def('Ionicons', 'bulb-outline'),
  },
} as const;

/**
 * Resolve a dotted semantic key like 'strength.barbell' or 'nutrition.water'
 * to its IconDef. Falls back to a neutral icon if the key is unknown.
 */
export function resolveIcon(key: string): IconDef {
  const [group, name] = key.split('.');
  const g = (ICONS as Record<string, Record<string, IconDef>>)[group];
  return g?.[name] ?? ICONS.core.custom;
}

/** Icon key for a session type (used across Train/Stats). */
export function sessionTypeIcon(type: string): string {
  switch (type) {
    case 'strength':
      return 'strength.barbell';
    case 'calisthenics':
      return 'strength.calisthenics';
    case 'cardio':
      return 'cardio.treadmill';
    case 'outdoor':
      return 'cardio.running';
    case 'sport':
      return 'sport.soccer';
    case 'martial_arts':
      return 'martial.gloves';
    case 'mindbody':
      return 'mindbody.yoga';
    case 'meditation':
      return 'mindbody.meditation';
    default:
      return 'core.custom';
  }
}

/** Icon key for a meal type. */
export function mealIcon(meal: string): string {
  return `nutrition.${meal}`;
}
