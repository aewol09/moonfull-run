import * as THREE from 'three';

/**
 * Curved-world road bending (Subway Surfers style).
 * Bends every fog-enabled material in view space so the track visually
 * curves left/right and up/down ahead, while gameplay stays on straight lanes.
 */
export const curveUniforms = {
  uCurveX: { value: 0 },
  uCurveY: { value: 0 }
};

let installed = false;

export function installCurveWorld(): void {
  if (installed) return;
  installed = true;

  const proto = THREE.Material.prototype as any;
  const original = proto.onBeforeCompile;

  proto.onBeforeCompile = function (shader: any, renderer: any) {
    original?.call(this, shader, renderer);
    // Skip sky/moon/background (fog disabled) so the horizon never tears
    if (this.fog === false) return;
    if (!shader.vertexShader.includes('#include <project_vertex>')) return;

    shader.uniforms.uCurveX = curveUniforms.uCurveX;
    shader.uniforms.uCurveY = curveUniforms.uCurveY;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uCurveX;\nuniform float uCurveY;\nvoid main() {')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        float cwD = clamp(-mvPosition.z, 0.0, 140.0);
        mvPosition.x += uCurveX * cwD * cwD * 0.15;
        mvPosition.y += uCurveY * cwD * cwD * 0.15;
        gl_Position = projectionMatrix * mvPosition;`
      );
  };
}

/** Drives smoothly changing bends: straight → left/right turn → hill, etc. */
export class CurveDirector {
  private targetX = 0;
  private targetY = 0;
  private timer = 3;
  public turnDir = 0; // -1 left, 1 right (for camera roll)

  public reset(): void {
    this.targetX = 0;
    this.targetY = 0;
    this.timer = 3;
    curveUniforms.uCurveX.value = 0;
    curveUniforms.uCurveY.value = 0;
  }

  public update(dt: number, running: boolean, coordinatedCurveX?: number): void {
    if (!running) {
      this.targetX = 0;
      this.targetY = 0;
    } else if (coordinatedCurveX !== undefined) {
      this.targetX = coordinatedCurveX;
      this.targetY = 0;
    } else {
      this.timer -= dt;
      if (this.timer <= 0) {
        const r = Math.random();
        if (r < 0.25) {
          this.targetX = 0; // straight
        } else {
          const dir = Math.random() < 0.5 ? -1 : 1;
          this.targetX = dir * (0.0012 + Math.random() * 0.0016);
        }
        this.targetY = (Math.random() - 0.6) * 0.0012; // mostly gentle downhill/uphill
        this.timer = 3.5 + Math.random() * 3;
      }
    }
    const k = Math.min(1, dt * 0.9);
    curveUniforms.uCurveX.value += (this.targetX - curveUniforms.uCurveX.value) * k;
    curveUniforms.uCurveY.value += (this.targetY - curveUniforms.uCurveY.value) * k;
    this.turnDir = curveUniforms.uCurveX.value / 0.0028;
  }
}
