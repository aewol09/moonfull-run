import * as THREE from 'three';

export class CameraFollower {
  private camera: THREE.PerspectiveCamera;
  private targetPosition = new THREE.Vector3();
  private currentLookAt = new THREE.Vector3();

  // In-Game 3rd person offsets relative to Luna
  private readonly offsetNormal = new THREE.Vector3(0, 3.8, 6.4);
  private readonly lookOffsetNormal = new THREE.Vector3(0, 1.4, -6.0);

  // Menu preview offsets (front-facing cinematic)
  private readonly offsetMenu = new THREE.Vector3(0, 1.6, 3.8);
  private readonly lookOffsetMenu = new THREE.Vector3(0, 1.2, 0);

  private isMenuMode = true;
  private isCostumeModalOpen = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentLookAt.copy(this.lookOffsetMenu);
  }

  public setMenuMode(isMenu: boolean): void {
    this.isMenuMode = isMenu;
  }

  public setCostumeModalOpen(isOpen: boolean): void {
    this.isCostumeModalOpen = isOpen;
  }

  public update(
    playerPos: THREE.Vector3,
    isJumping: boolean,
    isSliding: boolean,
    dt: number,
    yaw = 0
  ): void {
    if (this.isMenuMode) {
      // In costume preview modal, frame Luna in upper viewport so full body is visible above the bottom sheet
      const offsetY = this.isCostumeModalOpen ? 1.55 : this.offsetMenu.y;
      const lookY = this.isCostumeModalOpen ? 0.72 : this.lookOffsetMenu.y;
      const offsetZ = this.isCostumeModalOpen ? 3.15 : this.offsetMenu.z;

      const targetPos = new THREE.Vector3(
        playerPos.x + this.offsetMenu.x,
        playerPos.y + offsetY,
        playerPos.z + offsetZ
      );
      this.camera.position.lerp(targetPos, 0.14);

      const lookTarget = new THREE.Vector3(
        playerPos.x + this.lookOffsetMenu.x,
        playerPos.y + lookY,
        playerPos.z + this.lookOffsetMenu.z
      );
      this.currentLookAt.lerp(lookTarget, 0.12);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    // In-Game Running Follower with dynamic corner banking
    const lerpSpeedX = Math.min(1, dt * 10);
    const lerpSpeedYZ = Math.min(1, dt * 12);

    // Keep camera smoothly tracking runner; in 90-degree turn, angles smoothly into the corner apex
    const desiredX = playerPos.x * 0.45 - Math.sin(yaw) * 1.6;
    let desiredY = playerPos.y + this.offsetNormal.y;
    const desiredZ = playerPos.z + Math.cos(yaw) * this.offsetNormal.z;

    // Gentle camera damping on jump/slide to preserve front vision
    if (isJumping) {
      desiredY = Math.min(desiredY, playerPos.y * 0.3 + this.offsetNormal.y);
    } else if (isSliding) {
      desiredY -= 0.3;
    }

    this.camera.position.x += (desiredX - this.camera.position.x) * lerpSpeedX;
    this.camera.position.y += (desiredY - this.camera.position.y) * lerpSpeedYZ;
    this.camera.position.z += (desiredZ - this.camera.position.z) * lerpSpeedYZ;

    // Look-target aims into the curving road apex so oncoming track and obstacles are clearly visible
    const forwardLookahead = Math.cos(yaw) * 6.8;
    const lateralLookahead = Math.sin(yaw) * 5.2;
    const targetLookAt = new THREE.Vector3(
      playerPos.x * 0.3 + lateralLookahead,
      1.3,
      playerPos.z - forwardLookahead
    );

    this.currentLookAt.lerp(targetLookAt, 0.16);
    this.camera.lookAt(this.currentLookAt);

    // Subtle dynamic banking roll into the corner
    if (Math.abs(yaw) > 0.02) {
      this.camera.rotateZ(-yaw * 0.10);
    }
  }

  /**
   * Smoothly orbits camera 90 degrees around the character following the corner curve tangent.
   */
  public updateCornerCamera(eye: THREE.Vector3, lookAt: THREE.Vector3, dt: number): void {
    const lerpSpeed = Math.min(1, dt * 12);
    this.camera.position.lerp(eye, lerpSpeed);
    this.currentLookAt.lerp(lookAt, lerpSpeed);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Reanchors camera directly behind the character after corner completion.
   */
  public reanchorBehindPlayer(playerPos: THREE.Vector3): void {
    this.camera.position.set(
      playerPos.x + this.offsetNormal.x,
      playerPos.y + this.offsetNormal.y,
      playerPos.z + this.offsetNormal.z
    );
    this.currentLookAt.set(
      playerPos.x + this.lookOffsetNormal.x,
      playerPos.y + this.lookOffsetNormal.y,
      playerPos.z + this.lookOffsetNormal.z
    );
    this.camera.lookAt(this.currentLookAt);
  }
}
