export enum TreeArchetype {
  Broadleaf = 'broadleaf',
  Conifer = 'conifer',
  Umbrella = 'umbrella',
  Pagoda = 'pagoda',
  Palm = 'palm',
  Poplar = 'poplar',
  Weeping = 'weeping',
}

export enum Season {
  Spring = 'spring',
  Summer = 'summer',
  Autumn = 'autumn',
  Winter = 'winter',
  Custom = 'custom',
}

export enum ViewMode {
  Specimen = 'specimen',
  Grove = 'grove',
  MiniForest = 'miniforest',
}

export enum BackdropMode {
  Mint = 'mint',
  Daylight = 'daylight',
  Slate = 'slate',
}

export enum DetailLevel {
  UltraLow = 0, // LOD2: 5-sided trunks, icosahedron detail 0
  Game = 1,     // LOD1: 6-sided trunks, rich cluster count
  Hero = 2,     // LOD0: 7-sided trunks, detail 1 foliage + accent boughs
}

export enum CameraPreset {
  Hero = 'hero',
  Front = 'front',
  Top = 'top',
}

export type SpeciesCategory = 'all' | 'taipei' | 'shade' | 'supplementary';

export interface SeasonalPalette {
  foliagePrimary: string;
  foliageSecondary: string;
  foliageAccent: string;
  bark: string;
  /** Ratio 0-1 of snow/frost highlight blended on upper faces in winter */
  snowCap: number;
  /** Whether deciduous foliage thins out / exposes branches */
  sparseFoliage?: boolean;
  /** True when winter deciduous tree drops leaves (LAI ~ 0) leaving sculptural bare branches */
  bareBranchWinter?: boolean;
  /** Optional small accent pops (blossoms, fruits, red buds) */
  accentClusterRatio?: number;
  /** Phenology summary from botanical catalog */
  note?: string;
}

export interface SpeciesProfile {
  id: string;
  displayName: string;
  chineseName?: string;
  botanicalName: string;
  category: Exclude<SpeciesCategory, 'all'>;
  biome: string;
  archetype: TreeArchetype;
  evergreen: boolean;
  hasAerialRoots?: boolean;
  defaultHeightM: number;
  maxHeightM?: number;
  crownWidthRangeM?: string;
  laiTypical?: string;
  laiMid?: number;
  co2KgPerYear?: number;
  o2KgPerYear?: number;
  surfaceCoolC?: string;
  airCoolC?: string;
  trunkTaper: number; // 0.25 - 0.65
  trunkCurvature: number; // 0 - 1
  branchSpread: number; // 0.5 - 1.5
  canopyRatio: number; // fraction of height occupied by canopy
  palettes: Record<Exclude<Season, Season.Custom>, SeasonalPalette>;
}

export interface EcoMetrics {
  activeLAI: number;
  crownProjectionM2: number;
  totalLeafSurfaceM2: number; // Crown Projection Area * LAI (PDF PM2.5 / shade capacity)
  annualCo2Kg: number;
  cumulativeCo2Kg: number;
  annualO2Kg: number;
  drivingKmOffset: number;
  surfaceCoolC: string;
  airCoolC: string;
}

export interface PollinatorActivity {
  active: boolean;
  butterflies: number;
  bees: number;
  reason: string;
}

export interface TreeParams {
  speciesQuery: string;
  season: Season;
  /** Optional continuous seasonal cycle phase [0, 4): 0=Spring, 1=Summer, 2=Autumn, 3=Winter */
  seasonPhase?: number | null;
  /** Tree age in years (1 - 40) */
  year: number;
  heightM: number;
  colorVariation: number; // 0 to 1
  foliageSpread: number; // 0.6 to 1.5
  detailLevel: DetailLevel;
  seed: number;
  customFoliageHex: string;
  customBarkHex: string;
  viewMode: ViewMode;
}

export interface MeshStats {
  triangles: number;
  vertices: number;
  parts: number;
  heightM: number;
  widthM: number;
  treeCount: number;
  crownAreaM2?: number;
  speciesCount?: number;
  mixSpeciesNames?: string[];
}
