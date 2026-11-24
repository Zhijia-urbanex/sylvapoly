import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Shuffle,
  Search,
  Camera,
  LayoutGrid,
  X,
  TrendingUp,
  Sun,
  Play,
  Pause,
} from 'lucide-react';
import { CURATED_SPECIES } from '../engine/speciesParser';
import {
  BackdropMode,
  CameraPreset,
  DetailLevel,
  Season,
  SpeciesCategory,
  SpeciesProfile,
  TreeParams,
} from '../engine/types';

interface ControlDockProps {
  params: TreeParams;
  resolvedProfile: SpeciesProfile;
  backdrop: BackdropMode;
  cameraPreset: CameraPreset;
  animateYears: boolean;
  animateSeasons: boolean;
  onUpdateParams: (patch: Partial<TreeParams>) => void;
  onChangeYear: (year: number) => void;
  onToggleYears: () => void;
  onToggleSeasons: () => void;
  onToggleBoth: () => void;
  onStopAllPlayback: () => void;
  onSelectPresetSpecies: (profile: SpeciesProfile) => void;
  onRandomizeSeed: () => void;
  onCycleCamera: (preset: CameraPreset) => void;
  onExportOBJ: () => void;
}

const SEASON_OPTIONS: Array<{ id: Season; label: string }> = [
  { id: Season.Spring, label: 'Spring' },
  { id: Season.Summer, label: 'Summer' },
  { id: Season.Autumn, label: 'Autumn' },
  { id: Season.Winter, label: 'Winter' },
  { id: Season.Custom, label: 'Custom' },
];

const CATEGORY_OPTIONS: Array<{ id: SpeciesCategory; label: string }> = [
  { id: 'all', label: 'All (25)' },
  { id: 'taipei', label: 'Taipei Urban (12)' },
  { id: 'shade', label: 'Shade (7)' },
  { id: 'supplementary', label: 'Suppl. (6)' },
];

const LOD_OPTIONS: Array<{ id: DetailLevel; label: string }> = [
  { id: DetailLevel.UltraLow, label: 'LOD2' },
  { id: DetailLevel.Game, label: 'LOD1' },
  { id: DetailLevel.Hero, label: 'LOD0' },
];

