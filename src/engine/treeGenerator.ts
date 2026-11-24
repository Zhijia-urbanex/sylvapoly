import * as THREE from 'three';
import { createRng, hashString, randRange } from './prng';
import { resolveSpecies } from './speciesParser';
import {
  DetailLevel,
  MeshStats,
  Season,
  SeasonalPalette,
  SpeciesProfile,
  TreeArchetype,
  TreeParams,
  ViewMode,
} from './types';

const SEASON_RING: Array<Exclude<Season, Season.Custom>> = [
  Season.Spring,
  Season.Summer,
  Season.Autumn,
  Season.Winter,
];

function lerpHex(hexA: string, hexB: string, t: number): string {
  const cA = new THREE.Color(hexA);
  const cB = new THREE.Color(hexB);
  cA.lerp(cB, t);
  return `#${cA.getHexString()}`;
}

function getActivePalette(profile: SpeciesProfile, params: TreeParams): SeasonalPalette {
  if (params.season === Season.Custom) {
    const base = new THREE.Color(params.customFoliageHex);
    const secondary = base.clone().offsetHSL(-0.025, 0.04, 0.08);
    const accent = base.clone().offsetHSL(0.025, 0.02, -0.09);
    return {
      foliagePrimary: `#${base.getHexString()}`,
      foliageSecondary: `#${secondary.getHexString()}`,
      foliageAccent: `#${accent.getHexString()}`,
      bark: params.customBarkHex,
      snowCap: 0,
      sparseFoliage: false,
      bareBranchWinter: false,
    };
  }

  if (typeof params.seasonPhase === 'number' && Number.isFinite(params.seasonPhase)) {
    const phase = ((params.seasonPhase % 4) + 4) % 4;
    const idxA = Math.floor(phase) % 4;
    const idxB = (idxA + 1) % 4;
    const frac = phase - Math.floor(phase);

    const pA = profile.palettes[SEASON_RING[idxA]];
    const pB = profile.palettes[SEASON_RING[idxB]];

    // Smoothly handle winter leaf-drop window around Winter (phase ~ 3.0)
    const distToWinter = Math.min(Math.abs(phase - 3), 4 - Math.abs(phase - 3));
    const winterPal = profile.palettes[Season.Winter];
    const inBareWindow = Boolean(winterPal.bareBranchWinter) && distToWinter < 0.34;
    const inSparseWindow = Boolean(winterPal.sparseFoliage) && distToWinter < 0.58;

    return {
      foliagePrimary: lerpHex(pA.foliagePrimary, pB.foliagePrimary, frac),
      foliageSecondary: lerpHex(pA.foliageSecondary, pB.foliageSecondary, frac),
      foliageAccent: lerpHex(pA.foliageAccent, pB.foliageAccent, frac),
      bark: lerpHex(pA.bark, pB.bark, frac),
      snowCap: THREE.MathUtils.lerp(pA.snowCap, pB.snowCap, frac),
      sparseFoliage: inSparseWindow,
      bareBranchWinter: inBareWindow,
      accentClusterRatio: THREE.MathUtils.lerp(
        pA.accentClusterRatio ?? 0,
        pB.accentClusterRatio ?? 0,
        frac
      ),
      note: frac < 0.5 ? pA.note : pB.note,
    };
  }

  return profile.palettes[params.season];
}

/**
 * Applies deterministic vertex jitter to an indexed BufferGeometry (keeping shared
 * vertices watertight), converts to non-indexed for crisp low-poly facets, and
 * recomputes flat vertex normals.
 */
function facetizeGeometry(
  source: THREE.BufferGeometry,
  jitterAmount: number,
  rng: () => number,
  radialBias = 1.0
): THREE.BufferGeometry {
  const posAttr = source.attributes.position;
  if (jitterAmount > 0) {
    const offsets = new Map<string, [number, number, number]>();
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
      let off = offsets.get(key);
      if (!off) {
        off = [
          (rng() - 0.5) * 2 * jitterAmount * radialBias,
          (rng() - 0.5) * 2 * jitterAmount,
          (rng() - 0.5) * 2 * jitterAmount * radialBias,
        ];
        offsets.set(key, off);
      }
      posAttr.setXYZ(i, x + off[0], y + off[1], z + off[2]);
    }
    posAttr.needsUpdate = true;
  }

  const nonIndexed = source.index ? source.toNonIndexed() : source.clone();
  source.dispose();
  nonIndexed.computeVertexNormals();
  nonIndexed.computeBoundingBox();
  nonIndexed.computeBoundingSphere();
  return nonIndexed;
}

/**
 * Builds foliage materials with controlled HSL variation + dedicated accent material.
 */
function buildFoliageMaterials(
  palette: SeasonalPalette,
  colorVariation: number,
  rng: () => number,
  variantHueShift = 0
): { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial } {
  const baseColors = [
    new THREE.Color(palette.foliagePrimary),
    new THREE.Color(palette.foliageSecondary),
    new THREE.Color(palette.foliagePrimary).lerp(new THREE.Color(palette.foliageSecondary), 0.5),
  ];

  const mainMats: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 4; i++) {
    const src = baseColors[i % baseColors.length].clone();
    const hShift = variantHueShift + (rng() - 0.5) * 0.08 * colorVariation;
    const sShift = (rng() - 0.5) * 0.16 * colorVariation;
    const lShift = (rng() - 0.5) * 0.14 * colorVariation;
    src.offsetHSL(hShift, sShift, lShift);

    mainMats.push(
      new THREE.MeshStandardMaterial({
        color: src,
        roughness: 0.64,
        metalness: 0.0,
        flatShading: true,
      })
    );
  }

  const accentColor = new THREE.Color(palette.foliageAccent);
  accentColor.offsetHSL(variantHueShift * 0.5, (rng() - 0.5) * 0.08 * colorVariation, 0);
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.6,
    metalness: 0.0,
    flatShading: true,
  });

  return { mainMats, accentMat };
}

