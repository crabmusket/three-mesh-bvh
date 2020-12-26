
import { Box3, Vector3, Mesh, Matrix4 } from 'three';
import { intersectTris, intersectClosestTri } from './Utils/RayIntersectTriUtlities.js';
import { arrayToBox } from './Utils/ArrayBoxUtilities.js';
import { OrientedBox } from './Utils/OrientedBox.js';
import { setTriangle } from './Utils/TriangleUtils.js';
import { SeparatingAxisTriangle } from './Utils/SeparatingAxisTriangle.js';
import { CONTAINED } from './Constants.js';

const boundingBox = new Box3();
const boxIntersection = new Vector3();
const xyzFields = [ 'x', 'y', 'z' ];

function intersectRay( node, ray, target ) {

	arrayToBox( node.boundingData, boundingBox );

	return ray.intersectBox( boundingBox, target );

}

export function raycast( node, mesh, raycaster, ray, intersects ) {

	if ( node.continueGeneration ) {

		node.continueGeneration();

	}

	const isLeaf = ! ! node.count;
	if ( isLeaf ) {

		intersectTris( mesh, mesh.geometry, raycaster, ray, node.offset, node.count, intersects );

	} else {

		if ( intersectRay( node.left, ray, boxIntersection ) ) {

			raycast( node.left, mesh, raycaster, ray, intersects );

		}

		if ( intersectRay( node.right, ray, boxIntersection ) ) {

			raycast( node.right, mesh, raycaster, ray, intersects );

		}

	}

}

export function raycastFirst( node, mesh, raycaster, ray ) {

	if ( node.continueGeneration ) {

		node.continueGeneration();

	}

	const isLeaf = ! ! node.count;
	if ( isLeaf ) {

		return intersectClosestTri( mesh, mesh.geometry, raycaster, ray, node.offset, node.count );

	} else {


		// consider the position of the split plane with respect to the oncoming ray; whichever direction
		// the ray is coming from, look for an intersection among that side of the tree first
		const splitAxis = node.splitAxis;
		const xyzAxis = xyzFields[ splitAxis ];
		const rayDir = ray.direction[ xyzAxis ];
		const leftToRight = rayDir >= 0;

		// c1 is the child to check first
		let c1, c2;
		if ( leftToRight ) {

			c1 = node.left;
			c2 = node.right;

		} else {

			c1 = node.right;
			c2 = node.left;

		}

		const c1Intersection = intersectRay( c1, ray, boxIntersection );
		const c1Result = c1Intersection ? raycastFirst( c1, mesh, raycaster, ray ) : null;

		// if we got an intersection in the first node and it's closer than the second node's bounding
		// box, we don't need to consider the second node because it couldn't possibly be a better result
		if ( c1Result ) {

			// check only along the split axis
			const rayOrig = ray.origin[ xyzAxis ];
			const toPoint = rayOrig - c1Result.point[ xyzAxis ];
			const toChild1 = rayOrig - c2.boundingData[ splitAxis ];
			const toChild2 = rayOrig - c2.boundingData[ splitAxis + 3 ];

			const toPointSq = toPoint * toPoint;
			if ( toPointSq <= toChild1 * toChild1 && toPointSq <= toChild2 * toChild2 ) {

				return c1Result;

			}

		}

		// either there was no intersection in the first node, or there could still be a closer
		// intersection in the second, so check the second node and then take the better of the two
		const c2Intersection = intersectRay( c2, ray, boxIntersection );
		const c2Result = c2Intersection ? raycastFirst( c2, mesh, raycaster, ray ) : null;

		if ( c1Result && c2Result ) {

			return c1Result.distance <= c2Result.distance ? c1Result : c2Result;

		} else {

			return c1Result || c2Result || null;

		}

	}

}

