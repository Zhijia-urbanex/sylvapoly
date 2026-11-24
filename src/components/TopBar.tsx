import { Download, Grid3X3, Box, Trees, RotateCw } from 'lucide-react';
import { BackdropMode, MeshStats, ViewMode } from '../engine/types';

interface TopBarProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  backdrop: BackdropMode;
  onChangeBackdrop: (b: BackdropMode) => void;
  stats: MeshStats;
  isExporting: boolean;
  onExportGLB: () => void;
}

export function TopBar({
  viewMode,
  onChangeViewMode,
  showGrid,
  onToggleGrid,
  wireframe,
  onToggleWireframe,
  autoRotate,
  onToggleAutoRotate,
  backdrop,
  onChangeBackdrop,
  stats,
  isExporting,
  onExportGLB,
}: TopBarProps) {
  const isDark = backdrop === BackdropMode.Slate;

  const surfaceClass = isDark
    ? 'bg-[#1a222d]/95 border-[#2c3849] text-slate-100'
    : 'bg-white/95 border-slate-900/10 text-slate-900';

  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';
  const subtleHover = isDark
    ? 'hover:text-white hover:bg-white/10'
    : 'hover:text-slate-950 hover:bg-slate-900/5';
  const activeSeg = isDark
    ? 'bg-slate-100 text-slate-950'
    : 'bg-slate-900 text-white';

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-20 px-4 pt-4 md:px-6">
      <header
        className={`pointer-events-auto mx-auto flex max-w-[1380px] items-center justify-between gap-8 rounded-xl border px-5 py-2.5 shadow-sm transition-colors ${surfaceClass}`}
      >
        {/* Zone 1: Single-element Brand Wordmark */}
        <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
          SylvaPoly
        </span>

        {/* Zone 2: Concise single-line viewport controls */}
        <nav
          aria-label="Viewport mode and display controls"
          className="hidden md:flex items-center gap-6 text-xs font-medium"
        >
          <div
            className={`flex items-center gap-1 rounded-lg p-0.5 ${
              isDark ? 'bg-slate-900/70' : 'bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => onChangeViewMode(ViewMode.Specimen)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 ${
                viewMode === ViewMode.Specimen ? activeSeg : `${mutedText} ${subtleHover}`
              }`}
            >
              <Box className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Single Tree</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode(ViewMode.Grove)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600 ${
                viewMode === ViewMode.Grove ? activeSeg : `${mutedText} ${subtleHover}`
              }`}
            >
              <Trees className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Grove Pack</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleGrid}
              aria-pressed={showGrid}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showGrid
                  ? isDark
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-200 text-slate-900'
                  : `${mutedText} ${subtleHover}`
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Scale Grid</span>
            </button>
            <button
              type="button"
              onClick={onToggleWireframe}
              aria-pressed={wireframe}
              className={`rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                wireframe
                  ? isDark
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-200 text-slate-900'
                  : `${mutedText} ${subtleHover}`
              }`}
            >
              Wireframe
            </button>
            <button
              type="button"
              onClick={onToggleAutoRotate}
              aria-pressed={autoRotate}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                autoRotate
                  ? isDark
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-200 text-slate-900'
                  : `${mutedText} ${subtleHover}`
              }`}
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Spin</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-1 rounded-lg p-0.5 ${
              isDark ? 'bg-slate-900/70' : 'bg-slate-100'
            }`}
            aria-label="Studio backdrop"
          >
            {(
              [
                { id: BackdropMode.Mint, label: 'Mint' },
                { id: BackdropMode.Daylight, label: 'Light' },
                { id: BackdropMode.Slate, label: 'Dark' },
              ] as const
            ).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onChangeBackdrop(b.id)}
                className={`rounded-md px-2.5 py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  backdrop === b.id ? activeSeg : `${mutedText} ${subtleHover}`
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Zone 3: Single primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={isExporting}
            onClick={onExportGLB}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
              isDark
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isExporting ? 'Exporting...' : 'Export .GLB'}</span>
          </button>
        </div>
      </header>

      {/* Quiet unboxed mesh telemetry bar directly below top-left */}
      <div
        className={`mx-auto mt-2 flex max-w-[1380px] flex-wrap items-center justify-between gap-2 px-1 text-xs font-medium ${
          isDark ? 'text-slate-300/90' : 'text-slate-800/80'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 font-mono-num">
          <span>{stats.triangles.toLocaleString()} tris</span>
          <span aria-hidden="true">·</span>
          <span>{stats.vertices.toLocaleString()} verts</span>
          <span aria-hidden="true">·</span>
          <span>{stats.heightM.toFixed(1)}m H × {stats.widthM.toFixed(1)}m W</span>
          <span aria-hidden="true">·</span>
          <span>
            {stats.treeCount > 1 ? `${stats.treeCount} variants` : '1 specimen'}
          </span>
          <span aria-hidden="true">·</span>
          <span>Pivot (0, 0, 0)</span>
        </div>

        {/* Mobile view mode quick switcher */}
        <div className="pointer-events-auto flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onChangeViewMode(
                viewMode === ViewMode.Specimen ? ViewMode.Grove : ViewMode.Specimen
              )
            }
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${surfaceClass}`}
          >
            {viewMode === ViewMode.Specimen ? 'Single Tree' : 'Grove Pack'}
          </button>
        </div>
      </div>
    </div>
  );
}