function buildBarkMaterial(barkHex: string, colorVariation: number, rng: () => number): THREE.MeshStandardMaterial {
  const c = new THREE.Color(barkHex);
  c.offsetHSL((rng() - 0.5) * 0.02 * colorVariation, 0, (rng() - 0.5) * 0.06 * colorVariation);
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.92,
    metalness: 0.0,
    flatShading: true,
  });
}

function createLimbSegment(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radiusStart: number,
  radiusEnd: number,
  radialSegments: number,
  material: THREE.Material,
  rng: () => number,
  name: string
): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(0.05, dir.length());
  const raw = new THREE.CylinderGeometry(radiusEnd, radiusStart, length, radialSegments, 1, false);
  const geom = facetizeGeometry(raw, radiusStart * 0.06, rng);

  const mesh = new THREE.Mesh(geom, material);
  mesh.name = name;
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mesh.position.copy(mid);
  const up = new THREE.Vector3(0, 1, 0);
  mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildSegmentedTrunk(
  group: THREE.Group,
  totalHeight: number,
  trunkHeightRatio: number,
  baseRadius: number,
  taper: number,
  curvature: number,
  radialSegments: number,
  barkMat: THREE.Material,
  rng: () => number
): { topPoint: THREE.Vector3; forkPoints: THREE.Vector3[] } {
  const trunkH = totalHeight * trunkHeightRatio;
  const segCount = 3;
  const segH = trunkH / segCount;

  const flareH = Math.max(0.22, totalHeight * 0.065);
  const flareRaw = new THREE.CylinderGeometry(
    baseRadius * 0.95,
    baseRadius * 1.48,
    flareH,
    radialSegments + 1,
    1
  );
  const flareGeom = facetizeGeometry(flareRaw, baseRadius * 0.1, rng);
  const flareMesh = new THREE.Mesh(flareGeom, barkMat);
  flareMesh.name = 'Trunk_RootFlare';
  flareMesh.position.y = flareH * 0.5;
  flareMesh.castShadow = true;
  flareMesh.receiveShadow = true;
  group.add(flareMesh);

  let cur = new THREE.Vector3(0, flareH * 0.8, 0);
  let curRadius = baseRadius;
  const forkPoints: THREE.Vector3[] = [];
  const leanAngle = randRange(rng, 0, Math.PI * 2);

  for (let i = 0; i < segCount; i++) {
    const t = (i + 1) / segCount;
    const nextRadius = baseRadius * THREE.MathUtils.lerp(1.0, taper, t);
    const drift = curvature * totalHeight * 0.045 * (i === 0 ? 0.5 : 1.0);
    const next = new THREE.Vector3(
      cur.x + Math.cos(leanAngle + (rng() - 0.5) * 0.9) * drift,
      cur.y + segH,
      cur.z + Math.sin(leanAngle + (rng() - 0.5) * 0.9) * drift
    );

    const segMesh = createLimbSegment(
      cur,
      next,
      curRadius,
      nextRadius,
      radialSegments,
      barkMat,
      rng,
      `Trunk_Seg_${i + 1}`
    );
    group.add(segMesh);

    if (i >= 1) {
      forkPoints.push(next.clone());
    }
    cur = next;
    curRadius = nextRadius;
  }

  return { topPoint: cur, forkPoints };
}

function addAccentClusters(
  group: THREE.Group,
  anchors: THREE.Vector3[],
  treeHeight: number,
  spread: number,
  ratio: number,
  icoDetail: number,
  accentMat: THREE.Material,
  rng: () => number
) {
  const count = Math.max(2, Math.round(anchors.length * ratio * 3.2));
  for (let i = 0; i < count; i++) {
    const tip = anchors[i % anchors.length];
    const r = treeHeight * randRange(rng, 0.042, 0.078) * Math.sqrt(spread);
    const raw = new THREE.IcosahedronGeometry(r, icoDetail > 0 ? 0 : 0);
    const geom = facetizeGeometry(raw, r * 0.14, rng);
    const accent = new THREE.Mesh(geom, accentMat);
    accent.name = `Seasonal_Accent_${i + 1}`;
    const a = randRange(rng, 0, Math.PI * 2);
    const dist = randRange(rng, r * 0.5, r * 2.1);
    accent.position.set(
      tip.x + Math.cos(a) * dist,
      tip.y + randRange(rng, -r * 0.6, r * 1.1),
      tip.z + Math.sin(a) * dist
    );
    accent.castShadow = true;
    accent.receiveShadow = true;
    group.add(accent);
  }
}

