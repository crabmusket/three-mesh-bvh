export function computeBoundsTree(): any
export function disposeBoundsTree(): any
export function acceleratedRaycast(): any

declare module 'three/src/core/BufferGeometry' {
	interface BufferGeometry {
		computeBoundsTree(): any;
		disposeBoundsTree(): any;
	}
}

declare module 'three/src/core/Raycaster' {
	interface Raycaster {
		firstHitOnly: undefined | boolean;
	}
}
