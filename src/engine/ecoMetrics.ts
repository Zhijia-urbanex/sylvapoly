import {
  EcoMetrics,
  PollinatorActivity,
  Season,
  SpeciesProfile,
  TreeArchetype,
  TreeParams,
  ViewMode,
} from './types';

export function parseLaiMid(profile: SpeciesProfile): number {
  if (typeof profile.laiMid === 'number') return profile.laiMid;
  if (!profile.laiTypical) return 3.2;
  const nums = profile.laiTypical.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 3.2;
  if (nums.length === 1) return parseFloat(nums[0]);
  return (parseFloat(nums[0]) + parseFloat(nums[1])) * 0.5;
}

const SEASON_LAI_EVERGREEN = [0.95, 1.0, 0.96, 0.92];
const SEASON_LAI_DECIDUOUS = [0.84, 1.0, 0.76, 0.06];
const SEASON_LAI_SEMI = [0.9, 1.0, 0.85, 0.35];

function getSeasonalLaiMultiplier(profile: SpeciesProfile, params: TreeParams): number {
  const winterBare = Boolean(profile.palettes[Season.Winter].bareBranchWinter);
  const curve = profile.evergreen
    ? SEASON_LAI_EVERGREEN
    : winterBare
      ? SEASON_LAI_DECIDUOUS
      : SEASON_LAI_SEMI;

  if (typeof params.seasonPhase === 'number' && Number.isFinite(params.seasonPhase)) {
    const phase = ((params.seasonPhase % 4) + 4) % 4;
    const idxA = Math.floor(phase) % 4;
    const idxB = (idxA + 1) % 4;
    const frac = phase - Math.floor(phase);
    return curve[idxA] + (curve[idxB] - curve[idxA]) * frac;
  }

  switch (params.season) {
    case Season.Spring:
      return curve[0];
    case Season.Summer:
      return curve[1];
    case Season.Autumn:
      return curve[2];
    case Season.Winter:
      return curve[3];
    case Season.Custom:
    default:
      return 0.95;
  }
}