function buildBroadleafTree(
  group: THREE.Group,
  profile: SpeciesProfile,
  palette: SeasonalPalette,
  params: TreeParams,
  foliageMats: { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial },
  barkMat: THREE.Material,
  rng: () => number
) {
  const h = params.heightM;
  const spread = profile.branchSpread * params.foliageSpread;
  const radialSegs = params.detailLevel === DetailLevel.UltraLow ? 5 : params.detailLevel === DetailLevel.Game ? 6 : 7;
  const icoDetail = params.detailLevel === DetailLevel.Hero ? 1 : 0;

  const baseRadius = h * 0.052;
  const { topPoint, forkPoints } = buildSegmentedTrunk(
    group,
    h,
    0.46,
    baseRadius,
    profile.trunkTaper,
    profile.trunkCurvature,
    radialSegs,
    barkMat,
    rng
  );

  const branchCount = params.detailLevel === DetailLevel.UltraLow ? 3 : params.detailLevel === DetailLevel.Game ? 4 : 5;
  const branchTips: THREE.Vector3[] = [
    new THREE.Vector3(
      topPoint.x + (rng() - 0.5) * h * 0.05,
      h * 0.82,
      topPoint.z + (rng() - 0.5) * h * 0.05
    ),
  ];

  const leaderMesh = createLimbSegment(
    topPoint,
    branchTips[0],
    baseRadius * profile.trunkTaper * 0.9,
    baseRadius * 0.18,
    Math.max(4, radialSegs - 1),
    barkMat,
    rng,
    'Branch_Leader'
  );
  group.add(leaderMesh);

  for (let b = 0; b < branchCount; b++) {
    const anchor = b === 0 && forkPoints.length > 1 ? forkPoints[0] : topPoint;
    const angle = (b / branchCount) * Math.PI * 2 + randRange(rng, -0.35, 0.35);
    const outDist = h * randRange(rng, 0.17, 0.29) * spread;
    const rise = h * randRange(rng, 0.16, 0.31);
    const tip = new THREE.Vector3(
      anchor.x + Math.cos(angle) * outDist,
      Math.min(h * 0.88, anchor.y + rise),
      anchor.z + Math.sin(angle) * outDist
    );

    const bMesh = createLimbSegment(
      anchor,
      tip,
      baseRadius * 0.42,
      baseRadius * 0.14,
      Math.max(4, radialSegs - 1),
      barkMat,
      rng,
      `Branch_Limb_${b + 1}`
    );
    group.add(bMesh);
    branchTips.push(tip);

    // Extra secondary twigs when bare in winter or hero detail
    if (palette.bareBranchWinter || params.detailLevel === DetailLevel.Hero) {
      for (let tw = 0; tw < 2; tw++) {
        const subA = angle + (tw === 0 ? -0.55 : 0.55) + randRange(rng, -0.15, 0.15);
        const subOut = h * randRange(rng, 0.08, 0.15) * spread;
        const subTip = new THREE.Vector3(
          tip.x + Math.cos(subA) * subOut,
          Math.min(h * 0.96, tip.y + h * randRange(rng, 0.07, 0.14)),
          tip.z + Math.sin(subA) * subOut
        );
        const twigMesh = createLimbSegment(
          tip,
          subTip,
          baseRadius * 0.14,
          baseRadius * 0.055,
          4,
          barkMat,
          rng,
          `Branch_Twig_${b + 1}_${tw + 1}`
        );
        group.add(twigMesh);
        if (palette.bareBranchWinter) {
          branchTips.push(subTip);
        }
      }
    }
  }

  // Banyan hanging aerial roots (氣根)
  if (profile.hasAerialRoots && params.detailLevel >= DetailLevel.Game) {
    const rootCount = params.detailLevel === DetailLevel.Hero ? 4 : 3;
    for (let ar = 0; ar < rootCount; ar++) {
      const tip = branchTips[1 + (ar % Math.max(1, branchTips.length - 1))];
      const startPt = new THREE.Vector3(
        tip.x * 0.72,
        tip.y * 0.88,
        tip.z * 0.72
      );
      const endPt = new THREE.Vector3(
        startPt.x + randRange(rng, -0.15, 0.15),
        0.02,
        startPt.z + randRange(rng, -0.15, 0.15)
      );
      const aerial = createLimbSegment(
        startPt,
        endPt,
        baseRadius * 0.14,
        baseRadius * 0.1,
        4,
        barkMat,
        rng,
        `Banyan_AerialRoot_${ar + 1}`
      );
      group.add(aerial);
    }
  }

  // Winter bare deciduous mode (LAI ~ 0 in Taipei PDF)
  if (palette.bareBranchWinter) {
    if (palette.accentClusterRatio && palette.accentClusterRatio > 0) {
      addAccentClusters(
        group,
        branchTips,
        h,
        spread,
        palette.accentClusterRatio,
        icoDetail,
        foliageMats.accentMat,
        rng
      );
    }
    return;
  }

  const isSparseWinter = Boolean(palette.sparseFoliage);
  const clusterCount = isSparseWinter
    ? Math.max(3, branchTips.length)
    : params.detailLevel === DetailLevel.UltraLow
      ? 5
      : params.detailLevel === DetailLevel.Game
        ? 8
        : 10;

  for (let c = 0; c < clusterCount; c++) {
    const tip = branchTips[c % branchTips.length];
    const isCrownApex = c === 0;
    const radiusScale = isSparseWinter ? 0.56 : 1.0;
    const r =
      h *
      (isCrownApex ? randRange(rng, 0.21, 0.26) : randRange(rng, 0.13, 0.2)) *
      Math.sqrt(spread) *
      radiusScale;

    const raw = new THREE.IcosahedronGeometry(r, icoDetail);
    const geom = facetizeGeometry(raw, r * 0.15, rng);
    const mat = foliageMats.mainMats[c % foliageMats.mainMats.length];
    const cluster = new THREE.Mesh(geom, mat);
    cluster.name = `Canopy_Cluster_${c + 1}`;

    const offsetR = isCrownApex ? 0 : randRange(rng, 0.0, r * 0.62);
    const offsetA = randRange(rng, 0, Math.PI * 2);
    cluster.position.set(
      tip.x + Math.cos(offsetA) * offsetR,
      tip.y + (isCrownApex ? r * 0.35 : randRange(rng, -r * 0.15, r * 0.38)),
      tip.z + Math.sin(offsetA) * offsetR
    );
    cluster.scale.set(
      randRange(rng, 0.92, 1.18),
      randRange(rng, 0.78, 1.05),
      randRange(rng, 0.92, 1.18)
    );
    cluster.rotation.set(randRange(rng, -0.2, 0.2), randRange(rng, 0, Math.PI), randRange(rng, -0.2, 0.2));
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    group.add(cluster);
  }

  if (palette.accentClusterRatio && palette.accentClusterRatio > 0) {
    addAccentClusters(
      group,
      branchTips,
      h,
      spread,
      palette.accentClusterRatio,
      icoDetail,
      foliageMats.accentMat,
      rng
    );
  }
}

