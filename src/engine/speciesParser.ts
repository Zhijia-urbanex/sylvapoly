import { createRng, hashString, randRange } from './prng';
import { Season, SeasonalPalette, SpeciesProfile, TreeArchetype } from './types';

export const CURATED_SPECIES: SpeciesProfile[] = [
  // =========================================================================
  // PAGE 1 — TAIPEI COMMON URBAN TREES (1 - 5)
  // =========================================================================
  {
    id: 'chinese-banyan',
    displayName: 'Chinese Banyan',
    chineseName: '榕樹',
    botanicalName: 'Ficus microcarpa',
    category: 'taipei',
    biome: 'Evergreen · Broad Dome & Aerial Roots',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    hasAerialRoots: true,
    defaultHeightM: 14.0,
    maxHeightM: 25,
    crownWidthRangeM: '12–25 m',
    laiTypical: '4.0–4.8',
    co2KgPerYear: 38.5,
    trunkTaper: 0.48,
    trunkCurvature: 0.35,
    branchSpread: 1.38,
    canopyRatio: 0.65,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#63A844',
        foliageSecondary: '#86C153',
        foliageAccent: '#B57B52',
        bark: '#756354',
        snowCap: 0,
        accentClusterRatio: 0.15,
        note: 'Pale reddish-brown flush turning bright fresh green',
      },
      [Season.Summer]: {
        foliagePrimary: '#3B7D37',
        foliageSecondary: '#529647',
        foliageAccent: '#2B5E28',
        bark: '#6E5D4F',
        snowCap: 0,
        note: 'Dense deep evergreen umbrella crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#44823D',
        foliageSecondary: '#669B4A',
        foliageAccent: '#B89E44',
        bark: '#6E5D4F',
        snowCap: 0,
        accentClusterRatio: 0.12,
        note: 'Evergreen with occasional yellowing older leaves',
      },
      [Season.Winter]: {
        foliagePrimary: '#3D7638',
        foliageSecondary: '#558C48',
        foliageAccent: '#5B4652',
        bark: '#6B5B4E',
        snowCap: 0,
        note: 'Year-round dense evergreen foliage & dark figs',
      },
    },
  },
  {
    id: 'cajeput-tree',
    displayName: 'Cajeput Paperbark',
    chineseName: '白千層',
    botanicalName: 'Melaleuca cajuputi',
    category: 'taipei',
    biome: 'Evergreen · Narrow Upright Columnar',
    archetype: TreeArchetype.Poplar,
    evergreen: true,
    defaultHeightM: 12.5,
    maxHeightM: 20,
    crownWidthRangeM: '4–8 m',
    laiTypical: '2.2–2.8',
    co2KgPerYear: 18.2,
    trunkTaper: 0.36,
    trunkCurvature: 0.14,
    branchSpread: 0.72,
    canopyRatio: 0.74,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#86A382',
        foliageSecondary: '#B3C7AE',
        foliageAccent: '#698567',
        bark: '#DDD3C2',
        snowCap: 0,
        note: 'Silvery-white downy shoots shifting to grey-green',
      },
      [Season.Summer]: {
        foliagePrimary: '#6D8D6F',
        foliageSecondary: '#86A486',
        foliageAccent: '#EAE7D6',
        bark: '#D8CEBC',
        snowCap: 0,
        accentClusterRatio: 0.22,
        note: 'Leathery grey-green foliage with creamy flower spikes',
      },
      [Season.Autumn]: {
        foliagePrimary: '#678469',
        foliageSecondary: '#7F9B7F',
        foliageAccent: '#E2DFCE',
        bark: '#D5CBB8',
        snowCap: 0,
        accentClusterRatio: 0.15,
        note: 'Evergreen sparse crown with spongy peeling bark',
      },
      [Season.Winter]: {
        foliagePrimary: '#5E7A61',
        foliageSecondary: '#759177',
        foliageAccent: '#4B634E',
        bark: '#DCD3C3',
        snowCap: 0,
        note: 'Evergreen grey-green crown & pale paperbark trunk',
      },
    },
  },
  {
    id: 'bishop-tree',
    displayName: 'Bishop Tree',
    chineseName: '茄苳',
    botanicalName: 'Bischofia javanica',
    category: 'taipei',
    biome: 'Semi-Evergreen · Broad Multi-Branch Dome',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 15.0,
    maxHeightM: 25,
    crownWidthRangeM: '10–18 m',
    laiTypical: '3.5–4.2',
    co2KgPerYear: 32.0,
    trunkTaper: 0.45,
    trunkCurvature: 0.25,
    branchSpread: 1.2,
    canopyRatio: 0.64,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#76AD4E',
        foliageSecondary: '#98C764',
        foliageAccent: '#B85A42',
        bark: '#6E5645',
        snowCap: 0,
        accentClusterRatio: 0.25,
        note: 'Copper-red spring flush turning tender green',
      },
      [Season.Summer]: {
        foliagePrimary: '#407E3B',
        foliageSecondary: '#58974D',
        foliageAccent: '#2F612B',
        bark: '#685040',
        snowCap: 0,
        note: 'Deep green trifoliate dense dome',
      },
      [Season.Autumn]: {
        foliagePrimary: '#52803E',
        foliageSecondary: '#B59B3E',
        foliageAccent: '#9A3D32',
        bark: '#634C3D',
        snowCap: 0,
        accentClusterRatio: 0.24,
        note: 'Partial old leaves turning yellow or dark crimson',
      },
      [Season.Winter]: {
        foliagePrimary: '#4C763B',
        foliageSecondary: '#668F4F',
        foliageAccent: '#825F3C',
        bark: '#614A3B',
        snowCap: 0,
        sparseFoliage: false,
        note: 'Semi-evergreen canopy with brownish-green berries',
      },
    },
  },
  {
    id: 'formosan-sweet-gum',
    displayName: 'Formosan Sweet Gum',
    chineseName: '楓香',
    botanicalName: 'Liquidambar formosana',
    category: 'taipei',
    biome: 'Deciduous · Broad Ovoid & Multi-Peak',
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    defaultHeightM: 16.5,
    maxHeightM: 30,
    crownWidthRangeM: '10–20 m',
    laiTypical: '3.0–3.8',
    co2KgPerYear: 22.7,
    trunkTaper: 0.38,
    trunkCurvature: 0.2,
    branchSpread: 1.08,
    canopyRatio: 0.64,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#94C254',
        foliageSecondary: '#B3D66B',
        foliageAccent: '#D14F43',
        bark: '#726052',
        snowCap: 0,
        accentClusterRatio: 0.28,
        note: 'Early spring crimson buds shifting to yellow-green',
      },
      [Season.Summer]: {
        foliagePrimary: '#46873E',
        foliageSecondary: '#62A152',
        foliageAccent: '#34692E',
        bark: '#6C5A4D',
        snowCap: 0,
        note: 'Rich deep green summer canopy',
      },
      [Season.Autumn]: {
        foliagePrimary: '#D45A32',
        foliageSecondary: '#E89B3B',
        foliageAccent: '#AC2E27',
        bark: '#665548',
        snowCap: 0,
        note: 'Spectacular yellow, tangerine orange & crimson turn',
      },
      [Season.Winter]: {
        foliagePrimary: '#8C674E',
        foliageSecondary: '#A87D5B',
        foliageAccent: '#6E503B',
        bark: '#635347',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Winter deciduous dormancy (LAI 0–0.5)',
      },
    },
  },
  {
    id: 'chinaberry',
    displayName: 'Chinaberry',
    chineseName: '苦楝',
    botanicalName: 'Melia azedarach',
    category: 'taipei',
    biome: 'Deciduous · Broad Flat-Topped Umbrella',
    archetype: TreeArchetype.Umbrella,
    evergreen: false,
    defaultHeightM: 12.5,
    maxHeightM: 20,
    crownWidthRangeM: '8–15 m',
    laiTypical: '2.8–3.5',
    co2KgPerYear: 24.5,
    trunkTaper: 0.42,
    trunkCurvature: 0.34,
    branchSpread: 1.25,
    canopyRatio: 0.52,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#84BE5D',
        foliageSecondary: '#A3D274',
        foliageAccent: '#C08ED1',
        bark: '#695343',
        snowCap: 0,
        accentClusterRatio: 0.32,
        note: 'Tender green leaves with fragrant pale-violet blossoms',
      },
      [Season.Summer]: {
        foliagePrimary: '#4B8E42',
        foliageSecondary: '#66A858',
        foliageAccent: '#366E30',
        bark: '#644E3E',
        snowCap: 0,
        note: 'Deep green bipinnate spreading umbrella crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#DFB63A',
        foliageSecondary: '#EED05A',
        foliageAccent: '#C28D28',
        bark: '#5E4A3B',
        snowCap: 0,
        note: 'Turns luminous golden yellow with bead berries',
      },
      [Season.Winter]: {
        foliagePrimary: '#E3B93B',
        foliageSecondary: '#CFA132',
        foliageAccent: '#A67C28',
        bark: '#5C483A',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        accentClusterRatio: 0.25,
        note: 'Leafless branches retaining golden-yellow winter drupes',
      },
    },
  },

  // =========================================================================
  // PAGE 2 — TAIPEI URBAN & PARKWAY SPECIES (6 - 12)
  // =========================================================================
  {
    id: 'bodhi-tree',
    displayName: 'Bodhi Tree',
    chineseName: '菩提樹',
    botanicalName: 'Ficus religiosa',
    category: 'taipei',
    biome: 'Semi-Deciduous · Broad Sacred Dome',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 17.5,
    maxHeightM: 30,
    crownWidthRangeM: '12–20 m',
    laiTypical: '3.8–4.5',
    co2KgPerYear: 35.2,
    trunkTaper: 0.48,
    trunkCurvature: 0.26,
    branchSpread: 1.3,
    canopyRatio: 0.65,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#6EB856',
        foliageSecondary: '#90D16E',
        foliageAccent: '#E38E9B',
        bark: '#9C8D7E',
        snowCap: 0,
        accentClusterRatio: 0.28,
        note: 'Pinkish-rose spring flush turning vibrant emerald',
      },
      [Season.Summer]: {
        foliagePrimary: '#3E8442',
        foliageSecondary: '#549D52',
        foliageAccent: '#2C6330',
        bark: '#968778',
        snowCap: 0,
        note: 'Dense deep green heart-shaped canopy',
      },
      [Season.Autumn]: {
        foliagePrimary: '#4A8C47',
        foliageSecondary: '#66A358',
        foliageAccent: '#C9B048',
        bark: '#918274',
        snowCap: 0,
        accentClusterRatio: 0.14,
        note: 'Mostly evergreen with minor yellow leaf turnover',
      },
      [Season.Winter]: {
        foliagePrimary: '#498245',
        foliageSecondary: '#629958',
        foliageAccent: '#4D3D4A',
        bark: '#8D7E70',
        snowCap: 0,
        note: 'Brief leaf exchange, remaining lush & green',
      },
    },
  },
  {
    id: 'camphor-tree',
    displayName: 'Camphor Tree',
    chineseName: '樟樹',
    botanicalName: 'Cinnamomum camphora',
    category: 'taipei',
    biome: 'Evergreen · Broad Layered Crown',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 15.0,
    maxHeightM: 40,
    crownWidthRangeM: '15–16 m',
    laiTypical: '3.0–3.6',
    co2KgPerYear: 22.4,
    trunkTaper: 0.5,
    trunkCurvature: 0.32,
    branchSpread: 1.28,
    canopyRatio: 0.66,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#8EC44E',
        foliageSecondary: '#B3DA6A',
        foliageAccent: '#D9BC56',
        bark: '#5C4A3D',
        snowCap: 0,
        accentClusterRatio: 0.22,
        note: 'Fresh pale yellowish-green spring shoots',
      },
      [Season.Summer]: {
        foliagePrimary: '#4F8F40',
        foliageSecondary: '#6DA84F',
        foliageAccent: '#396E2E',
        bark: '#57463A',
        snowCap: 0,
        note: 'Broad aromatic yellow-green to deep green crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#528A42',
        foliageSecondary: '#72A24F',
        foliageAccent: '#C25F3E',
        bark: '#544337',
        snowCap: 0,
        accentClusterRatio: 0.14,
        note: 'Evergreen with sporadic crimson-orange older leaves',
      },
      [Season.Winter]: {
        foliagePrimary: '#4A7D3D',
        foliageSecondary: '#64954D',
        foliageAccent: '#332C38',
        bark: '#524136',
        snowCap: 0,
        note: 'Year-round evergreen crown with dark purple-black berries',
      },
    },
  },
  {
    id: 'taiwan-golden-rain',
    displayName: 'Taiwan Golden Rain',
    chineseName: '台灣欒樹',
    botanicalName: 'Koelreuteria elegans',
    category: 'taipei',
    biome: 'Deciduous · Four-Season Color Spectacle',
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    defaultHeightM: 11.5,
    maxHeightM: 18,
    crownWidthRangeM: '6–12 m',
    laiTypical: '3.0–3.5',
    co2KgPerYear: 20.8,
    trunkTaper: 0.4,
    trunkCurvature: 0.24,
    branchSpread: 1.08,
    canopyRatio: 0.62,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#76B84C',
        foliageSecondary: '#98CE64',
        foliageAccent: '#D15B56',
        bark: '#6E5C4E',
        snowCap: 0,
        accentClusterRatio: 0.24,
        note: 'Tender crimson-red shoots flushing bright green',
      },
      [Season.Summer]: {
        foliagePrimary: '#4E9942',
        foliageSecondary: '#68B256',
        foliageAccent: '#397830',
        bark: '#685649',
        snowCap: 0,
        note: 'Lush bright-green bipinnate canopy',
      },
      [Season.Autumn]: {
        foliagePrimary: '#E3B834',
        foliageSecondary: '#D96C7A',
        foliageAccent: '#B24B42',
        bark: '#625044',
        snowCap: 0,
        accentClusterRatio: 0.45,
        note: 'Golden-yellow blossoms followed by rose-pink lantern pods',
      },
      [Season.Winter]: {
        foliagePrimary: '#A36B52',
        foliageSecondary: '#875743',
        foliageAccent: '#69493B',
        bark: '#5E4D41',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Winter deciduous bare crown (LAI 0–0.2)',
      },
    },
  },
  {
    id: 'devil-tree',
    displayName: 'Devil Tree',
    chineseName: '黑板樹',
    botanicalName: 'Alstonia scholaris',
    category: 'taipei',
    biome: 'Evergreen · Whorled Pagoda Tiers',
    archetype: TreeArchetype.Pagoda,
    evergreen: true,
    defaultHeightM: 18.0,
    maxHeightM: 30,
    crownWidthRangeM: '6–12 m',
    laiTypical: '2.5–3.0',
    co2KgPerYear: 25.0,
    trunkTaper: 0.34,
    trunkCurvature: 0.08,
    branchSpread: 0.92,
    canopyRatio: 0.72,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#68AC4D',
        foliageSecondary: '#86C364',
        foliageAccent: '#4E8C3A',
        bark: '#8A8176',
        snowCap: 0,
        note: 'Fresh green leaves whorled at branch tips',
      },
      [Season.Summer]: {
        foliagePrimary: '#3D7E41',
        foliageSecondary: '#549654',
        foliageAccent: '#2B5E2E',
        bark: '#837A70',
        snowCap: 0,
        note: 'Deep leathery green tiered pagoda silhouette',
      },
      [Season.Autumn]: {
        foliagePrimary: '#417D44',
        foliageSecondary: '#5A9459',
        foliageAccent: '#EAE7C8',
        bark: '#7E766C',
        snowCap: 0,
        accentClusterRatio: 0.18,
        note: 'Evergreen tiers with pale yellow-white winter-autumn blooms',
      },
      [Season.Winter]: {
        foliagePrimary: '#3A723E',
        foliageSecondary: '#508951',
        foliageAccent: '#2A562D',
        bark: '#7B736A',
        snowCap: 0,
        note: 'Persistent whorled evergreen tiers',
      },
    },
  },
  {
    id: 'golden-shower-tree',
    displayName: 'Golden Shower Tree',
    chineseName: '阿勃勒',
    botanicalName: 'Cassia fistula',
    category: 'taipei',
    biome: 'Deciduous · Open Spreading Umbrella',
    archetype: TreeArchetype.Umbrella,
    evergreen: false,
    defaultHeightM: 10.0,
    maxHeightM: 15,
    crownWidthRangeM: '6–10 m',
    laiTypical: '2.5–3.2',
    co2KgPerYear: 17.5,
    trunkTaper: 0.4,
    trunkCurvature: 0.34,
    branchSpread: 1.18,
    canopyRatio: 0.56,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#7CB84B',
        foliageSecondary: '#98CE60',
        foliageAccent: '#A67A44',
        bark: '#7A6857',
        snowCap: 0,
        note: 'Copper-green early summer flush turning bright green',
      },
      [Season.Summer]: {
        foliagePrimary: '#F2C92E',
        foliageSecondary: '#589C43',
        foliageAccent: '#FAE052',
        bark: '#736151',
        snowCap: 0,
        accentClusterRatio: 0.55,
        note: 'Spectacular golden-yellow cascading flower racemes',
      },
      [Season.Autumn]: {
        foliagePrimary: '#C8A642',
        foliageSecondary: '#D9BC58',
        foliageAccent: '#9A7834',
        bark: '#6C5B4C',
        snowCap: 0,
        note: 'Yellow-brown autumn foliage with long dark seed pods',
      },
      [Season.Winter]: {
        foliagePrimary: '#634B3A',
        foliageSecondary: '#7A5E49',
        foliageAccent: '#4B392C',
        bark: '#685849',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Winter leafless open canopy (LAI 0)',
      },
    },
  },
  {
    id: 'pongame-oiltree',
    displayName: 'Pongame Oiltree',
    chineseName: '水黃皮',
    botanicalName: 'Millettia pinnata',
    category: 'taipei',
    biome: 'Semi-Evergreen · Coastal Rounded Dome',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 9.0,
    maxHeightM: 15,
    crownWidthRangeM: '6–10 m',
    laiTypical: '3.2–3.8',
    co2KgPerYear: 21.0,
    trunkTaper: 0.44,
    trunkCurvature: 0.28,
    branchSpread: 1.15,
    canopyRatio: 0.65,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#7EC054',
        foliageSecondary: '#9AD46A',
        foliageAccent: '#D99AC2',
        bark: '#786655',
        snowCap: 0,
        accentClusterRatio: 0.28,
        note: 'Tender green with purplish tint & pink-lilac blossoms',
      },
      [Season.Summer]: {
        foliagePrimary: '#3F863E',
        foliageSecondary: '#589F50',
        foliageAccent: '#2D662C',
        bark: '#716050',
        snowCap: 0,
        note: 'Glossy deep green pinnate coastal dome',
      },
      [Season.Autumn]: {
        foliagePrimary: '#4C8B44',
        foliageSecondary: '#66A358',
        foliageAccent: '#D5A7C4',
        bark: '#6B5B4C',
        snowCap: 0,
        accentClusterRatio: 0.16,
        note: 'Semi-evergreen with October blossoms & minor yellow shed',
      },
      [Season.Winter]: {
        foliagePrimary: '#467D40',
        foliageSecondary: '#5E9454',
        foliageAccent: '#8F7A4D',
        bark: '#68584A',
        snowCap: 0,
        note: 'Wind-tolerant coastal semi-evergreen canopy',
      },
    },
  },
  {
    id: 'chinese-pistache',
    displayName: 'Chinese Pistache',
    chineseName: '黃連木',
    botanicalName: 'Pistacia chinensis',
    category: 'taipei',
    biome: 'Deciduous · Multi-Stem Rounded Crown',
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    defaultHeightM: 13.5,
    maxHeightM: 25,
    crownWidthRangeM: '8–15 m',
    laiTypical: '3.0–3.6',
    co2KgPerYear: 26.8,
    trunkTaper: 0.42,
    trunkCurvature: 0.3,
    branchSpread: 1.12,
    canopyRatio: 0.62,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#77B64C',
        foliageSecondary: '#98CE64',
        foliageAccent: '#B85A42',
        bark: '#695647',
        snowCap: 0,
        accentClusterRatio: 0.25,
        note: 'Reddish-brown spring shoots opening bright green',
      },
      [Season.Summer]: {
        foliagePrimary: '#43853B',
        foliageSecondary: '#5B9E4E',
        foliageAccent: '#30662A',
        bark: '#635042',
        snowCap: 0,
        note: 'Deep green pinnate multi-stem canopy',
      },
      [Season.Autumn]: {
        foliagePrimary: '#D9502E',
        foliageSecondary: '#EB7D3B',
        foliageAccent: '#A62724',
        bark: '#5E4B3E',
        snowCap: 0,
        note: 'Brilliant tangerine-orange & deep crimson autumn foliage',
      },
      [Season.Winter]: {
        foliagePrimary: '#7C5D49',
        foliageSecondary: '#947058',
        foliageAccent: '#5C4537',
        bark: '#5A483B',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Winter leafless open branching (LAI 0)',
      },
    },
  },

  // =========================================================================
  // PAGE 3 — SUPERIOR SHADE TREES / 優良遮蔭 (13 - 19)
  // =========================================================================
  {
    id: 'indian-almond',
    displayName: 'Indian Almond',
    chineseName: '欖仁',
    botanicalName: 'Terminalia catappa',
    category: 'shade',
    biome: 'Deciduous · Horizontal Whorled Pagoda',
    archetype: TreeArchetype.Pagoda,
    evergreen: false,
    defaultHeightM: 15.0,
    maxHeightM: 25,
    crownWidthRangeM: '10–18 m',
    laiTypical: '3.5–4.0',
    co2KgPerYear: 30.5,
    trunkTaper: 0.4,
    trunkCurvature: 0.1,
    branchSpread: 1.28,
    canopyRatio: 0.68,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#76BA4D',
        foliageSecondary: '#96D064',
        foliageAccent: '#599B38',
        bark: '#6B594B',
        snowCap: 0,
        note: 'Tender spring green horizontal branch whorls',
      },
      [Season.Summer]: {
        foliagePrimary: '#3D7E38',
        foliageSecondary: '#53964A',
        foliageAccent: '#2C6128',
        bark: '#655447',
        snowCap: 0,
        note: 'Broad deep-green layered pagoda shade shelves',
      },
      [Season.Autumn]: {
        foliagePrimary: '#D1422C',
        foliageSecondary: '#E87E35',
        foliageAccent: '#EBC242',
        bark: '#5E4E42',
        snowCap: 0,
        note: 'Dramatic scarlet, tangerine & golden-yellow before drop',
      },
      [Season.Winter]: {
        foliagePrimary: '#7C5D49',
        foliageSecondary: '#947058',
        foliageAccent: '#5C4537',
        bark: '#5B4B40',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Architectural bare horizontal tier limbs (LAI 0)',
      },
    },
  },
  {
    id: 'taiwan-zelkova',
    displayName: 'Taiwan Zelkova',
    chineseName: '臺灣櫸',
    botanicalName: 'Zelkova serrata',
    category: 'shade',
    biome: 'Deciduous · Vase & Broad Umbrella',
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    defaultHeightM: 14.5,
    maxHeightM: 30,
    crownWidthRangeM: '6–12 m',
    laiTypical: '3.0–3.5',
    co2KgPerYear: 46.0,
    trunkTaper: 0.42,
    trunkCurvature: 0.25,
    branchSpread: 1.15,
    canopyRatio: 0.64,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#86BF54',
        foliageSecondary: '#A5D46B',
        foliageAccent: '#C96852',
        bark: '#7B6756',
        snowCap: 0,
        accentClusterRatio: 0.2,
        note: 'Reddish-tinted young shoots unfurling tender green',
      },
      [Season.Summer]: {
        foliagePrimary: '#639C44',
        foliageSecondary: '#7FB559',
        foliageAccent: '#497D32',
        bark: '#736050',
        snowCap: 0,
        note: 'Airy vase-shaped yellow-green summer shade crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#D47B38',
        foliageSecondary: '#E3B444',
        foliageAccent: '#A4482D',
        bark: '#6C5A4B',
        snowCap: 0,
        note: 'Warm yellow, orange-red & russet autumn turn',
      },
      [Season.Winter]: {
        foliagePrimary: '#7A6352',
        foliageSecondary: '#947A66',
        foliageAccent: '#5E4B3E',
        bark: '#685749',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Graceful leafless winter vase silhouette (LAI 0)',
      },
    },
  },
  {
    id: 'formosan-michelia',
    displayName: 'Formosan Michelia',
    chineseName: '烏心石',
    botanicalName: 'Magnolia compressa',
    category: 'shade',
    biome: 'Evergreen · Upright Columnar Ovoid',
    archetype: TreeArchetype.Poplar,
    evergreen: true,
    defaultHeightM: 15.0,
    maxHeightM: 25,
    crownWidthRangeM: '6–12 m',
    laiTypical: '3.5–4.2',
    co2KgPerYear: 28.5,
    trunkTaper: 0.34,
    trunkCurvature: 0.1,
    branchSpread: 0.85,
    canopyRatio: 0.72,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#6EB24E',
        foliageSecondary: '#8DC966',
        foliageAccent: '#F7F5EB',
        bark: '#6A5B4E',
        snowCap: 0,
        accentClusterRatio: 0.24,
        note: 'Pale green foliage accented with fragrant white blossoms',
      },
      [Season.Summer]: {
        foliagePrimary: '#356E37',
        foliageSecondary: '#4B874A',
        foliageAccent: '#255227',
        bark: '#64564A',
        snowCap: 0,
        note: 'Dense glossy deep-green upright crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#3B723C',
        foliageSecondary: '#528A50',
        foliageAccent: '#9A4838',
        bark: '#5F5145',
        snowCap: 0,
        accentClusterRatio: 0.14,
        note: 'Evergreen foliage with reddish-brown autumn follicles',
      },
      [Season.Winter]: {
        foliagePrimary: '#346936',
        foliageSecondary: '#498048',
        foliageAccent: '#265028',
        bark: '#5C4E43',
        snowCap: 0,
        note: 'Dense evergreen shade column',
      },
    },
  },
  {
    id: 'griffiths-ash',
    displayName: "Griffith's Ash",
    chineseName: '光蠟樹',
    botanicalName: 'Fraxinus griffithii',
    category: 'shade',
    biome: 'Semi-Evergreen · Upright Ovoid Feather',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 13.5,
    maxHeightM: 22,
    crownWidthRangeM: '6–12 m',
    laiTypical: '2.8–3.4',
    co2KgPerYear: 23.0,
    trunkTaper: 0.38,
    trunkCurvature: 0.18,
    branchSpread: 0.96,
    canopyRatio: 0.64,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#8EC250',
        foliageSecondary: '#ACD76B',
        foliageAccent: '#F2F2E6',
        bark: '#7B7368',
        snowCap: 0,
        accentClusterRatio: 0.2,
        note: 'Yellow-green spring leaves with white panicle blooms',
      },
      [Season.Summer]: {
        foliagePrimary: '#4C9345',
        foliageSecondary: '#66AC5B',
        foliageAccent: '#387232',
        bark: '#746C61',
        snowCap: 0,
        note: 'Emerald-green airy pinnate crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#639448',
        foliageSecondary: '#D4B948',
        foliageAccent: '#8C6E42',
        bark: '#6E665C',
        snowCap: 0,
        accentClusterRatio: 0.22,
        note: 'Semi-evergreen yellowing with purplish-brown winged seeds',
      },
      [Season.Winter]: {
        foliagePrimary: '#5B8746',
        foliageSecondary: '#869F56',
        foliageAccent: '#705D46',
        bark: '#6B6359',
        snowCap: 0,
        note: 'Partial winter foliage retention',
      },
    },
  },
  {
    id: 'chinese-elm',
    displayName: 'Chinese Elm',
    chineseName: '榔榆',
    botanicalName: 'Ulmus parvifolia',
    category: 'shade',
    biome: 'Semi-Deciduous · Fine-Twig Umbrella',
    archetype: TreeArchetype.Weeping,
    evergreen: false,
    defaultHeightM: 11.5,
    maxHeightM: 20,
    crownWidthRangeM: '8–14 m',
    laiTypical: '3.0–3.6',
    co2KgPerYear: 25.2,
    trunkTaper: 0.44,
    trunkCurvature: 0.34,
    branchSpread: 1.2,
    canopyRatio: 0.65,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#78BA52',
        foliageSecondary: '#98D16A',
        foliageAccent: '#58973A',
        bark: '#7D6A58',
        snowCap: 0,
        note: 'Tender green spring foliage on fine arching twigs',
      },
      [Season.Summer]: {
        foliagePrimary: '#3E7E3B',
        foliageSecondary: '#56974F',
        foliageAccent: '#2D5E2B',
        bark: '#756352',
        snowCap: 0,
        note: 'Small leathery dark-green cascading crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#CCA13D',
        foliageSecondary: '#A85639',
        foliageAccent: '#E0C05A',
        bark: '#6E5C4C',
        snowCap: 0,
        note: 'Turns golden yellow or reddish-brown before shedding',
      },
      [Season.Winter]: {
        foliagePrimary: '#756350',
        foliageSecondary: '#8F7B64',
        foliageAccent: '#594A3B',
        bark: '#6A594A',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Semi-deciduous winter fine-twigged crown (LAI 0–0.5)',
      },
    },
  },
  {
    id: 'zuiho-machilus',
    displayName: 'Zuiho Machilus',
    chineseName: '香楠',
    botanicalName: 'Machilus zuihoensis',
    category: 'shade',
    biome: 'Evergreen · Dense Globose Dome',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 13.5,
    maxHeightM: 22,
    crownWidthRangeM: '6–12 m',
    laiTypical: '3.8–4.3',
    co2KgPerYear: 29.0,
    trunkTaper: 0.42,
    trunkCurvature: 0.2,
    branchSpread: 1.05,
    canopyRatio: 0.66,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#5D9E4A',
        foliageSecondary: '#7AB860',
        foliageAccent: '#D97592',
        bark: '#6B594B',
        snowCap: 0,
        accentClusterRatio: 0.25,
        note: 'Pink to purplish-red bud scales unfurling green',
      },
      [Season.Summer]: {
        foliagePrimary: '#367438',
        foliageSecondary: '#4B8E4B',
        foliageAccent: '#255627',
        bark: '#655447',
        snowCap: 0,
        note: 'Dense deep-green leathery foliage dome',
      },
      [Season.Autumn]: {
        foliagePrimary: '#3A743B',
        foliageSecondary: '#508D4F',
        foliageAccent: '#29572B',
        bark: '#615044',
        snowCap: 0,
        note: 'Year-round dense evergreen canopy',
      },
      [Season.Winter]: {
        foliagePrimary: '#356B36',
        foliageSecondary: '#4A8249',
        foliageAccent: '#275229',
        bark: '#5E4D42',
        snowCap: 0,
        note: 'Lush winter evergreen shelter',
      },
    },
  },
  {
    id: 'formosan-gutta-percha',
    displayName: 'Formosan Gutta-percha',
    chineseName: '大葉山欖',
    botanicalName: 'Palaquium formosanum',
    category: 'shade',
    biome: 'Evergreen · Coastal Thick-Leaf Dome',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 13.5,
    maxHeightM: 20,
    crownWidthRangeM: '8–14 m',
    laiTypical: '4.0–4.5',
    co2KgPerYear: 31.5,
    trunkTaper: 0.46,
    trunkCurvature: 0.22,
    branchSpread: 1.18,
    canopyRatio: 0.66,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#4FA34B',
        foliageSecondary: '#6CBE62',
        foliageAccent: '#D6AE48',
        bark: '#665648',
        snowCap: 0,
        accentClusterRatio: 0.2,
        note: 'Golden-downy buds opening to emerald leathery leaves',
      },
      [Season.Summer]: {
        foliagePrimary: '#2F7035',
        foliageSecondary: '#458A48',
        foliageAccent: '#215426',
        bark: '#605043',
        snowCap: 0,
        note: 'Glossy dark-green wind-resistant dome',
      },
      [Season.Autumn]: {
        foliagePrimary: '#337238',
        foliageSecondary: '#488B4B',
        foliageAccent: '#245428',
        bark: '#5C4D40',
        snowCap: 0,
        note: 'Salt- & wind-tolerant evergreen thick foliage',
      },
      [Season.Winter]: {
        foliagePrimary: '#2E6A34',
        foliageSecondary: '#428045',
        foliageAccent: '#204E24',
        bark: '#594A3E',
        snowCap: 0,
        note: 'Dense year-round coastal evergreen canopy',
      },
    },
  },

  // =========================================================================
  // PAGE 4 — SUPPLEMENTARY SPECIES / 補充樹種 (20 - 25)
  // =========================================================================
  {
    id: 'soapberry',
    displayName: 'Soapberry',
    chineseName: '無患子',
    botanicalName: 'Sapindus mukorossi',
    category: 'supplementary',
    biome: 'Deciduous · Rounded Golden Autumn Crown',
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    defaultHeightM: 12.5,
    maxHeightM: 20,
    crownWidthRangeM: '8–14 m',
    laiTypical: '2.8–3.5',
    co2KgPerYear: 22.0,
    trunkTaper: 0.42,
    trunkCurvature: 0.24,
    branchSpread: 1.15,
    canopyRatio: 0.64,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#7EC152',
        foliageSecondary: '#9CD669',
        foliageAccent: '#5FA13B',
        bark: '#756353',
        snowCap: 0,
        note: 'Tender green spring flush',
      },
      [Season.Summer]: {
        foliagePrimary: '#4A9644',
        foliageSecondary: '#65AF5A',
        foliageAccent: '#367532',
        bark: '#6E5D4E',
        snowCap: 0,
        note: 'Bright emerald pinnate shade dome',
      },
      [Season.Autumn]: {
        foliagePrimary: '#EEC32D',
        foliageSecondary: '#F6DA52',
        foliageAccent: '#D19A1F',
        bark: '#685749',
        snowCap: 0,
        note: 'Luminous golden-yellow autumn canopy & amber fruits',
      },
      [Season.Winter]: {
        foliagePrimary: '#6F5B4A',
        foliageSecondary: '#856E5B',
        foliageAccent: '#544437',
        bark: '#645446',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Winter deciduous bare crown (LAI 0)',
      },
    },
  },
  {
    id: 'red-machilus',
    displayName: 'Red Machilus',
    chineseName: '紅楠',
    botanicalName: 'Machilus thunbergii',
    category: 'supplementary',
    biome: 'Evergreen · Crimson Bud Flush',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 13.5,
    maxHeightM: 20,
    crownWidthRangeM: '6–12 m',
    laiTypical: '3.8–4.4',
    co2KgPerYear: 29.5,
    trunkTaper: 0.42,
    trunkCurvature: 0.22,
    branchSpread: 1.05,
    canopyRatio: 0.66,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#4B8E46',
        foliageSecondary: '#6AA85E',
        foliageAccent: '#D6454B',
        bark: '#6B5749',
        snowCap: 0,
        accentClusterRatio: 0.36,
        note: 'Iconic vivid scarlet & crimson-purple spring bud scales',
      },
      [Season.Summer]: {
        foliagePrimary: '#356E39',
        foliageSecondary: '#4B884B',
        foliageAccent: '#255229',
        bark: '#655245',
        snowCap: 0,
        note: 'Deep glossy leathery green evergreen crown',
      },
      [Season.Autumn]: {
        foliagePrimary: '#3A723D',
        foliageSecondary: '#508B4F',
        foliageAccent: '#4D2B3D',
        bark: '#604D41',
        snowCap: 0,
        note: 'Dense evergreen canopy with dark purple berries',
      },
      [Season.Winter]: {
        foliagePrimary: '#386D3B',
        foliageSecondary: '#4D844C',
        foliageAccent: '#B8424A',
        bark: '#5C4A3E',
        snowCap: 0,
        accentClusterRatio: 0.2,
        note: 'Evergreen foliage with late-winter rosy buds',
      },
    },
  },
  {
    id: 'chinese-tallow',
    displayName: 'Chinese Tallow Tree',
    chineseName: '烏桕',
    botanicalName: 'Triadica sebifera',
    category: 'supplementary',
    biome: 'Deciduous · Irregular Fiery Autumn',
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    defaultHeightM: 11.5,
    maxHeightM: 18,
    crownWidthRangeM: '6–12 m',
    laiTypical: '2.8–3.3',
    co2KgPerYear: 21.8,
    trunkTaper: 0.42,
    trunkCurvature: 0.36,
    branchSpread: 1.15,
    canopyRatio: 0.62,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#8EC954',
        foliageSecondary: '#ABD96E',
        foliageAccent: '#6FA93D',
        bark: '#6F5F51',
        snowCap: 0,
        note: 'Fresh pale yellow-green spring foliage',
      },
      [Season.Summer]: {
        foliagePrimary: '#478A3E',
        foliageSecondary: '#61A352',
        foliageAccent: '#34692D',
        bark: '#69594C',
        snowCap: 0,
        note: 'Deep green diamond-shaped leaves',
      },
      [Season.Autumn]: {
        foliagePrimary: '#D94B2B',
        foliageSecondary: '#EF7D32',
        foliageAccent: '#A62229',
        bark: '#635347',
        snowCap: 0,
        note: 'Fiery vivid tangerine-red & deep crimson autumn spectacle',
      },
      [Season.Winter]: {
        foliagePrimary: '#EAECE6',
        foliageSecondary: '#D8DCD4',
        foliageAccent: '#69594C',
        bark: '#5E4F44',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        accentClusterRatio: 0.16,
        note: 'Leafless winter branches with white waxy seeds (LAI 0)',
      },
    },
  },
  {
    id: 'subcostate-crape-myrtle',
    displayName: 'Crape Myrtle',
    chineseName: '九芎',
    botanicalName: 'Lagerstroemia subcostata',
    category: 'supplementary',
    biome: 'Deciduous · Multi-Stem Smooth Pale Bark',
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    defaultHeightM: 9.0,
    maxHeightM: 15,
    crownWidthRangeM: '5–10 m',
    laiTypical: '2.5–3.2',
    co2KgPerYear: 19.5,
    trunkTaper: 0.4,
    trunkCurvature: 0.48,
    branchSpread: 1.18,
    canopyRatio: 0.6,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#7CBF50',
        foliageSecondary: '#9CD56A',
        foliageAccent: '#5E9E39',
        bark: '#C9B8A3',
        snowCap: 0,
        note: 'Tender green leaves on smooth sinuous pale-tan trunks',
      },
      [Season.Summer]: {
        foliagePrimary: '#4B9747',
        foliageSecondary: '#65B05D',
        foliageAccent: '#F5F4EE',
        bark: '#C4B29D',
        snowCap: 0,
        accentClusterRatio: 0.28,
        note: 'Emerald green canopy dotted with ruffled white summer blooms',
      },
      [Season.Autumn]: {
        foliagePrimary: '#D96D34',
        foliageSecondary: '#C89B45',
        foliageAccent: '#A8482B',
        bark: '#BCA994',
        snowCap: 0,
        note: 'Orange-red & warm ochre foliage before winter drop',
      },
      [Season.Winter]: {
        foliagePrimary: '#8C7A68',
        foliageSecondary: '#A38F7A',
        foliageAccent: '#6B5C4D',
        bark: '#CEBFA9',
        snowCap: 0,
        sparseFoliage: true,
        bareBranchWinter: true,
        note: 'Sculptural bare branches & smooth peeling pale bark (LAI 0)',
      },
    },
  },
  {
    id: 'rotund-holly',
    displayName: 'Rotund Holly',
    chineseName: '鐵冬青',
    botanicalName: 'Ilex rotunda',
    category: 'supplementary',
    biome: 'Evergreen · Glossy Dome & Scarlet Berries',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 11.5,
    maxHeightM: 18,
    crownWidthRangeM: '5–10 m',
    laiTypical: '3.5–4.1',
    co2KgPerYear: 24.0,
    trunkTaper: 0.4,
    trunkCurvature: 0.2,
    branchSpread: 0.98,
    canopyRatio: 0.64,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#76B552',
        foliageSecondary: '#94CC6A',
        foliageAccent: '#EAD4DF',
        bark: '#7B746B',
        snowCap: 0,
        accentClusterRatio: 0.16,
        note: 'Pale green spring leaves with pale lilac-white flowers',
      },
      [Season.Summer]: {
        foliagePrimary: '#36753B',
        foliageSecondary: '#4B8E4E',
        foliageAccent: '#25562A',
        bark: '#756E65',
        snowCap: 0,
        note: 'Dense smooth glossy dark-green rounded dome',
      },
      [Season.Autumn]: {
        foliagePrimary: '#39763E',
        foliageSecondary: '#4F8F51',
        foliageAccent: '#D9342B',
        bark: '#706960',
        snowCap: 0,
        accentClusterRatio: 0.34,
        note: 'Evergreen dark green contrasting with bright scarlet berries',
      },
      [Season.Winter]: {
        foliagePrimary: '#336B37',
        foliageSecondary: '#48824A',
        foliageAccent: '#E03228',
        bark: '#6D665D',
        snowCap: 0,
        accentClusterRatio: 0.38,
        note: 'Abundant winter crimson holly berries against dark foliage',
      },
    },
  },
  {
    id: 'elaeocarpus',
    displayName: 'Elaeocarpus',
    chineseName: '杜英',
    botanicalName: 'Elaeocarpus decipiens',
    category: 'supplementary',
    biome: 'Evergreen · Layered Crown & Crimson Leaves',
    archetype: TreeArchetype.Broadleaf,
    evergreen: true,
    defaultHeightM: 13.5,
    maxHeightM: 25,
    crownWidthRangeM: '6–12 m',
    laiTypical: '3.2–3.8',
    co2KgPerYear: 26.0,
    trunkTaper: 0.4,
    trunkCurvature: 0.22,
    branchSpread: 1.05,
    canopyRatio: 0.66,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: '#6CB24D',
        foliageSecondary: '#8ACA64',
        foliageAccent: '#CF3E36',
        bark: '#6E5D4F',
        snowCap: 0,
        accentClusterRatio: 0.24,
        note: 'Tender green flush accompanied by bright-red aging leaves',
      },
      [Season.Summer]: {
        foliagePrimary: '#3B7D3C',
        foliageSecondary: '#51964E',
        foliageAccent: '#F2F0E6',
        bark: '#68574A',
        snowCap: 0,
        accentClusterRatio: 0.18,
        note: 'Rich deep green crown with fragrant white fringed blooms',
      },
      [Season.Autumn]: {
        foliagePrimary: '#3E7A3E',
        foliageSecondary: '#549250',
        foliageAccent: '#D63B32',
        bark: '#635346',
        snowCap: 0,
        accentClusterRatio: 0.3,
        note: 'Evergreen canopy punctuated by vivid scarlet senescent leaves',
      },
      [Season.Winter]: {
        foliagePrimary: '#387039',
        foliageSecondary: '#4D864B',
        foliageAccent: '#CC3830',
        bark: '#605044',
        snowCap: 0,
        accentClusterRatio: 0.26,
        note: 'Evergreen layered crown with scattered crimson winter leaves',
      },
    },
  },
];

