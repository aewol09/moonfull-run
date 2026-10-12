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

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentLookAt.copy(this.lookOffsetMenu);
  }

  public setMenuMode(isMenu: boolean): void {
    this.isMenuMode = isMenu;
  }

  public update(playerPos: THREE.Vector3, isJumping: boolean, isSliding: boolean, dt: number): void {
    if (this.isMenuMode) {
      // Orbiting or subtle floating view for Luna preview
      const targetPos = new THREE.Vector3(
        playerPos.x + this.offsetMenu.x,
        playerPos.y + this.offsetMenu.y,
        playerPos.z + this.offsetMenu.z
      );
      this.camera.position.lerp(targetPos, 0.08);

      const lookTarget = new THREE.Vector3(
        playerPos.x + this.lookOffsetMenu.x,
        playerPos.y + this.lookOffsetMenu.y,
        playerPos.z + this.lookOffsetMenu.z
      );
      this.currentLookAt.lerp(lookTarget, 0.1);
      this.camera.lookAt(this.currentLookAt);
      return;
    }

    // In-Game Running Follower
    // Damping: smooth X horizontal tracking to avoid jerky camera on quick swipes
    const lerpSpeedX = Math.min(1, dt * 10);
    const lerpSpeedYZ = Math.min(1, dt * 16);

    const desiredX = playerPos.x * 0.45; // Subtle camera shift (45% of player's lateral movement)
    let desiredY = playerPos.y + this.offsetNormal.y;
    const desiredZ = playerPos.z + this.offsetNormal.z;

    // Gentle camera damping on jump/slide to preserve front vision
    if (isJumping) {
      desiredY = Math.min(desiredY, playerPos.y * 0.3 + this.offsetNormal.y);
    } else if (isSliding) {
      desiredY -= 0.3;
    }

    this.camera.position.x += (desiredX - this.camera.position.x) * lerpSpeedX;
    this.camera.position.y += (desiredY - this.camera.position.y) * lerpSpeedYZ;
    this.camera.position.z = desiredZ; // Z keeps strict distance behind player

    const targetLookAt = new THREE.Vector3(
      playerPos.x * 0.3,
      1.3,
      playerPos.z + this.lookOffsetNormal.z
    );

    this.currentLookAt.lerp(targetLookAt, 0.14);
    this.camera.lookAt(this.currentLookAt);
  }
}