function buildPagodaTree(
  group: THREE.Group,
  profile: SpeciesProfile,
  palette: SeasonalPalette,
  params: TreeParams,
  foliageMats: { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial },
  barkMat: THREE.Material,
  rng: () => number
) {
  const h = params.heightM;
  const spread = profile.branchSpread * params.foliageSpread;
  const radialSegs = params.detailLevel === DetailLevel.UltraLow ? 5 : 6;
  const icoDetail = params.detailLevel === DetailLevel.Hero ? 1 : 0;

  const baseRadius = h * 0.046;
  const flareH = Math.max(0.22, h * 0.06);
  const flareMesh = new THREE.Mesh(
    facetizeGeometry(new THREE.CylinderGeometry(baseRadius * 0.95, baseRadius * 1.45, flareH, radialSegs + 1, 1), baseRadius * 0.08, rng),
    barkMat
  );
  flareMesh.name = 'Trunk_RootFlare';
  flareMesh.position.y = flareH * 0.5;
  flareMesh.castShadow = true;
  flareMesh.receiveShadow = true;
  group.add(flareMesh);

  const trunkH = h * 0.88;
  const trunkMesh = new THREE.Mesh(
    facetizeGeometry(new THREE.CylinderGeometry(baseRadius * 0.22, baseRadius, trunkH, radialSegs, 1), baseRadius * 0.04, rng),
    barkMat
  );
  trunkMesh.name = 'Trunk_Main';
  trunkMesh.position.y = flareH * 0.7 + trunkH * 0.5;
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  const tierCount = params.detailLevel === DetailLevel.UltraLow ? 3 : 4;
  const padAnchors: THREE.Vector3[] = [];

  for (let t = 0; t < tierCount; t++) {
    const progress = t / Math.max(1, tierCount - 1);
    const tierY = THREE.MathUtils.lerp(h * 0.36, h * 0.88, progress);
    const tierRadius = h * THREE.MathUtils.lerp(0.32, 0.14, progress) * spread;
    const limbsPerWhorl = t === tierCount - 1 ? 3 : 4;

    for (let b = 0; b < limbsPerWhorl; b++) {
      const angle = (b / limbsPerWhorl) * Math.PI * 2 + t * 0.6 + randRange(rng, -0.18, 0.18);
      const start = new THREE.Vector3(0, tierY - h * 0.03, 0);
      const tip = new THREE.Vector3(
        Math.cos(angle) * tierRadius * 0.85,
        tierY + h * 0.025,
        Math.sin(angle) * tierRadius * 0.85
      );
      const limb = createLimbSegment(
        start,
        tip,
        baseRadius * (0.36 - progress * 0.12),
        baseRadius * 0.12,
        4,
        barkMat,
        rng,
        `Pagoda_WhorlLimb_${t + 1}_${b + 1}`
      );
      group.add(limb);
      padAnchors.push(tip);
    }

    if (!palette.bareBranchWinter) {
      // Wide horizontal whorled shelf disc
      const discR = tierRadius * 0.92;
      const raw = new THREE.IcosahedronGeometry(discR, icoDetail);
      const geom = facetizeGeometry(raw, discR * 0.09, rng);
      const shelf = new THREE.Mesh(geom, foliageMats.mainMats[t % foliageMats.mainMats.length]);
      shelf.name = `Pagoda_Tier_${t + 1}`;
      shelf.position.set(0, tierY + h * 0.03, 0);
      shelf.scale.set(1.15, 0.28, 1.15);
      shelf.rotation.y = t * 0.7;
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      group.add(shelf);
    }
  }

  if (!palette.bareBranchWinter && palette.accentClusterRatio && palette.accentClusterRatio > 0) {
    addAccentClusters(group, padAnchors, h, spread, palette.accentClusterRatio, icoDetail, foliageMats.accentMat, rng);
  }
}

