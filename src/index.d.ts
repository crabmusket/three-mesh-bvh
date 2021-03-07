export type Options = {
    strategy: Strategies;
    maxDepth: number;
    maxLeafTris: number;
    verbose: boolean;
    lazyGeneration: boolean;
}

type Strategies = typeof CENTER | typeof AVERAGE | typeof SAH;

type HasBoundsTree = {boundsTree?: MeshBVH | null}

export class MeshBVH {}
export class Visualizer {}
export class MeshBVHVisualizer {}
export class MeshBVHDebug {}

export function computeBoundsTree( this: HasBoundsTree, options?: Partial<Options> ): MeshBVH
export function disposeBoundsTree( this: HasBoundsTree ): void
export function acceleratedRaycast(): unknown
export function estimateMemoryInBytes(): unknown
export function getBVHExtremes(): unknown

export const CENTER: 0;
export const AVERAGE: 1;
export const SAH: 2;

export const NOT_INTERSECTED: 0;
export const INTERSECTED: 1;
export const CONTAINED: 2;

declare module 'three/src/core/BufferGeometry' {
	interface BufferGeometry {
		boundsTree?: MeshBVH | null;
		computeBoundsTree: typeof computeBoundsTree;
		disposeBoundsTree: typeof disposeBoundsTree;
	}
}

declare module 'three/src/core/Raycaster' {
	interface Raycaster {
		firstHitOnly?: boolean;
	}
}
