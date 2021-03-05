export function computeBoundsTree(): any
export function disposeBoundsTree(): any
export function acceleratedRaycast(): any

export const CENTER: 0;
export const AVERAGE: 1;
export const SAH: 2;

export const NOT_INTERSECTED: 0;
export const INTERSECTED: 1;
export const CONTAINED: 2;

declare module 'three/src/core/BufferGeometry' {
	interface BufferGeometry {
		computeBoundsTree(): any;
		disposeBoundsTree(): any;
	}
}

declare module 'three/src/core/Raycaster' {
	interface Raycaster {
		firstHitOnly?: boolean;
	}
}