function buildConiferTree(
  group: THREE.Group,
  profile: SpeciesProfile,
  palette: SeasonalPalette,
  params: TreeParams,
  foliageMats: { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial },
  barkMat: THREE.Material,
  rng: () => number
) {
  const h = params.heightM;
  const spread = profile.branchSpread * params.foliageSpread;
  const radialSegs = params.detailLevel === DetailLevel.UltraLow ? 6 : params.detailLevel === DetailLevel.Game ? 7 : 8;

  const baseRadius = h * 0.044;
  const trunkH = h * 0.72;
  const flareH = Math.max(0.2, h * 0.055);
  const flareRaw = new THREE.CylinderGeometry(baseRadius * 0.95, baseRadius * 1.4, flareH, radialSegs, 1);
  const flareMesh = new THREE.Mesh(facetizeGeometry(flareRaw, baseRadius * 0.08, rng), barkMat);
  flareMesh.name = 'Trunk_RootFlare';
  flareMesh.position.y = flareH * 0.5;
  flareMesh.castShadow = true;
  flareMesh.receiveShadow = true;
  group.add(flareMesh);

  const trunkRaw = new THREE.CylinderGeometry(baseRadius * 0.25, baseRadius, trunkH, radialSegs, 1);
  const trunkMesh = new THREE.Mesh(facetizeGeometry(trunkRaw, baseRadius * 0.05, rng), barkMat);
  trunkMesh.name = 'Trunk_Main';
  trunkMesh.position.y = flareH * 0.7 + trunkH * 0.5;
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  const tierCount = params.detailLevel === DetailLevel.UltraLow ? 3 : params.detailLevel === DetailLevel.Game ? 4 : 5;
  const startY = h * 0.24;
  const spanY = h - startY;

  for (let i = 0; i < tierCount; i++) {
    const progress = i / Math.max(1, tierCount - 1);
    const isTop = i === tierCount - 1;
    const tierH = (spanY / tierCount) * (isTop ? 1.35 : 1.48);
    const bottomR = h * THREE.MathUtils.lerp(0.27, 0.11, progress) * spread;
    const topR = isTop ? 0.01 : bottomR * 0.22;

    const raw = new THREE.CylinderGeometry(topR, bottomR, tierH, radialSegs, 1, false);
    const pos = raw.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const vy = pos.getY(v);
      if (vy < 0) {
        const vx = pos.getX(v);
        const vz = pos.getZ(v);
        const radialScale = 1 + (rng() - 0.5) * 0.16;
        pos.setXYZ(v, vx * radialScale, vy + (rng() - 0.5) * tierH * 0.08, vz * radialScale);
      }
    }
    pos.needsUpdate = true;

    const geom = facetizeGeometry(raw, bottomR * 0.03, rng);
    const mat = foliageMats.mainMats[i % foliageMats.mainMats.length];
    const cone = new THREE.Mesh(geom, mat);
    cone.name = `Conifer_Tier_${i + 1}`;
    const tierCenterY = startY + progress * (spanY * 0.72) + tierH * 0.48;
    cone.position.set(
      (rng() - 0.5) * h * 0.012,
      tierCenterY,
      (rng() - 0.5) * h * 0.012
    );
    cone.rotation.y = (i * Math.PI) / radialSegs + randRange(rng, -0.15, 0.15);
    cone.castShadow = true;
    cone.receiveShadow = true;
    group.add(cone);

    if (palette.snowCap > 0.5 && !isTop) {
      const underRaw = new THREE.CylinderGeometry(topR * 0.9, bottomR * 0.94, tierH * 0.45, radialSegs, 1);
      const under = new THREE.Mesh(facetizeGeometry(underRaw, 0, rng), foliageMats.accentMat);
      under.name = `Conifer_UnderBough_${i + 1}`;
      under.position.set(cone.position.x, tierCenterY - tierH * 0.31, cone.position.z);
      under.rotation.y = cone.rotation.y;
      under.castShadow = true;
      under.receiveShadow = true;
      group.add(under);
    }
  }
}

function buildUmbrellaTree(
  group: THREE.Group,
  profile: SpeciesProfile,
  palette: SeasonalPalette,
  params: TreeParams,
  foliageMats: { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial },
  barkMat: THREE.Material,
  rng: () => number
) {
  const h = params.heightM;
  const spread = profile.branchSpread * params.foliageSpread;
  const radialSegs = params.detailLevel === DetailLevel.UltraLow ? 5 : 6;
  const icoDetail = params.detailLevel === DetailLevel.Hero ? 1 : 0;

  const baseRadius = h * 0.048;
  const { topPoint } = buildSegmentedTrunk(
    group,
    h,
    0.56,
    baseRadius,
    profile.trunkTaper,
    profile.trunkCurvature,
    radialSegs,
    barkMat,
    rng
  );

  const limbCount = params.detailLevel === DetailLevel.UltraLow ? 3 : 4;
  const padCenters: THREE.Vector3[] = [];

  for (let i = 0; i < limbCount; i++) {
    const angle = (i / limbCount) * Math.PI * 2 + randRange(rng, -0.25, 0.25);
    const out = h * randRange(rng, 0.24, 0.34) * spread;
    const tip = new THREE.Vector3(
      topPoint.x + Math.cos(angle) * out,
      h * randRange(rng, 0.78, 0.88),
      topPoint.z + Math.sin(angle) * out
    );
    const limb = createLimbSegment(
      topPoint,
      tip,
      baseRadius * 0.42,
      baseRadius * 0.14,
      Math.max(4, radialSegs - 1),
      barkMat,
      rng,
      `Umbrella_Limb_${i + 1}`
    );
    group.add(limb);
    padCenters.push(tip);
  }

  if (palette.bareBranchWinter) {
    if (palette.accentClusterRatio && palette.accentClusterRatio > 0) {
      addAccentClusters(group, padCenters, h, spread, palette.accentClusterRatio, icoDetail, foliageMats.accentMat, rng);
    }
    return;
  }

  const totalPads = padCenters.length + 1;
  for (let p = 0; p < totalPads; p++) {
    const isCenter = p === 0;
    const center = isCenter
      ? new THREE.Vector3(topPoint.x, h * 0.88, topPoint.z)
      : padCenters[p - 1];
    const r = h * (isCenter ? 0.31 : randRange(rng, 0.18, 0.24)) * Math.sqrt(spread);
    const raw = new THREE.IcosahedronGeometry(r, icoDetail);
    const geom = facetizeGeometry(raw, r * 0.12, rng);
    const pad = new THREE.Mesh(geom, foliageMats.mainMats[p % foliageMats.mainMats.length]);
    pad.name = `Umbrella_Canopy_${p + 1}`;
    pad.position.copy(center);
    pad.scale.set(1.25, 0.42, 1.25);
    pad.rotation.y = randRange(rng, 0, Math.PI);
    pad.castShadow = true;
    pad.receiveShadow = true;
    group.add(pad);
  }

  if (palette.accentClusterRatio && palette.accentClusterRatio > 0) {
    addAccentClusters(group, padCenters, h, spread, palette.accentClusterRatio, icoDetail, foliageMats.accentMat, rng);
  }
}