export function computeEcoMetrics(
  profile: SpeciesProfile,
  params: TreeParams,
  crownDiameterM: number,
  treeCount: number,
  mixProfiles?: SpeciesProfile[],
  crownAreaM2Override?: number
): EcoMetrics {
  const activeMix =
    params.viewMode === ViewMode.MiniForest && mixProfiles && mixProfiles.length > 0
      ? mixProfiles
      : null;

  const ageFactor = Math.min(1.18, 0.3 + 0.75 * Math.pow(Math.max(1, params.year) / 22, 0.75));
  const wholeYears = Math.max(1, Math.round(params.year));

  let activeLAI = 0;
  let annualCo2Kg = 0;
  let cumulativeCo2Kg = 0;

  if (activeMix) {
    let laiSum = 0;
    for (const sp of activeMix) {
      const baseLai = parseLaiMid(sp);
      const seasonMult = getSeasonalLaiMultiplier(sp, params);
      laiSum += baseLai * seasonMult * (0.75 + 0.25 * Math.min(1, params.year / 15));

      const baseCo2 = sp.co2KgPerYear ?? 22.0;
      const spHeightRatio = Math.max(0.35, params.heightM / Math.max(1, profile.defaultHeightM));
      annualCo2Kg += baseCo2 * Math.min(1.4, 0.5 + 0.5 * spHeightRatio) * ageFactor;

      for (let y = 1; y <= wholeYears; y++) {
        const yf = Math.min(1.18, 0.22 + 0.78 * Math.pow(y / 22, 0.82));
        cumulativeCo2Kg += baseCo2 * yf;
      }
    }
    activeLAI = Number((laiSum / activeMix.length).toFixed(2));
    annualCo2Kg = Number(annualCo2Kg.toFixed(1));
    cumulativeCo2Kg = Number(cumulativeCo2Kg.toFixed(0));
  } else {
    const baseLai = parseLaiMid(profile);
    const seasonMult = getSeasonalLaiMultiplier(profile, params);
    activeLAI = Number(
      (baseLai * seasonMult * (0.75 + 0.25 * Math.min(1, params.year / 15))).toFixed(2)
    );

    const baseCo2 = profile.co2KgPerYear ?? 22.0;
    const heightRatio = Math.max(0.25, params.heightM / Math.max(1, profile.defaultHeightM));
    const singleAnnualCo2 = baseCo2 * Math.min(1.4, 0.5 + 0.5 * heightRatio) * ageFactor;
    annualCo2Kg = Number(
      (singleAnnualCo2 * (params.viewMode === ViewMode.Grove ? treeCount : 1)).toFixed(1)
    );

    let cumulativeSingle = 0;
    for (let y = 1; y <= wholeYears; y++) {
      const yf = Math.min(1.18, 0.22 + 0.78 * Math.pow(y / 22, 0.82));
      cumulativeSingle += baseCo2 * yf;
    }
    cumulativeCo2Kg = Number(
      (cumulativeSingle * (params.viewMode === ViewMode.Grove ? treeCount : 1)).toFixed(0)
    );
  }

  // Crown projection area uses actual summed tree crown footprints when available
  const spanDivisor = treeCount > 1 ? Math.sqrt(treeCount) * 1.08 : 1;
  const singleRadius = Math.max(0.6, (crownDiameterM / spanDivisor) * 0.5);
  const singleCrownArea = Math.PI * singleRadius * singleRadius;
  const fallbackCrownArea = singleCrownArea * (treeCount > 1 ? treeCount * 0.86 : 1);
  const crownProjectionM2 = Number(
    (typeof crownAreaM2Override === 'number' && crownAreaM2Override > 0
      ? crownAreaM2Override
      : fallbackCrownArea
    ).toFixed(1)
  );
  const totalLeafSurfaceM2 = Number((crownProjectionM2 * activeLAI).toFixed(1));

  // Exact stoichiometric O2 ratio (32 / 44) matching PDF
  const annualO2Kg = Number((annualCo2Kg * (32 / 44)).toFixed(1));
  // Average passenger vehicle ~0.18 kg CO2 / km
  const drivingKmOffset = Math.round(annualCo2Kg / 0.18);

  const surfaceCoolBase =
    activeLAI >= 4.0
      ? '4.0–8.0°C'
      : activeLAI >= 3.0
        ? '3.0–6.2°C'
        : activeLAI >= 1.5
          ? '2.2–4.8°C'
          : '0.2–0.8°C';
  const airCoolBase =
    activeLAI >= 4.0
      ? '1.4–2.5°C'
      : activeLAI >= 3.0
        ? '1.0–1.9°C'
        : activeLAI >= 1.5
          ? '0.7–1.4°C'
          : '0.1–0.3°C';

  return {
    activeLAI,
    crownProjectionM2,
    totalLeafSurfaceM2,
    annualCo2Kg,
    cumulativeCo2Kg,
    annualO2Kg,
    drivingKmOffset,
    surfaceCoolC: (!activeMix && profile.surfaceCoolC) || surfaceCoolBase,
    airCoolC: (!activeMix && profile.airCoolC) || airCoolBase,
  };
}

// Botanical pollinator affinity by species ID: [springWeight, summerWeight] (0 = wind/fig-wasp, 1 = high nectar)
const POLLINATOR_AFFINITY: Record<string, [number, number]> = {
  'golden-shower-tree': [0.55, 1.0], // 阿勃勒 vibrant summer yellow racemes
  'chinaberry': [1.0, 0.55], // 苦楝 fragrant lilac spring panicles
  'cajeput-tree': [0.5, 0.95], // 白千層 nectar bottlebrush spikes
  'formosan-michelia': [0.95, 0.6], // 烏心石 fragrant spring blossoms
  'subcostate-crape-myrtle': [0.5, 1.0], // 九芎 abundant summer panicles
  'pongame-oiltree': [0.85, 0.75], // 水黃皮 fragrant pea flowers
  'camphor-tree': [0.95, 0.5], // 樟樹 swallowtail & honeybee favorite
  'taiwan-golden-rain': [0.3, 0.85], // 台灣欒樹 late summer yellow blooms
  'griffiths-ash': [0.45, 0.95], // 光蠟樹 fragrant white summer panicles
  'soapberry': [0.45, 0.85], // 無患子 summer nectar panicles
  'elaeocarpus': [0.75, 0.7], // 杜英 fringed bell flowers
  'rotund-holly': [0.85, 0.4], // 鐵冬青 spring umbels
  'red-machilus': [0.9, 0.35], // 紅楠 spring flowers
  'zuiho-machilus': [0.85, 0.4], // 香楠 fragrant spring flowers
  'formosan-gutta-percha': [0.45, 0.75], // 大葉山欖 summer blooms
  'devil-tree': [0.35, 0.55], // 黑板樹 night/early-morning nectar
  'indian-almond': [0.4, 0.45], // 欖仁
  'chinese-banyan': [0.15, 0.15], // 榕樹 (primarily fig wasps, minimal butterflies)
  'bodhi-tree': [0.15, 0.15], // 菩提樹
  'bishop-tree': [0.1, 0.1], // 茄苳 mostly wind/dioecious
  'formosan-sweet-gum': [0.0, 0.0], // 楓香 wind-pollinated
  'chinese-pistache': [0.0, 0.0], // 黃連木 wind-pollinated
  'taiwan-zelkova': [0.0, 0.0], // 臺灣櫸 wind-pollinated
  'chinese-elm': [0.0, 0.0], // 榔榆 wind-pollinated
  'chinese-tallow': [0.55, 0.8], // 烏桕 yellow-green nectar catkins loved by bees
};

