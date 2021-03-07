export class MeshBVH {}
export class Visualizer {}
export class MeshBVHVisualizer {}
export class MeshBVHDebug {}

export function computeBoundsTree(): unknown
export function disposeBoundsTree(): unknown
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
		computeBoundsTree: typeof computeBoundsTree;
		disposeBoundsTree: typeof disposeBoundsTree;
	}
}

declare module 'three/src/core/Raycaster' {
	interface Raycaster {
		firstHitOnly?: boolean;
	}
}