function buildPalmTree(
  group: THREE.Group,
  profile: SpeciesProfile,
  params: TreeParams,
  foliageMats: { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial },
  barkMat: THREE.Material,
  rng: () => number
) {
  const h = params.heightM;
  const spread = profile.branchSpread * params.foliageSpread;
  const radialSegs = params.detailLevel === DetailLevel.UltraLow ? 5 : 6;

  const segCount = params.detailLevel === DetailLevel.UltraLow ? 5 : 7;
  const trunkTopY = h * 0.86;
  const baseRadius = h * 0.036;
  const leanDir = randRange(rng, 0, Math.PI * 2);
  const totalLean = h * 0.14 * profile.trunkCurvature;

  let prev = new THREE.Vector3(0, 0, 0);
  for (let i = 1; i <= segCount; i++) {
    const t = i / segCount;
    const prevT = (i - 1) / segCount;
    const cur = new THREE.Vector3(
      Math.cos(leanDir) * totalLean * t * t,
      trunkTopY * t,
      Math.sin(leanDir) * totalLean * t * t
    );
    const r0 = baseRadius * THREE.MathUtils.lerp(1.25, 0.48, prevT);
    const r1 = baseRadius * THREE.MathUtils.lerp(1.0, 0.44, t);
    const seg = createLimbSegment(prev, cur, r0, r1, radialSegs, barkMat, rng, `Palm_Trunk_${i}`);
    group.add(seg);
    prev = cur;
  }

  const cocoMat = new THREE.MeshStandardMaterial({
    color: '#5C3B24',
    roughness: 0.85,
    metalness: 0.0,
    flatShading: true,
  });
  for (let c = 0; c < 3; c++) {
    const a = (c / 3) * Math.PI * 2 + rng() * 0.5;
    const cr = h * 0.025;
    const cocoGeom = facetizeGeometry(new THREE.IcosahedronGeometry(cr, 0), 0, rng);
    const coco = new THREE.Mesh(cocoGeom, cocoMat);
    coco.name = `Palm_Coconut_${c + 1}`;
    coco.position.set(
      prev.x + Math.cos(a) * baseRadius * 0.7,
      prev.y - cr * 0.9,
      prev.z + Math.sin(a) * baseRadius * 0.7
    );
    coco.castShadow = true;
    group.add(coco);
  }

  const frondCount = params.detailLevel === DetailLevel.UltraLow ? 6 : params.detailLevel === DetailLevel.Game ? 8 : 9;
  const frondLen = h * 0.34 * spread;

  for (let f = 0; f < frondCount; f++) {
    const angle = (f / frondCount) * Math.PI * 2 + randRange(rng, -0.15, 0.15);
    const droop = f % 2 === 0 ? 0.36 : 0.18;

    const steps = 4;
    const positions: number[] = [];
    const indices: number[] = [];

    const wProfile = [0.06, 0.22, 0.18, 0.09, 0.0];
    for (let s = 0; s <= steps; s++) {
      const u = s / steps;
      const dist = u * frondLen;
      const archY = Math.sin(u * Math.PI * 0.72) * frondLen * 0.22 - u * u * frondLen * droop;
      const hw = frondLen * wProfile[s];
      positions.push(0, archY, dist);
      positions.push(-hw, archY - hw * 0.25, dist);
      positions.push(hw, archY - hw * 0.25, dist);
    }

    for (let s = 0; s < steps; s++) {
      const b0 = s * 3;
      const b1 = (s + 1) * 3;
      indices.push(b0, b1, b1 + 1);
      indices.push(b0, b1 + 1, b0 + 1);
      indices.push(b0, b1 + 2, b1);
      indices.push(b0, b0 + 2, b1 + 2);
    }

    const raw = new THREE.BufferGeometry();
    raw.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    raw.setIndex(indices);
    const frondGeom = raw.toNonIndexed();
    raw.dispose();
    frondGeom.computeVertexNormals();

    const mat = foliageMats.mainMats[f % foliageMats.mainMats.length].clone();
    mat.side = THREE.DoubleSide;
    const frond = new THREE.Mesh(frondGeom, mat);
    frond.name = `Palm_Frond_${f + 1}`;
    frond.position.copy(prev);
    frond.rotation.y = angle;
    frond.rotation.x = randRange(rng, -0.12, 0.12);
    frond.castShadow = true;
    frond.receiveShadow = true;
    group.add(frond);
  }
}

function buildPoplarTree(
  group: THREE.Group,
  profile: SpeciesProfile,
  palette: SeasonalPalette,
  params: TreeParams,
  foliageMats: { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial },
  barkMat: THREE.Material,
  rng: () => number
) {
  const h = params.heightM;
  const spread = profile.branchSpread * params.foliageSpread;
  const radialSegs = params.detailLevel === DetailLevel.UltraLow ? 5 : 6;
  const icoDetail = params.detailLevel === DetailLevel.Hero ? 1 : 0;

  const baseRadius = h * 0.036;
  const { topPoint } = buildSegmentedTrunk(
    group,
    h,
    0.72,
    baseRadius,
    0.28,
    0.08,
    radialSegs,
    barkMat,
    rng
  );

  if (palette.bareBranchWinter) return;

  const tuftCount = palette.sparseFoliage ? 4 : params.detailLevel === DetailLevel.UltraLow ? 5 : 7;
  const tuftCenters: THREE.Vector3[] = [];
  for (let i = 0; i < tuftCount; i++) {
    const t = i / Math.max(1, tuftCount - 1);
    const y = THREE.MathUtils.lerp(h * 0.28, h * 0.88, t);
    const r = h * Math.sin(0.25 + t * Math.PI * 0.72) * 0.15 * spread;
    const raw = new THREE.IcosahedronGeometry(r, icoDetail);
    const geom = facetizeGeometry(raw, r * 0.14, rng);
    const tuft = new THREE.Mesh(geom, foliageMats.mainMats[i % foliageMats.mainMats.length]);
    tuft.name = `Poplar_Tuft_${i + 1}`;
    const angle = i * 2.2 + rng();
    tuft.position.set(
      topPoint.x * t + Math.cos(angle) * r * 0.2,
      y,
      topPoint.z * t + Math.sin(angle) * r * 0.2
    );
    tuft.scale.set(0.82, 1.38, 0.82);
    tuft.castShadow = true;
    tuft.receiveShadow = true;
    group.add(tuft);
    tuftCenters.push(tuft.position.clone());
  }

  if (palette.accentClusterRatio && palette.accentClusterRatio > 0) {
    addAccentClusters(group, tuftCenters, h, spread, palette.accentClusterRatio, icoDetail, foliageMats.accentMat, rng);
  }
}

