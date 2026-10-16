import * as THREE from 'three';
import { LANE_WIDTH } from '../entities/LunaCharacter';

/**
 * Procedural 90-Degree Curved Corner Mesh & Outgoing Road Preview Builder.
 * Generates smooth, solid 3D road geometry that physically curves 90° sideways (Temple Run style).
 */
export class CornerMeshBuilder {
  private static readonly TRACK_WIDTH = LANE_WIDTH * 3.4; // 7.48m

  /**
   * Generates a curved horizontal ribbon geometry along the 90-degree circular arc.
   * Winding order is strictly configured so face normals point directly UP (+Y).
   */
  public static createCurvedRibbonGeometry(
    radius: number,
    uMin: number,
    uMax: number,
    y: number,
    isRight: boolean,
    segments = 36
  ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const sign = isRight ? 1 : -1;

    for (let j = 0; j <= segments; j++) {
      const alpha = (Math.PI / 2) * (j / segments);
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);

      for (const u of [uMin, uMax]) {
        const r = isRight ? (radius - u) : (radius + u);
        const x = sign * (radius - r * cosA);
        const z = -r * sinA;
        positions.push(x, y, z);
        uvs.push((u - uMin) / Math.max(0.001, uMax - uMin), (j / segments) * 6.0);
      }
    }

