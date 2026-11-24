import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { ControlDock } from './components/ControlDock';
import { TopBar } from './components/TopBar';
import { TreeViewport } from './components/TreeViewport';
import { computeEcoMetrics, computePollinatorActivity } from './engine/ecoMetrics';
import {
  buildExportFilename,
  exportTreeAsGLB,
  exportTreeAsOBJ,
} from './engine/exporters';
import {
  CURATED_SPECIES,
  computeHeightForYear,
  resolveSpecies,
  seasonFromPhase,
} from './engine/speciesParser';
import {
  BackdropMode,
  CameraPreset,
  DetailLevel,
  MeshStats,
  Season,
  SpeciesProfile,
  TreeParams,
  ViewMode,
} from './engine/types';

const INITIAL_SPECIES = CURATED_SPECIES[0]; // Chinese Banyan (榕樹)

const SEASON_TO_PHASE: Record<Exclude<Season, Season.Custom>, number> = {
  [Season.Spring]: 0,
  [Season.Summer]: 1,
  [Season.Autumn]: 2,
  [Season.Winter]: 3,
};

export default function App() {
  const [params, setParams] = useState<TreeParams>({
    speciesQuery: INITIAL_SPECIES.displayName,
    season: Season.Spring,
    seasonPhase: null,
    year: 22,
    heightM: INITIAL_SPECIES.defaultHeightM,
    colorVariation: 0.45,
    foliageSpread: 1.0,
    detailLevel: DetailLevel.Game,
    seed: 104729,
    customFoliageHex: INITIAL_SPECIES.palettes[Season.Spring].foliagePrimary,
    customBarkHex: INITIAL_SPECIES.palettes[Season.Spring].bark,
    viewMode: ViewMode.Grove,
  });

  const [animateYears, setAnimateYears] = useState(false);
  const [animateSeasons, setAnimateSeasons] = useState(false);
  const [backdrop, setBackdrop] = useState<BackdropMode>(BackdropMode.Mint);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [ecoOverlay, setEcoOverlay] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>(CameraPreset.Hero);
  const [cameraTrigger, setCameraTrigger] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [stats, setStats] = useState<MeshStats>({
    triangles: 0,
    vertices: 0,
    parts: 0,
    heightM: INITIAL_SPECIES.defaultHeightM,
    widthM: 4,
    treeCount: 7,
  });

  const [mixProfiles, setMixProfiles] = useState<SpeciesProfile[]>([INITIAL_SPECIES]);
  const activeTreeGroupRef = useRef<THREE.Group | null>(null);

  const resolvedProfile = useMemo(
    () => resolveSpecies(params.speciesQuery),
    [params.speciesQuery]
  );

  const ecoMetrics = useMemo(
    () =>
      computeEcoMetrics(
        resolvedProfile,
        params,
        stats.widthM,
        stats.treeCount,
        mixProfiles,
        stats.crownAreaM2
      ),
    [resolvedProfile, params, stats.widthM, stats.treeCount, stats.crownAreaM2, mixProfiles]
  );

  const pollinators = useMemo(
    () =>
      computePollinatorActivity(
        mixProfiles.length > 0 ? mixProfiles : [resolvedProfile],
        params,
        ecoMetrics.activeLAI
      ),
    [mixProfiles, resolvedProfile, params, ecoMetrics.activeLAI]
  );

  // Playback loop for Years growth and/or Seasonal color iteration
  useEffect(() => {
    if (!animateYears && !animateSeasons) return;

    const TICK_MS = 160;
    const id = window.setInterval(() => {
      setParams((prev) => {
        const profile = resolveSpecies(prev.speciesQuery);
        let nextYear = prev.year;
        let nextHeight = prev.heightM;
        let nextPhase = prev.seasonPhase;
        let nextSeason = prev.season;

        if (animateYears) {
          const step = animateSeasons ? 0.22 : 0.4;
          nextYear = prev.year + step;
          if (nextYear > 40) {
            nextYear = 1;
          }
          nextHeight = computeHeightForYear(nextYear, profile);
        }

        if (animateSeasons) {
          const basePhase =
            typeof prev.seasonPhase === 'number'
              ? prev.seasonPhase
              : prev.season === Season.Custom
                ? 0
                : SEASON_TO_PHASE[prev.season];
          nextPhase = (basePhase + 0.08) % 4;
          nextSeason = seasonFromPhase(nextPhase);
        }

        return {
          ...prev,
          year: nextYear,
          heightM: nextHeight,
          seasonPhase: animateSeasons ? nextPhase : prev.seasonPhase,
          season: nextSeason,
        };
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [animateYears, animateSeasons]);

  const handleAssetReady = useCallback(
    (
      group: THREE.Group,
      _profile: SpeciesProfile,
      nextStats: MeshStats,
      nextMixProfiles: SpeciesProfile[]
    ) => {
      activeTreeGroupRef.current = group;
      setStats(nextStats);
      setMixProfiles(nextMixProfiles);
    },
    []
  );

  const handleUpdateParams = useCallback((patch: Partial<TreeParams>) => {
    if (patch.heightM !== undefined) {
      setAnimateYears(false);
    }
    if (patch.season !== undefined && patch.seasonPhase === null) {
      setAnimateSeasons(false);
    }
    setParams((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleChangeYear = useCallback(
    (year: number) => {
      setAnimateYears(false);
      const nextH = computeHeightForYear(year, resolvedProfile);
      setParams((prev) => ({
        ...prev,
        year,
        heightM: nextH,
      }));
    },
    [resolvedProfile]
  );

  const handleToggleYears = useCallback(() => {
    setAnimateYears((prev) => {
      const next = !prev;
      if (next) {
        // If already near veteran max, restart smoothly from Year 1 sapling
        setParams((p) => {
          if (p.year >= 38) {
            return {
              ...p,
              year: 1,
              heightM: computeHeightForYear(1, resolvedProfile),
            };
          }
          return p;
        });
      }
      return next;
    });
  }, [resolvedProfile]);

  const handleToggleSeasons = useCallback(() => {
    setAnimateSeasons((prev) => {
      const next = !prev;
      if (next) {
        setParams((p) => ({
          ...p,
          seasonPhase:
            p.season === Season.Custom ? 0 : SEASON_TO_PHASE[p.season],
          season: p.season === Season.Custom ? Season.Spring : p.season,
        }));
      } else {
        setParams((p) => ({ ...p, seasonPhase: null }));
      }
      return next;
    });
  }, []);

  const handleToggleBoth = useCallback(() => {
    const bothActive = animateYears && animateSeasons;
    if (bothActive) {
      setAnimateYears(false);
      setAnimateSeasons(false);
      setParams((p) => ({ ...p, seasonPhase: null }));
    } else {
      setAnimateYears(true);
      setAnimateSeasons(true);
      setParams((p) => {
        const startYear = p.year >= 38 ? 1 : p.year;
        return {
          ...p,
          year: startYear,
          heightM: computeHeightForYear(startYear, resolvedProfile),
          seasonPhase:
            p.season === Season.Custom ? 0 : SEASON_TO_PHASE[p.season],
          season: p.season === Season.Custom ? Season.Spring : p.season,
        };
      });
    }
  }, [animateYears, animateSeasons, resolvedProfile]);

  const handleStopAllPlayback = useCallback(() => {
    setAnimateYears(false);
    setAnimateSeasons(false);
    setParams((p) => ({ ...p, seasonPhase: null }));
  }, []);

  const handleSelectPresetSpecies = useCallback((sp: SpeciesProfile) => {
    setParams((prev) => {
      const seasonKey =
        prev.season === Season.Custom ? Season.Summer : prev.season;
      const pal = sp.palettes[seasonKey];
      return {
        ...prev,
        speciesQuery: sp.displayName,
        heightM: computeHeightForYear(prev.year, sp),
        season: prev.season === Season.Custom ? Season.Summer : prev.season,
        customFoliageHex: pal.foliagePrimary,
        customBarkHex: pal.bark,
      };
    });
  }, []);

  const handleRandomizeSeed = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      seed: Math.floor(Math.random() * 900000) + 100000,
    }));
  }, []);

  const handleCycleCamera = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    setCameraTrigger((t) => t + 1);
  }, []);

  const handleExportGLB = useCallback(async () => {
    if (!activeTreeGroupRef.current || isExporting) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const filename = buildExportFilename(
        resolvedProfile.displayName,
        params.season,
        params.heightM,
        params.viewMode,
        'glb'
      );
      await exportTreeAsGLB(activeTreeGroupRef.current, filename);
    } catch {
      setExportError('Failed to export .GLB mesh. Try .OBJ or refresh the viewport.');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, resolvedProfile.displayName, params.season, params.heightM, params.viewMode]);

  const handleExportOBJ = useCallback(() => {
    if (!activeTreeGroupRef.current) return;
    setExportError(null);
    try {
      const filename = buildExportFilename(
        resolvedProfile.displayName,
        params.season,
        params.heightM,
        params.viewMode,
        'obj'
      );
      exportTreeAsOBJ(activeTreeGroupRef.current, filename);
    } catch {
      setExportError('Failed to export .OBJ mesh.');
    }
  }, [resolvedProfile.displayName, params.season, params.heightM, params.viewMode]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <TreeViewport
        params={params}
        backdrop={backdrop}
        showGrid={showGrid}
        wireframe={wireframe}
        autoRotate={autoRotate}
        ecoOverlay={ecoOverlay}
        ecoMetrics={ecoMetrics}
        pollinators={pollinators}
        cameraPreset={cameraPreset}
        cameraTrigger={cameraTrigger}
        onAssetReady={handleAssetReady}
      />

      <TopBar
        viewMode={params.viewMode}
        onChangeViewMode={(viewMode) => handleUpdateParams({ viewMode })}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        wireframe={wireframe}
        onToggleWireframe={() => setWireframe((w) => !w)}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate((r) => !r)}
        ecoOverlay={ecoOverlay}
        onToggleEcoOverlay={() => setEcoOverlay((e) => !e)}
        backdrop={backdrop}
        onChangeBackdrop={setBackdrop}
        stats={stats}
        ecoMetrics={ecoMetrics}
        year={params.year}
        isExporting={isExporting}
        onExportGLB={handleExportGLB}
      />

      {exportError && (
        <div
          role="alert"
          className="fixed top-20 right-6 z-30 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-medium text-red-900 shadow-sm"
        >
          {exportError}
        </div>
      )}

      <ControlDock
        params={params}
        resolvedProfile={resolvedProfile}
        ecoMetrics={ecoMetrics}
        ecoOverlay={ecoOverlay}
        onToggleEcoOverlay={() => setEcoOverlay((e) => !e)}
        backdrop={backdrop}
        cameraPreset={cameraPreset}
        animateYears={animateYears}
        animateSeasons={animateSeasons}
        onUpdateParams={handleUpdateParams}
        onChangeYear={handleChangeYear}
        onToggleYears={handleToggleYears}
        onToggleSeasons={handleToggleSeasons}
        onToggleBoth={handleToggleBoth}
        onStopAllPlayback={handleStopAllPlayback}
        onSelectPresetSpecies={handleSelectPresetSpecies}
        onRandomizeSeed={handleRandomizeSeed}
        onCycleCamera={handleCycleCamera}
        onExportOBJ={handleExportOBJ}
      />
    </main>
  );
}