function buildWeepingTree(
  group: THREE.Group,
  profile: SpeciesProfile,
  palette: SeasonalPalette,
  params: TreeParams,
  foliageMats: { mainMats: THREE.MeshStandardMaterial[]; accentMat: THREE.MeshStandardMaterial },
  barkMat: THREE.Material,
  rng: () => number
) {
  const h = params.heightM;
  const spread = profile.branchSpread * params.foliageSpread;
  const radialSegs = params.detailLevel === DetailLevel.UltraLow ? 5 : 6;
  const icoDetail = params.detailLevel === DetailLevel.Hero ? 1 : 0;

  const baseRadius = h * 0.052;
  const { topPoint } = buildSegmentedTrunk(
    group,
    h,
    0.45,
    baseRadius,
    profile.trunkTaper,
    profile.trunkCurvature,
    radialSegs,
    barkMat,
    rng
  );

  const boughCount = params.detailLevel === DetailLevel.UltraLow ? 4 : 5;
  const curtainTips: THREE.Vector3[] = [new THREE.Vector3(topPoint.x, h * 0.84, topPoint.z)];

  for (let i = 0; i < boughCount; i++) {
    const a = (i / boughCount) * Math.PI * 2 + randRange(rng, -0.3, 0.3);
    const out = h * randRange(rng, 0.22, 0.32) * spread;
    const tip = new THREE.Vector3(
      topPoint.x + Math.cos(a) * out,
      h * randRange(rng, 0.65, 0.78),
      topPoint.z + Math.sin(a) * out
    );
    const bough = createLimbSegment(
      topPoint,
      tip,
      baseRadius * 0.4,
      baseRadius * 0.14,
      Math.max(4, radialSegs - 1),
      barkMat,
      rng,
      `Willow_Bough_${i + 1}`
    );
    group.add(bough);
    curtainTips.push(tip);
  }

  if (palette.bareBranchWinter) {
    for (let i = 1; i < curtainTips.length; i++) {
      const tip = curtainTips[i];
      const droopTip = new THREE.Vector3(tip.x * 1.05, tip.y - h * 0.22, tip.z * 1.05);
      group.add(
        createLimbSegment(tip, droopTip, baseRadius * 0.1, baseRadius * 0.04, 4, barkMat, rng, `Winter_Twig_${i}`)
      );
    }
    return;
  }

  const curtainCount = palette.sparseFoliage ? 5 : params.detailLevel === DetailLevel.UltraLow ? 6 : 9;
  for (let c = 0; c < curtainCount; c++) {
    const tip = curtainTips[c % curtainTips.length];
    const r = h * (c === 0 ? 0.22 : randRange(rng, 0.13, 0.19)) * Math.sqrt(spread);
    const raw = new THREE.IcosahedronGeometry(r, icoDetail);
    const geom = facetizeGeometry(raw, r * 0.13, rng);
    const curtain = new THREE.Mesh(geom, foliageMats.mainMats[c % foliageMats.mainMats.length]);
    curtain.name = `Willow_Curtain_${c + 1}`;
    curtain.position.set(
      tip.x + (rng() - 0.5) * r * 0.4,
      tip.y - (c === 0 ? 0 : r * 0.65),
      tip.z + (rng() - 0.5) * r * 0.4
    );
    curtain.scale.set(0.88, c === 0 ? 0.85 : 1.75, 0.88);
    curtain.castShadow = true;
    curtain.receiveShadow = true;
    group.add(curtain);
  }
}

/**
 * Generates a single grounded low-poly tree THREE.Group with bottom-center pivot
 * at (0, 0, 0) and exact real-world height matching params.heightM.
 */