interface KeywordRule {
  keywords: string[];
  archetype: TreeArchetype;
  evergreen: boolean;
  biome: string;
  defaultHeightM: number;
  branchSpread: number;
  trunkCurvature: number;
  autumnHue?: 'crimson' | 'gold' | 'amber' | 'evergreen';
  springBlossom?: string;
  barkOverride?: string;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['pine', 'spruce', 'fir', 'cedar', 'larch', 'hemlock', 'redwood', 'sequoia', 'juniper', 'conifer', 'evergreen', 'yew', '松', '杉', '柏'],
    archetype: TreeArchetype.Conifer,
    evergreen: true,
    biome: 'Boreal & Alpine Conifer',
    defaultHeightM: 11.0,
    branchSpread: 0.88,
    trunkCurvature: 0.08,
    autumnHue: 'evergreen',
  },
  {
    keywords: ['palm', 'coconut', 'date', 'palmetto', 'tropical', 'banana', 'cycad', '椰', '棕櫚'],
    archetype: TreeArchetype.Palm,
    evergreen: true,
    biome: 'Tropical Coastal',
    defaultHeightM: 9.0,
    branchSpread: 1.25,
    trunkCurvature: 0.65,
    autumnHue: 'evergreen',
  },
  {
    keywords: ['acacia', 'savanna', 'baobab', 'umbrella', 'mimosa', 'mesquite', 'dragon', '相思', '鳳凰木'],
    archetype: TreeArchetype.Umbrella,
    evergreen: true,
    biome: 'Arid & Subtropical Umbrella',
    defaultHeightM: 9.5,
    branchSpread: 1.4,
    trunkCurvature: 0.4,
    autumnHue: 'amber',
  },
  {
    keywords: ['pagoda', 'tiered', 'almond', 'terminalia', 'alstonia'],
    archetype: TreeArchetype.Pagoda,
    evergreen: false,
    biome: 'Whorled Layered Shade',
    defaultHeightM: 14.0,
    branchSpread: 1.2,
    trunkCurvature: 0.1,
    autumnHue: 'crimson',
  },
  {
    keywords: ['poplar', 'cypress', 'aspen', 'bamboo', 'italian', 'columnar', '白楊'],
    archetype: TreeArchetype.Poplar,
    evergreen: false,
    biome: 'Columnar & Riparian',
    defaultHeightM: 12.0,
    branchSpread: 0.68,
    trunkCurvature: 0.12,
    autumnHue: 'gold',
  },
  {
    keywords: ['willow', 'weeping', 'mangrove', '柳'],
    archetype: TreeArchetype.Weeping,
    evergreen: false,
    biome: 'Riverbank Wetland',
    defaultHeightM: 9.0,
    branchSpread: 1.3,
    trunkCurvature: 0.35,
    autumnHue: 'gold',
  },
  {
    keywords: ['cherry', 'sakura', 'plum', 'peach', 'apple', 'magnolia', 'dogwood', 'blossom', 'jacaranda', '櫻'],
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    biome: 'Flowering Temperate',
    defaultHeightM: 7.5,
    branchSpread: 1.15,
    trunkCurvature: 0.4,
    autumnHue: 'amber',
    springBlossom: '#F2A2B4',
  },
  {
    keywords: ['maple', 'sumac', 'sweetgum', 'rowan', '楓'],
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    biome: 'Temperate Deciduous',
    defaultHeightM: 10.0,
    branchSpread: 1.1,
    trunkCurvature: 0.25,
    autumnHue: 'crimson',
  },
  {
    keywords: ['birch', 'beech', 'sycamore', '樺'],
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    biome: 'Northern Woodland',
    defaultHeightM: 10.0,
    branchSpread: 0.92,
    trunkCurvature: 0.3,
    autumnHue: 'gold',
    barkOverride: '#E4E1DA',
  },
  {
    keywords: ['oak', 'elm', 'chestnut', 'walnut', 'hickory', 'olive', 'bonsai', 'ash', 'linden', 'ginkgo', '櫟', '銀杏'],
    archetype: TreeArchetype.Broadleaf,
    evergreen: false,
    biome: 'Temperate Woodland',
    defaultHeightM: 11.0,
    branchSpread: 1.2,
    trunkCurvature: 0.3,
    autumnHue: 'amber',
  },
];

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Resolves any user-entered species string (English, Chinese, or Scientific name)
 * into a complete botanical profile with seasonal palettes and morphology.
 */