export const shapecast = ( function () {

	const _triangle = new SeparatingAxisTriangle();
	const _cachedBox1 = new Box3();
	const _cachedBox2 = new Box3();

	function iterateOverTriangles(
		offset,
		count,
		geometry,
		intersectsTriangleFunc,
		contained,
		depth,
		triangle
	) {

		const index = geometry.index;
		const pos = geometry.attributes.position;
		for ( let i = offset * 3, l = ( count + offset ) * 3; i < l; i += 3 ) {

			setTriangle( triangle, i, index, pos );
			triangle.needsUpdate = true;

			if ( intersectsTriangleFunc( triangle, i, i + 1, i + 2, contained, depth ) ) {

				return true;

			}

		}

		return false;

	}

	return function shapecast(
		node,
		mesh,
		intersectsBoundsFunc,
		intersectsTriangleFunc = null,
		nodeScoreFunc = null,
		depth = 0,
		triangle = _triangle,
		cachedBox1 = _cachedBox1,
		cachedBox2 = _cachedBox2
	) {

		// Define these inside the function so it has access to the local variables needed
		// when converting to the buffer equivalents
		function getLeftOffset( node ) {

			if ( node.continueGeneration ) {

				node.continueGeneration();

			}

			while ( ! node.count ) {

				node = node.left;
				if ( /* skip */ node.continueGeneration ) {

					node.continueGeneration();

				}

			}

			return node.offset;

		}

		function getRightEndOffset( node ) {

			if ( node.continueGeneration ) {

				node.continueGeneration();

			}

			while ( ! node.count ) {

				node = node.right;
				if ( /* skip */ node.continueGeneration ) {

					node.continueGeneration();

				}

			}

			return node.offset + node.count;

		}

		if ( node.continueGeneration ) {

			node.continueGeneration();

		}

		const isLeaf = ! ! node.count;
		if ( isLeaf && intersectsTriangleFunc ) {

			const geometry = mesh.geometry;
			const offset = node.offset;
			const count = node.count;
			return iterateOverTriangles( offset, count, geometry, intersectsTriangleFunc, false, depth, triangle );

		} else {

			const left = node.left;
			const right = node.right;
			let c1 = left;
			let c2 = right;

			let score1, score2;
			let box1, box2;
			if ( nodeScoreFunc ) {

				box1 = cachedBox1;
				box2 = cachedBox2;

				arrayToBox( c1.boundingData, box1 );
				arrayToBox( c2.boundingData, box2 );

				score1 = nodeScoreFunc( box1 );
				score2 = nodeScoreFunc( box2 );

				if ( score2 < score1 ) {

					c1 = right;
					c2 = left;

					const temp = score1;
					score1 = score2;
					score2 = temp;

					box1 = box2;
					// box2 is always set before use below

				}

			}

			// Check box 1 intersection
			if ( ! box1 ) {

				box1 = cachedBox1;
				arrayToBox( c1.boundingData, box1 );

			}

			const isC1Leaf = ! ! c1.count;
			const c1Intersection = intersectsBoundsFunc( box1, isC1Leaf, score1, depth + 1 );

			let c1StopTraversal;
			if ( c1Intersection === CONTAINED ) {

				const geometry = mesh.geometry;
				const offset = getLeftOffset( c1 );
				const end = getRightEndOffset( c1 );
				const count = end - offset;

				c1StopTraversal = iterateOverTriangles( offset, count, geometry, intersectsTriangleFunc, true, depth + 1, triangle );

			} else {

				c1StopTraversal =
					c1Intersection &&
					shapecast(
						c1,
						mesh,
						intersectsBoundsFunc,
						intersectsTriangleFunc,
						nodeScoreFunc,
						depth + 1,
						triangle,
						cachedBox1,
						cachedBox2
					);

			}

			if ( c1StopTraversal ) return true;

			// Check box 2 intersection
			// cached box2 will have been overwritten by previous traversal
			box2 = cachedBox2;
			arrayToBox( c2.boundingData, box2 );

			const isC2Leaf = ! ! c2.count;
			const c2Intersection = intersectsBoundsFunc( box2, isC2Leaf, score2, depth + 1 );

			let c2StopTraversal;
			if ( c2Intersection === CONTAINED ) {

				const geometry = mesh.geometry;
				const offset = getLeftOffset( c2 );
				const end = getRightEndOffset( c2 );
				const count = end - offset;

				c2StopTraversal = iterateOverTriangles( offset, count, geometry, intersectsTriangleFunc, true, depth + 1, triangle );

			} else {

				c2StopTraversal =
					c2Intersection &&
					shapecast(
						c2,
						mesh,
						intersectsBoundsFunc,
						intersectsTriangleFunc,
						nodeScoreFunc,
						depth + 1,
						triangle,
						cachedBox1,
						cachedBox2
					);

			}

			if ( c2StopTraversal ) return true;

			return false;

		}

	};

} )();

export const intersectsGeometry = ( function () {

	const cachedMesh = new Mesh();
	const bvhToGeometry = new Matrix4();
	const geometryObb = new OrientedBox();

	const _triangle = new SeparatingAxisTriangle();
	const _triangle2 = new SeparatingAxisTriangle();
	const _cachedBox1 = new OrientedBox();
	const _cachedBox2 = new OrientedBox();

	return function intersectsGeometry( node, mesh, geometry, geometryToBvh ) {

		if ( node.continueGeneration ) {

			node.continueGeneration();

		}

		if ( ! geometry.boundingBox ) {

			geometry.computeBoundingBox();

		}

		const index = geometry.index;
		const pos = geometry.attributes.position;

		cachedMesh.geometry = geometry;
		bvhToGeometry.copy( geometryToBvh ).invert();
		geometryObb.set( geometry.boundingBox.min, geometry.boundingBox.max, geometryToBvh );
		geometryObb.update();

		const result =
			shapecast(
				node,
				mesh,
				box => geometryObb.intersectsBox( box ),
				tri => {

					tri.a.applyMatrix4( bvhToGeometry );
					tri.b.applyMatrix4( bvhToGeometry );
					tri.c.applyMatrix4( bvhToGeometry );
					tri.update();

					if ( mesh.geometry.boundsTree ) {

						return cachedMesh
							.geometry
							.boundsTree
							.shapecast(
								cachedMesh,
								box => box.intersectsTriangle( tri ),
								tri2 => tri2.intersectsTriangle( tri ),
								box => Math.min(
									box.distanceToPoint( tri.a ),
									box.distanceToPoint( tri.b ),
									box.distanceToPoint( tri.c )
								)
							);

					} else {

						for ( let i = 0, l = index.count; i < l; i += 3 ) {

							setTriangle( _triangle2, i, index, pos );
							_triangle2.update();

							if ( tri.intersectsTriangle( _triangle2 ) ) {

								return true;

							}

						}

					}

				},
				box => geometryObb.distanceToBox( box ),
				0,
				_triangle,
				_cachedBox1,
				_cachedBox2
			);

		cachedMesh.geometry = null;
		return result;

	};

} )();