export function ControlDock({
  params,
  resolvedProfile,
  backdrop,
  cameraPreset,
  animateYears,
  animateSeasons,
  onUpdateParams,
  onChangeYear,
  onToggleYears,
  onToggleSeasons,
  onToggleBoth,
  onStopAllPlayback,
  onSelectPresetSpecies,
  onRandomizeSeed,
  onCycleCamera,
  onExportOBJ,
}: ControlDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SpeciesCategory>('all');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setCollapsed((c) => !c);
      } else if (e.key === 'Escape') {
        setCatalogOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredSpecies = useMemo(() => {
    if (activeCategory === 'all') return CURATED_SPECIES;
    return CURATED_SPECIES.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const updateScrollButtons = () => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [filteredSpecies, collapsed]);

  useEffect(() => {
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, []);

  const scrollStripBy = (dx: number) => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: 'smooth' });
  };

  const isDark = backdrop === BackdropMode.Slate;
  const dockBg = isDark
    ? 'dark-dock bg-[#18202b]/95 border-[#2c3849] text-slate-100'
    : 'bg-white/95 border-slate-900/12 text-slate-900';
  const divider = isDark ? 'border-slate-700/60' : 'border-slate-200';
  const inputBg = isDark
    ? 'bg-slate-900/80 border-slate-700 text-slate-100 placeholder:text-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400';
  const segTrack = isDark ? 'bg-slate-900/75' : 'bg-slate-100';
  const segActive = isDark
    ? 'bg-slate-100 text-slate-950 shadow-xs'
    : 'bg-white text-slate-950 shadow-xs';
  const segIdle = isDark
    ? 'text-slate-400 hover:text-slate-100'
    : 'text-slate-600 hover:text-slate-900';
  const activeToggle = isDark
    ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-200'
    : 'border-slate-900 bg-slate-900 text-white';
  const mutedLabel = isDark ? 'text-slate-400' : 'text-slate-500';

  const activePalette =
    params.season === Season.Custom
      ? { foliage: params.customFoliageHex, bark: params.customBarkHex }
      : {
          foliage: resolvedProfile.palettes[params.season].foliagePrimary,
          bark: resolvedProfile.palettes[params.season].bark,
        };

  const bothPlaying = animateYears && animateSeasons;
  const anyPlaying = animateYears || animateSeasons;

  return (
    <div className="pointer-events-none fixed bottom-0 inset-x-0 z-20 flex justify-center px-4">
      <div
        className="relative w-full max-w-[1040px] pb-4 transition-transform duration-200 ease-out"
        style={{
          transform: collapsed ? 'translateY(calc(100% - 32px))' : 'translateY(0)',
        }}
      >
        {/* Full 25-Species Catalog Upward Popover */}
        {catalogOpen && !collapsed && (
          <div
            role="dialog"
            aria-label="All 25 tree species catalog"
            className={`pointer-events-auto mb-2 rounded-xl border p-4 shadow-xl ${dockBg}`}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-sm font-semibold">
                  Species Catalog
                </h2>
                <span className={`text-xs ${mutedLabel}`}>
                  {filteredSpecies.length} species · Click any species to generate
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCatalogOpen(false)}
                aria-label="Close species catalog"
                className={`rounded-md p-1 transition-colors cursor-pointer ${segIdle}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid max-h-[260px] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredSpecies.map((sp) => {
                const isSelected = resolvedProfile.id === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => {
                      onSelectPresetSpecies(sp);
                      setCatalogOpen(false);
                    }}
                    className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                          : 'border-slate-900 bg-slate-900 text-white'
                        : isDark
                          ? 'border-slate-700/70 bg-slate-900/50 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                          : 'border-slate-200 bg-slate-50/70 text-slate-900 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-1.5">
                      <span className="truncate text-xs font-semibold">
                        {sp.chineseName || sp.displayName}
                      </span>
                      <span
                        className="h-2.5 w-2.5 rounded-xs border border-black/15 shrink-0"
                        style={{
                          backgroundColor:
                            params.season === Season.Custom
                              ? params.customFoliageHex
                              : sp.palettes[params.season].foliagePrimary,
                        }}
                        aria-hidden="true"
                      />
                    </div>
                    <span
                      className={`w-full truncate text-[11px] ${
                        isSelected
                          ? isDark
                            ? 'text-emerald-300/90'
                            : 'text-slate-300'
                          : mutedLabel
                      }`}
                    >
                      {sp.displayName}
                    </span>
                    <span
                      className={`mt-0.5 w-full truncate font-mono-num text-[10px] ${
                        isSelected
                          ? isDark
                            ? 'text-emerald-300/70'
                            : 'text-slate-400'
                          : mutedLabel
                      }`}
                    >
                      {sp.defaultHeightM}m · {sp.evergreen ? 'Evergreen' : 'Deciduous'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Collapse / Expand Handle */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            className={`pointer-events-auto flex items-center gap-1.5 rounded-t-lg border border-b-0 px-4 py-1.5 text-xs font-medium shadow-sm transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-emerald-600 ${dockBg}`}
          >
            {collapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Show Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {/* Main Dock Panel */}
        <section
          aria-label="Tree generator controls"
          className={`pointer-events-auto rounded-xl border p-4 shadow-lg ${dockBg}`}
        >
          {/* Row 1: Species Input + Botanical Specs + Season Selector */}
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-0">
              <div className="relative flex-1 min-w-[200px] max-w-[260px]">
                <Search
                  className={`pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${mutedLabel}`}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Tree species name"
                  value={params.speciesQuery}
                  onChange={(e) => onUpdateParams({ speciesQuery: e.target.value })}
                  placeholder="Type species (e.g. 榕樹, Sweet Gum)..."
                  className={`w-full rounded-lg border py-1.5 pl-8 pr-3 text-sm font-medium outline-none transition-colors focus:border-emerald-600 ${inputBg}`}
                />
              </div>

              {/* Unboxed bilingual botanical readout */}
              <div className={`flex flex-wrap items-center gap-1.5 text-xs truncate ${mutedLabel}`}>
                {resolvedProfile.chineseName && (
                  <>
                    <span className={isDark ? 'font-semibold text-slate-200' : 'font-semibold text-slate-800'}>
                      {resolvedProfile.chineseName}
                    </span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className="italic">{resolvedProfile.botanicalName}</span>
                {resolvedProfile.laiTypical && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">LAI {resolvedProfile.laiTypical}</span>
                  </>
                )}
                {resolvedProfile.co2KgPerYear && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">{resolvedProfile.co2KgPerYear} kg CO₂/yr</span>
                  </>
                )}
              </div>
            </div>

            {/* Season segmented selector */}
            <div className="flex flex-col gap-1 shrink-0">
              <div className={`flex items-center gap-1 rounded-lg p-1 ${segTrack}`}>
                {SEASON_OPTIONS.map((opt) => {
                  const active = params.season === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.id !== Season.Custom) {
                          const spPal = resolvedProfile.palettes[opt.id];
                          onUpdateParams({
                            season: opt.id,
                            seasonPhase: null,
                            customFoliageHex: spPal.foliagePrimary,
                            customBarkHex: spPal.bark,
                          });
                        } else {
                          onUpdateParams({
                            season: Season.Custom,
                            seasonPhase: null,
                          });
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active ? segActive : segIdle
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-xs border border-black/15 shrink-0"
                        style={{
                          backgroundColor:
                            opt.id === Season.Custom
                              ? params.customFoliageHex
                              : resolvedProfile.palettes[opt.id].foliagePrimary,
                        }}
                        aria-hidden="true"
                      />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Full-Width Category Filter + Scrollable Tree Types Strip + All-25 Grid Button */}
          <div className="mt-2.5 flex items-center gap-2 min-w-0">
            <div className={`hidden md:flex items-center gap-0.5 rounded-lg p-0.5 shrink-0 ${segTrack}`}>
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (stripRef.current) stripRef.current.scrollLeft = 0;
                  }}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeCategory === cat.id ? segActive : segIdle
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollStripBy(-260)}
              disabled={!canScrollLeft}
              aria-label="Scroll tree species left"
              className={`rounded-md border p-1 transition-colors shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-default ${inputBg}`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div
              ref={stripRef}
              onScroll={updateScrollButtons}
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && stripRef.current) {
                  e.preventDefault();
                  stripRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0 scroll-smooth"
            >
              {filteredSpecies.map((sp) => {
                const isSelected = resolvedProfile.id === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onSelectPresetSpecies(sp)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-900 text-white'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                    }`}
                  >
                    {sp.chineseName ? `${sp.displayName} ${sp.chineseName}` : sp.displayName}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollStripBy(260)}
              disabled={!canScrollRight}
              aria-label="Scroll tree species right"
              className={`rounded-md border p-1 transition-colors shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-default ${inputBg}`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setCatalogOpen((o) => !o)}
              aria-expanded={catalogOpen}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                catalogOpen ? activeToggle : inputBg
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All Species</span>
            </button>
          </div>

          {/* Hairline Divider */}
          <div className={`my-3 border-t ${divider}`} />

          {/* Row 3: Age (Years), Height, Color Variation, Spread Sliders */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:items-center">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="tree-year-slider" className={`font-medium ${mutedLabel}`}>
                  Tree Age
                </label>
                <span className="font-mono-num font-semibold">
                  Yr {Math.round(params.year)}
                </span>
              </div>
              <input
                id="tree-year-slider"
                type="range"
                min={1}
                max={40}
                step={1}
                value={Math.round(params.year)}
                onChange={(e) => onChangeYear(parseInt(e.target.value, 10))}
                className={`sylva-slider w-full ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="tree-height-slider" className={`font-medium ${mutedLabel}`}>
                  Height
                </label>
                <span className="font-mono-num font-semibold">
                  {params.heightM.toFixed(1)} m
                </span>
              </div>
              <input
                id="tree-height-slider"
                type="range"
                min={2.0}
                max={30.0}
                step={0.5}
                value={params.heightM}
                onChange={(e) =>
                  onUpdateParams({ heightM: parseFloat(e.target.value) })
                }
                className={`sylva-slider w-full ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="color-var-slider" className={`font-medium ${mutedLabel}`}>
                  Color Variation
                </label>
                <span className="font-mono-num font-semibold">
                  {Math.round(params.colorVariation * 100)}%
                </span>
              </div>
              <input
                id="color-var-slider"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={params.colorVariation}
                onChange={(e) =>
                  onUpdateParams({ colorVariation: parseFloat(e.target.value) })
                }
                className={`sylva-slider w-full ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="spread-slider" className={`font-medium ${mutedLabel}`}>
                  Spread
                </label>
                <span className="font-mono-num font-semibold">
                  {params.foliageSpread.toFixed(2)}×
                </span>
              </div>
              <input
                id="spread-slider"
                type="range"
                min={0.65}
                max={1.45}
                step={0.05}
                value={params.foliageSpread}
                onChange={(e) =>
                  onUpdateParams({ foliageSpread: parseFloat(e.target.value) })
                }
                className={`sylva-slider w-full ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                }`}
              />
            </div>
          </div>

          {/* Hairline Divider */}
          <div className={`my-2.5 border-t ${divider}`} />

          {/* Row 4: Years & Season Cycle Playback Controls + Swatches, LOD, Seed, Camera, .OBJ */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Independent or Combined Year Growth & Season Color Cycle Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`text-[11px] font-medium mr-1 ${mutedLabel}`}>
                Simulate:
              </span>
              <button
                type="button"
                onClick={onToggleYears}
                aria-pressed={animateYears}
                title="Animate tree growth across Years 1–40"
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  animateYears ? activeToggle : inputBg
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Years</span>
              </button>

              <button
                type="button"
                onClick={onToggleSeasons}
                aria-pressed={animateSeasons}
                title="Iterate smoothly through Spring, Summer, Autumn, and Winter colors"
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  animateSeasons ? activeToggle : inputBg
                }`}
              >
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Seasons</span>
              </button>

              <button
                type="button"
                onClick={onToggleBoth}
                aria-pressed={bothPlaying}
                title="Run Years growth and Seasonal color iteration simultaneously"
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  bothPlaying ? activeToggle : inputBg
                }`}
              >
                {bothPlaying ? (
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>Both</span>
              </button>

              {anyPlaying && !bothPlaying && (
                <button
                  type="button"
                  onClick={onStopAllPlayback}
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${inputBg}`}
                >
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </button>
              )}
            </div>

            {/* Swatches + LOD + Utility Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <label
                  className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="Override foliage color"
                >
                  <input
                    type="color"
                    aria-label="Foliage color"
                    value={activePalette.foliage}
                    onChange={(e) => {
                      onStopAllPlayback();
                      onUpdateParams({
                        season: Season.Custom,
                        seasonPhase: null,
                        customFoliageHex: e.target.value,
                        customBarkHex: activePalette.bark,
                      });
                    }}
                    className="h-6 w-6 cursor-pointer rounded border border-black/15 bg-transparent p-0"
                  />
                  <span className={mutedLabel}>Leaf</span>
                </label>
                <label
                  className="flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  title="Override bark color"
                >
                  <input
                    type="color"
                    aria-label="Bark color"
                    value={activePalette.bark}
                    onChange={(e) => {
                      onStopAllPlayback();
                      onUpdateParams({
                        season: Season.Custom,
                        seasonPhase: null,
                        customFoliageHex: activePalette.foliage,
                        customBarkHex: e.target.value,
                      });
                    }}
                    className="h-6 w-6 cursor-pointer rounded border border-black/15 bg-transparent p-0"
                  />
                  <span className={mutedLabel}>Bark</span>
                </label>
              </div>

              <div className={`flex items-center gap-0.5 rounded-lg p-0.5 ${segTrack}`}>
                {LOD_OPTIONS.map((lod) => (
                  <button
                    key={lod.id}
                    type="button"
                    onClick={() => onUpdateParams({ detailLevel: lod.id })}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      params.detailLevel === lod.id ? segActive : segIdle
                    }`}
                  >
                    {lod.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onRandomizeSeed}
                title="Generate new variation seed"
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${inputBg}`}
              >
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Seed</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next =
                    cameraPreset === CameraPreset.Hero
                      ? CameraPreset.Front
                      : cameraPreset === CameraPreset.Front
                        ? CameraPreset.Top
                        : CameraPreset.Hero;
                  onCycleCamera(next);
                }}
                title="Cycle camera angle"
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${inputBg}`}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="capitalize">{cameraPreset}</span>
              </button>

              <button
                type="button"
                onClick={onExportOBJ}
                title="Export Wavefront .OBJ"
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${inputBg}`}
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>.OBJ</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