function getSpeciesPollinatorScore(
  sp: SpeciesProfile,
  seasonKey: 'spring' | 'summer'
): number {
  const mapped = POLLINATOR_AFFINITY[sp.id];
  if (mapped) {
    return seasonKey === 'spring' ? mapped[0] : mapped[1];
  }
  // Procedural fallback for custom typed species
  if (sp.archetype === TreeArchetype.Conifer || sp.archetype === TreeArchetype.Palm) {
    return 0;
  }
  const q = `${sp.displayName} ${sp.biome}`.toLowerCase();
  if (/(cherry|sakura|blossom|magnolia|jacaranda|plumeria|peach|apple|plum|hibiscus|flamboyant|cassia)/.test(q)) {
    return 1.0;
  }
  const accent = sp.palettes[seasonKey === 'spring' ? Season.Spring : Season.Summer].accentClusterRatio ?? 0;
  return accent >= 0.2 ? 0.7 : 0.25;
}

export function computePollinatorActivity(
  profiles: SpeciesProfile[],
  params: TreeParams,
  activeLAI: number
): PollinatorActivity {
  if (activeLAI < 0.35) {
    return {
      active: false,
      butterflies: 0,
      bees: 0,
      reason: 'Dormant canopy',
    };
  }

  let springWeight = 0;
  let summerWeight = 0;

  if (typeof params.seasonPhase === 'number' && Number.isFinite(params.seasonPhase)) {
    const phase = ((params.seasonPhase % 4) + 4) % 4;
    if (phase <= 1.0) {
      springWeight = 1 - phase;
      summerWeight = phase;
    } else if (phase < 1.85) {
      summerWeight = Math.max(0, 1 - (phase - 1.0) / 0.85);
    }
  } else if (params.season === Season.Spring) {
    springWeight = 1;
  } else if (params.season === Season.Summer) {
    summerWeight = 1;
  }

  const seasonFactor = Math.min(1, springWeight + summerWeight);
  if (seasonFactor <= 0.05) {
    return {
      active: false,
      butterflies: 0,
      bees: 0,
      reason: 'Spring & Summer only',
    };
  }

  const list = profiles.length > 0 ? profiles : [];
  let maxScore = 0;
  let totalScore = 0;
  for (const sp of list) {
    const sSpring = getSpeciesPollinatorScore(sp, 'spring');
    const sSummer = getSpeciesPollinatorScore(sp, 'summer');
    const score = sSpring * springWeight + sSummer * summerWeight;
    maxScore = Math.max(maxScore, score);
    totalScore += score;
  }

  const avgScore = list.length > 0 ? totalScore / list.length : 0;
  const effectiveScore = Math.max(avgScore, maxScore * 0.72) * seasonFactor;

  if (effectiveScore < 0.14) {
    return {
      active: false,
      butterflies: 0,
      bees: 0,
      reason: 'Wind / fig-wasp pollinated',
    };
  }

  const multiTreeBoost = params.viewMode === ViewMode.Specimen ? 1.0 : params.viewMode === ViewMode.Grove ? 1.35 : 1.55;
  const butterflies = Math.min(10, Math.max(1, Math.round(effectiveScore * 5.2 * multiTreeBoost)));
  const bees = Math.min(14, Math.max(2, Math.round(effectiveScore * 7.8 * multiTreeBoost)));

  const seasonLabel = springWeight >= summerWeight ? 'Spring' : 'Summer';
  const reason =
    params.viewMode === ViewMode.MiniForest
      ? `${seasonLabel} mixed blooms`
      : effectiveScore >= 0.7
        ? `${seasonLabel} nectar blooms`
        : `${seasonLabel} foliage & buds`;

  return {
    active: true,
    butterflies,
    bees,
    reason,
  };
}