export function resolveSpecies(query: string): SpeciesProfile {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return CURATED_SPECIES[0];
  }

  // Exact match on English, Chinese, ID, or scientific name
  const exact = CURATED_SPECIES.find(
    (s) =>
      s.displayName.toLowerCase() === clean ||
      s.chineseName?.toLowerCase() === clean ||
      s.id === clean ||
      s.botanicalName.toLowerCase() === clean
  );
  if (exact) return exact;

  // Partial substring match across English, Chinese, and Latin names
  const partial = CURATED_SPECIES.find(
    (s) =>
      (s.chineseName && (clean.includes(s.chineseName) || s.chineseName.includes(clean))) ||
      (clean.length >= 3 &&
        (s.displayName.toLowerCase().includes(clean) ||
          clean.includes(s.displayName.toLowerCase()) ||
          s.botanicalName.toLowerCase().includes(clean)))
  );
  if (partial) {
    return partial;
  }

  // Deterministic procedural species synthesis from botanical keywords + hash
  const seed = hashString(clean);
  const rng = createRng(seed);

  let matchedRule: KeywordRule | null = null;
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => clean.includes(kw))) {
      matchedRule = rule;
      break;
    }
  }

  const hasBlueTint = /\b(blue|silver|frost|ice|glacier)\b/.test(clean);
  const hasRedTint = /\b(red|crimson|scarlet|ruby|blood|autumn|fire)\b/.test(clean);
  const hasGoldTint = /\b(gold|golden|yellow|sun|amber)\b/.test(clean);
  const hasPurpleTint = /\b(purple|plum|jacaranda|lavender|violet|cherry|sakura|pink)\b/.test(clean);
  const isDwarf = /\b(bonsai|dwarf|mini|shrub|sapling)\b/.test(clean);
  const isGiant = /\b(giant|ancient|redwood|sequoia|elder|great)\b/.test(clean);

  const archetypes = [
    TreeArchetype.Broadleaf,
    TreeArchetype.Conifer,
    TreeArchetype.Umbrella,
    TreeArchetype.Poplar,
    TreeArchetype.Pagoda,
  ];
  const archetype = matchedRule
    ? matchedRule.archetype
    : archetypes[Math.floor(rng() * 4)];

  const evergreen = matchedRule
    ? matchedRule.evergreen
    : archetype === TreeArchetype.Conifer || archetype === TreeArchetype.Palm;

  let baseHeight = matchedRule ? matchedRule.defaultHeightM : randRange(rng, 7.0, 12.5);
  if (isDwarf) baseHeight *= 0.45;
  if (isGiant) baseHeight *= 1.45;

  const greenHue = hasBlueTint
    ? randRange(rng, 155, 175)
    : randRange(rng, 92, 128);
  const barkHex = matchedRule?.barkOverride
    ? matchedRule.barkOverride
    : /\b(white|silver|ghost|ash)\b/.test(clean)
      ? '#DEDAD2'
      : hslToHex(randRange(rng, 22, 34), randRange(rng, 24, 38), randRange(rng, 32, 44));

  const springPrimary = hasPurpleTint
    ? '#EE9BB0'
    : matchedRule?.springBlossom ?? hslToHex(greenHue - 10, randRange(rng, 48, 62), randRange(rng, 52, 62));

  const summerPrimary = hasRedTint
    ? '#A63A32'
    : hasGoldTint
      ? '#B4BA38'
      : hslToHex(greenHue, randRange(rng, 40, 56), randRange(rng, 38, 48));

  const autumnHueChoice = matchedRule?.autumnHue ?? (rng() > 0.5 ? 'amber' : 'crimson');
  const autumnPrimary =
    autumnHueChoice === 'evergreen'
      ? hslToHex(greenHue + 4, 38, 36)
      : autumnHueChoice === 'crimson' || hasRedTint
        ? hslToHex(randRange(rng, 8, 18), 64, 48)
        : autumnHueChoice === 'gold' || hasGoldTint
          ? hslToHex(randRange(rng, 42, 50), 78, 54)
          : hslToHex(randRange(rng, 22, 34), 66, 48);

  const winterPrimary = evergreen ? '#E2EEF2' : '#DDE6EA';

  return {
    id: `custom-${seed.toString(16)}`,
    displayName: titleCase(query),
    botanicalName: `Procedural ${archetype} morphology`,
    category: 'taipei',
    biome: matchedRule ? matchedRule.biome : 'Custom Botanical Variant',
    archetype,
    evergreen,
    defaultHeightM: Number(baseHeight.toFixed(1)),
    trunkTaper: randRange(rng, 0.34, 0.48),
    trunkCurvature: matchedRule ? matchedRule.trunkCurvature : randRange(rng, 0.15, 0.42),
    branchSpread: matchedRule ? matchedRule.branchSpread : randRange(rng, 0.85, 1.25),
    canopyRatio: archetype === TreeArchetype.Palm ? 0.3 : archetype === TreeArchetype.Umbrella ? 0.4 : 0.64,
    palettes: {
      [Season.Spring]: {
        foliagePrimary: springPrimary,
        foliageSecondary: hasPurpleTint ? '#F7C2D0' : hslToHex(greenHue - 14, 55, 64),
        foliageAccent: hasPurpleTint ? '#D8748D' : hslToHex(greenHue - 4, 48, 44),
        bark: barkHex,
        snowCap: 0,
      },
      [Season.Summer]: {
        foliagePrimary: summerPrimary,
        foliageSecondary: hasRedTint ? '#C75246' : hslToHex(greenHue - 6, 48, 54),
        foliageAccent: hasRedTint ? '#822923' : hslToHex(greenHue + 6, 44, 32),
        bark: barkHex,
        snowCap: 0,
      },
      [Season.Autumn]: {
        foliagePrimary: autumnPrimary,
        foliageSecondary:
          autumnHueChoice === 'evergreen'
            ? hslToHex(greenHue - 4, 36, 44)
            : hslToHex(autumnHueChoice === 'gold' ? 48 : 30, 74, 58),
        foliageAccent:
          autumnHueChoice === 'evergreen'
            ? '#7B5C38'
            : hslToHex(12, 62, 36),
        bark: barkHex,
        snowCap: 0,
      },
      [Season.Winter]: {
        foliagePrimary: winterPrimary,
        foliageSecondary: '#F2F7F9',
        foliageAccent: evergreen ? hslToHex(greenHue, 32, 34) : '#B8C6CD',
        bark: barkHex,
        snowCap: archetype === TreeArchetype.Palm ? 0.1 : 0.88,
        sparseFoliage: !evergreen,
      },
    },
  };
}