export function buildSingleTree(
  params: TreeParams,
  profile: SpeciesProfile,
  seedOffset = 0,
  heightMultiplier = 1.0,
  variantHueShift = 0,
  treeName = 'LowPolyTree'
): THREE.Group {
  const effectiveSeed = (params.seed ^ hashString(params.speciesQuery) ^ (seedOffset * 2654435761)) >>> 0;
  const rng = createRng(effectiveSeed);
  const palette = getActivePalette(profile, params);

  const group = new THREE.Group();
  group.name = treeName;

  const targetHeight = Math.max(1.2, params.heightM * heightMultiplier);
  const ageMaturity = THREE.MathUtils.clamp((params.year - 1) / 18, 0, 1);
  const maturitySpreadMult = THREE.MathUtils.lerp(0.76, 1.06, ageMaturity);
  const localProfile: SpeciesProfile =
    params.year < 10 && profile.hasAerialRoots
      ? { ...profile, hasAerialRoots: false }
      : profile;
  const localParams: TreeParams = {
    ...params,
    heightM: targetHeight,
    foliageSpread: params.foliageSpread * maturitySpreadMult,
  };

  const foliageMats = buildFoliageMaterials(palette, params.colorVariation, rng, variantHueShift);
  const barkMat = buildBarkMaterial(palette.bark, params.colorVariation, rng);

  switch (localProfile.archetype) {
    case TreeArchetype.Conifer:
      buildConiferTree(group, localProfile, palette, localParams, foliageMats, barkMat, rng);
      break;
    case TreeArchetype.Pagoda:
      buildPagodaTree(group, localProfile, palette, localParams, foliageMats, barkMat, rng);
      break;
    case TreeArchetype.Umbrella:
      buildUmbrellaTree(group, localProfile, palette, localParams, foliageMats, barkMat, rng);
      break;
    case TreeArchetype.Palm:
      buildPalmTree(group, localProfile, localParams, foliageMats, barkMat, rng);
      break;
    case TreeArchetype.Poplar:
      buildPoplarTree(group, localProfile, palette, localParams, foliageMats, barkMat, rng);
      break;
    case TreeArchetype.Weeping:
      buildWeepingTree(group, localProfile, palette, localParams, foliageMats, barkMat, rng);
      break;
    case TreeArchetype.Broadleaf:
    default:
      buildBroadleafTree(group, localProfile, palette, localParams, foliageMats, barkMat, rng);
      break;
  }

  // Calibrate exact target height and snap bottom-center pivot strictly to y = 0
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const currentH = Math.max(0.001, box.max.y - box.min.y);
  const scaleFactor = targetHeight / currentH;

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.position.multiplyScalar(scaleFactor);
      obj.scale.multiplyScalar(scaleFactor);
    }
  });

  group.updateMatrixWorld(true);
  const finalBox = new THREE.Box3().setFromObject(group);
  const centerX = (finalBox.min.x + finalBox.max.x) * 0.5;
  const centerZ = (finalBox.min.z + finalBox.max.z) * 0.5;
  const minY = finalBox.min.y;

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.position.x -= centerX;
      obj.position.y -= minY;
      obj.position.z -= centerZ;
    }
  });

  return group;
}

/**
 * Generates either a single hero specimen or a 7-tree variation grove pack.
 */
export function buildTreeSceneAsset(params: TreeParams): {
  root: THREE.Group;
  profile: SpeciesProfile;
  stats: MeshStats;
  treeAnchors: Array<{ x: number; z: number; radius: number }>;
} {
  const profile = resolveSpecies(params.speciesQuery);
  const root = new THREE.Group();
  root.name = `${profile.displayName.replace(/\s+/g, '_')}_${params.season}`;

  const treeAnchors: Array<{ x: number; z: number; radius: number }> = [];

  if (params.viewMode === ViewMode.Specimen) {
    const hero = buildSingleTree(params, profile, 0, 1.0, 0, `${profile.displayName.replace(/\s+/g, '_')}_Hero`);
    root.add(hero);
    const box = new THREE.Box3().setFromObject(hero);
    const size = new THREE.Vector3();
    box.getSize(size);
    treeAnchors.push({ x: 0, z: 0, radius: Math.max(size.x, size.z) * 0.55 });
  } else {
    const ringCount = 6;
    const heightMultipliers = [1.05, 0.78, 1.18, 0.86, 0.72, 0.96, 1.12];
    const baseSpacing = Math.max(3.6, params.heightM * 0.58 * params.foliageSpread);

    const centerTree = buildSingleTree(params, profile, 0, heightMultipliers[0], 0, 'Variant_01_Hero');
    root.add(centerTree);
    const cBox = new THREE.Box3().setFromObject(centerTree);
    const cSize = new THREE.Vector3();
    cBox.getSize(cSize);
    treeAnchors.push({ x: 0, z: 0, radius: Math.max(cSize.x, cSize.z) * 0.52 });

    const rng = createRng(params.seed ^ 0x9e3779b9);
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2 + 0.35 + (rng() - 0.5) * 0.22;
      const dist = baseSpacing * (i % 2 === 0 ? 1.0 : 1.18);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const hueShift = (rng() - 0.5) * 0.08 * (0.35 + params.colorVariation * 0.9);
      const tree = buildSingleTree(
        params,
        profile,
        i + 1,
        heightMultipliers[i + 1],
        hueShift,
        `Variant_0${i + 2}`
      );
      tree.position.set(x, 0, z);
      tree.rotation.y = randRange(rng, 0, Math.PI * 2);
      root.add(tree);

      const tBox = new THREE.Box3().setFromObject(tree);
      const tSize = new THREE.Vector3();
      tBox.getSize(tSize);
      treeAnchors.push({ x, z, radius: Math.max(tSize.x, tSize.z) * 0.52 });
    }
  }

  root.updateMatrixWorld(true);
  const fullBox = new THREE.Box3().setFromObject(root);
  const fullSize = new THREE.Vector3();
  fullBox.getSize(fullSize);

  let triangles = 0;
  let vertices = 0;
  let parts = 0;

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      parts += 1;
      const pos = obj.geometry.attributes.position;
      if (pos) {
        vertices += pos.count;
        triangles += obj.geometry.index ? obj.geometry.index.count / 3 : pos.count / 3;
      }
    }
  });

  return {
    root,
    profile,
    treeAnchors,
    stats: {
      triangles: Math.round(triangles),
      vertices,
      parts,
      heightM: Number(fullSize.y.toFixed(2)),
      widthM: Number(Math.max(fullSize.x, fullSize.z).toFixed(2)),
      treeCount: treeAnchors.length,
    },
  };
}

export function disposeTreeGroup(group: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) geometries.add(obj.geometry);
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => materials.add(m));
      } else if (obj.material) {
        materials.add(obj.material);
      }
    }
  });

  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