    for (let j = 0; j < segments; j++) {
      const row1 = j * 2;
      const row2 = (j + 1) * 2;
      // Winding order guaranteeing normal points UP (+Y) for both left and right turns
      indices.push(row1, row1 + 1, row2);
      indices.push(row1 + 1, row2 + 1, row2);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates a curved vertical wall geometry along a circular arc at radial offset `u`.
   */
  public static createCurvedVerticalWall(
    radius: number,
    u: number,
    yBottom: number,
    yTop: number,
    isRight: boolean,
    facingOutward: boolean,
    segments = 36
  ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const sign = isRight ? 1 : -1;

    for (let j = 0; j <= segments; j++) {
      const alpha = (Math.PI / 2) * (j / segments);
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);
      const r = isRight ? (radius - u) : (radius + u);
      const x = sign * (radius - r * cosA);
      const z = -r * sinA;

      positions.push(x, yBottom, z);
      uvs.push(0, (j / segments) * 4.0);
      positions.push(x, yTop, z);
      uvs.push(1, (j / segments) * 4.0);
    }

    for (let j = 0; j < segments; j++) {
      const row1 = j * 2;
      const row2 = (j + 1) * 2;
      if (facingOutward) {
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);
      } else {
        indices.push(row1, row2, row1 + 1);
        indices.push(row1 + 1, row2, row2 + 1);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Builds the complete 90-degree curved corner road group.
   * Includes:
   * - Curved stone pavement surface (at Y = 0.0)
   * - 2 curved glowing cyan lane divider lines (at Y = 0.015)
   * - 3D solid curved stone curbs with top face, inner side wall, and outer wall
   * - Curved glowing guide strips
   * - Deep foundation under-slab and side skirts
   * - Luminous crystal milestone beacons along corner edges
   */
  public static createCornerGroup(
    radius: number,
    isRight: boolean,
    roadMat: THREE.Material,
    laneBorderMat: THREE.Material,
    pillarSideMat: THREE.Material,
    lanternMat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const halfW = this.TRACK_WIDTH / 2;

    // Clone materials with DoubleSide to guarantee zero culling from any camera angle
    const roadMatDbl = roadMat.clone();
    roadMatDbl.side = THREE.DoubleSide;
    const laneMatDbl = laneBorderMat.clone();
    laneMatDbl.side = THREE.DoubleSide;
    const pillarMatDbl = pillarSideMat.clone();
    pillarMatDbl.side = THREE.DoubleSide;

    // 1. Curved Stone Road Pavement (Matching straight chunks at Y = 0.0)
    const roadGeo = this.createCurvedRibbonGeometry(radius, -halfW, halfW, 0.0, isRight, 36);
    const roadMesh = new THREE.Mesh(roadGeo, roadMatDbl);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Deep Foundation Under-slab (thick solid bedrock foundation)
    const baseGeo = this.createCurvedRibbonGeometry(radius, -halfW - 0.45, halfW + 0.45, -0.4, isRight, 36);
    const baseMesh = new THREE.Mesh(baseGeo, pillarMatDbl);
    group.add(baseMesh);

    // Left & Right Foundation Vertical Skirts (drops foundation into the deep abyss)
    const leftSkirtGeo = this.createCurvedVerticalWall(radius, -halfW - 0.45, -0.8, 0.18, isRight, true, 36);
    group.add(new THREE.Mesh(leftSkirtGeo, pillarMatDbl));

    const rightSkirtGeo = this.createCurvedVerticalWall(radius, halfW + 0.45, -0.8, 0.18, isRight, false, 36);
    group.add(new THREE.Mesh(rightSkirtGeo, pillarMatDbl));

    // 2. Curved Glowing Cyan Lane Divider Lines
    [-0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH].forEach(xCenter => {
      const lineGeo = this.createCurvedRibbonGeometry(
        radius,
        xCenter - 0.06,
        xCenter + 0.06,
        0.015,
        isRight,
        36
      );
      const lineMesh = new THREE.Mesh(lineGeo, laneMatDbl);
      group.add(lineMesh);
    });

    // 3. Solid 3D Curved Stone Curbs (Left & Right)
    // Left Curb: Top face + inner wall + outer wall
    const leftCurbTop = this.createCurvedRibbonGeometry(radius, -halfW - 0.42, -halfW - 0.04, 0.18, isRight, 36);
    group.add(new THREE.Mesh(leftCurbTop, pillarMatDbl));

    const leftCurbInner = this.createCurvedVerticalWall(radius, -halfW - 0.04, 0.0, 0.18, isRight, false, 36);
    group.add(new THREE.Mesh(leftCurbInner, pillarMatDbl));

    const leftCurbOuter = this.createCurvedVerticalWall(radius, -halfW - 0.42, -0.4, 0.18, isRight, true, 36);
    group.add(new THREE.Mesh(leftCurbOuter, pillarMatDbl));

    // Right Curb: Top face + inner wall + outer wall
    const rightCurbTop = this.createCurvedRibbonGeometry(radius, halfW + 0.04, halfW + 0.42, 0.18, isRight, 36);
    group.add(new THREE.Mesh(rightCurbTop, pillarMatDbl));

    const rightCurbInner = this.createCurvedVerticalWall(radius, halfW + 0.04, 0.0, 0.18, isRight, true, 36);
    group.add(new THREE.Mesh(rightCurbInner, pillarMatDbl));

    const rightCurbOuter = this.createCurvedVerticalWall(radius, halfW + 0.42, -0.4, 0.18, isRight, false, 36);
    group.add(new THREE.Mesh(rightCurbOuter, pillarMatDbl));

    // 4. Luminous Guide Strips along inner edges of curbs
    [-halfW - 0.04, halfW + 0.04].forEach(xEdge => {
      const guideGeo = this.createCurvedRibbonGeometry(
        radius,
        xEdge - 0.04,
        xEdge + 0.04,
        0.02,
        isRight,
        36
      );
      const guideMesh = new THREE.Mesh(guideGeo, laneMatDbl);
      group.add(guideMesh);
    });

    // 5. Crystal Milestone Beacons along the corner curve
    const beaconAngles = [0, Math.PI / 8, Math.PI / 4, (3 * Math.PI) / 8, Math.PI / 2];
    const sign = isRight ? 1 : -1;

    for (const alpha of beaconAngles) {
      const cosA = Math.cos(alpha);
      const sinA = Math.sin(alpha);

      // Outer and inner beacon positions
      for (const u of [-halfW - 0.23, halfW + 0.23]) {
        const r = isRight ? (radius - u) : (radius + u);
        const bx = sign * (radius - r * cosA);
        const bz = -r * sinA;

        const beaconGeo = new THREE.BoxGeometry(0.24, 0.45, 0.24);
        const beaconMesh = new THREE.Mesh(beaconGeo, pillarSideMat);
        beaconMesh.position.set(bx, 0.25, bz);
        group.add(beaconMesh);

        const crystalGeo = new THREE.OctahedronGeometry(0.12, 0);
        const crystalMesh = new THREE.Mesh(crystalGeo, lanternMat);
        crystalMesh.position.set(bx, 0.55, bz);
        group.add(crystalMesh);
      }
    }

    return group;
  }

  /**
   * Builds the straight road preview that extends perpendicularly from the corner exit.
   * Attached at the corner exit so the player sees the new corridor stretching sideways.
   */
  public static createOutgoingRoadPreview(
    length: number,
    roadMat: THREE.Material,
    laneBorderMat: THREE.Material,
    pillarSideMat: THREE.Material,
    lanternMat: THREE.Material
  ): THREE.Group {
    const group = new THREE.Group();
    const trackWidth = this.TRACK_WIDTH;

    // Road Slab (Top at Y = 0.0)
    const roadGeo = new THREE.BoxGeometry(trackWidth, 0.4, length);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(0, -0.2, -length / 2);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Deep under-foundation slab
    const baseGeo = new THREE.BoxGeometry(trackWidth + 0.9, 0.4, length);
    const baseMesh = new THREE.Mesh(baseGeo, pillarSideMat);
    baseMesh.position.set(0, -0.6, -length / 2);
    group.add(baseMesh);

    // Lane Lines
    [-0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH].forEach(x => {
      const lineGeo = new THREE.PlaneGeometry(0.12, length);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMesh = new THREE.Mesh(lineGeo, laneBorderMat);
      lineMesh.position.set(x, 0.015, -length / 2);
      group.add(lineMesh);
    });

    // Solid Curbs
    [-trackWidth / 2 - 0.22, trackWidth / 2 + 0.22].forEach(sideX => {
      const curbGeo = new THREE.BoxGeometry(0.38, 0.24, length);
      const curbMesh = new THREE.Mesh(curbGeo, pillarSideMat);
      curbMesh.position.set(sideX, 0.08, -length / 2);
      group.add(curbMesh);

      const guideGeo = new THREE.PlaneGeometry(0.08, length);
      guideGeo.rotateX(-Math.PI / 2);
      const guideMesh = new THREE.Mesh(guideGeo, laneBorderMat);
      guideMesh.position.set(sideX > 0 ? trackWidth / 2 + 0.04 : -trackWidth / 2 - 0.04, 0.02, -length / 2);
      group.add(guideMesh);
    });

    // Beacons along the preview road
    for (let z = -6; z >= -length + 4; z -= 14) {
      [-trackWidth / 2 - 0.22, trackWidth / 2 + 0.22].forEach(sideX => {
        const beaconGeo = new THREE.BoxGeometry(0.24, 0.45, 0.24);
        const beaconMesh = new THREE.Mesh(beaconGeo, pillarSideMat);
        beaconMesh.position.set(sideX, 0.25, z);
        group.add(beaconMesh);

        const crystalGeo = new THREE.OctahedronGeometry(0.12, 0);
        const crystalMesh = new THREE.Mesh(crystalGeo, lanternMat);
        crystalMesh.position.set(sideX, 0.55, z);
        group.add(crystalMesh);
      });
    }

    return group;
  }
}