/**
 * Computes realistic tree height in meters for a given age (1-40 years)
 * mapped to the species' mature and maximum heights from the botanical catalog.
 */
export function computeHeightForYear(year: number, profile: SpeciesProfile): number {
  const clamped = Math.max(1, Math.min(40, year));
  const saplingH = Math.max(2.0, profile.defaultHeightM * 0.2);
  const matureH = profile.defaultHeightM;
  const maxH = Math.min(30, profile.maxHeightM ?? profile.defaultHeightM * 1.35);

  if (clamped <= 22) {
    const t = (clamped - 1) / 21; // 0..1
    const eased = 1 - Math.pow(1 - t, 1.55);
    return Number((saplingH + (matureH - saplingH) * eased).toFixed(1));
  }
  const t = (clamped - 22) / 18;
  const eased = Math.sin((t * Math.PI) / 2);
  return Number((matureH + (maxH - matureH) * eased).toFixed(1));
}

const ORDERED_SEASONS: Array<Exclude<Season, Season.Custom>> = [
  Season.Spring,
  Season.Summer,
  Season.Autumn,
  Season.Winter,
];

/**
 * Maps a continuous seasonal cycle phase [0, 4) to the nearest discrete Season.
 */
export function seasonFromPhase(phase: number): Exclude<Season, Season.Custom> {
  const norm = ((phase % 4) + 4) % 4;
  const idx = Math.floor(norm + 0.5) % 4;
  return ORDERED_SEASONS[idx];
}

