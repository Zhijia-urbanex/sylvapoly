import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { Season, ViewMode } from './types';

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'low_poly_tree';
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildExportFilename(
  speciesName: string,
  season: Season,
  heightM: number,
  viewMode: ViewMode,
  ext: 'glb' | 'obj'
): string {
  const base = sanitizeFilename(speciesName);
  const modeSuffix = viewMode === ViewMode.Grove ? '_grove_pack' : '';
  return `${base}_${season}_${heightM.toFixed(1)}m${modeSuffix}.${ext}`;
}

/**
 * Exports the clean tree THREE.Group as a binary .GLB asset ready for Unity,
 * Unreal Engine 5, Godot 4, or Blender.
 */
export async function exportTreeAsGLB(
  treeGroup: THREE.Group,
  filename: string
): Promise<void> {
  const exporter = new GLTFExporter();
  const exportRoot = treeGroup.clone(true);
  exportRoot.updateMatrixWorld(true);

  return new Promise((resolve, reject) => {
    exporter.parse(
      exportRoot,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'model/gltf-binary' });
          triggerDownload(blob, filename);
          resolve();
        } else {
          const json = JSON.stringify(result, null, 2);
          const blob = new Blob([json], { type: 'application/json' });
          triggerDownload(blob, filename.replace(/\.glb$/, '.gltf'));
          resolve();
        }
      },
      (error) => reject(error),
      { binary: true, onlyVisible: true }
    );
  });
}

/**
 * Exports the clean tree THREE.Group as a Wavefront .OBJ file.
 */
export function exportTreeAsOBJ(treeGroup: THREE.Group, filename: string): void {
  const exporter = new OBJExporter();
  const exportRoot = treeGroup.clone(true);
  exportRoot.updateMatrixWorld(true);
  const objText = exporter.parse(exportRoot);
  const blob = new Blob([objText], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}
