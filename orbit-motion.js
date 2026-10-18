// Screen-space quaternion rotation keeps both axes continuous through the poles.
export class OrbitMotion {
  constructor() {
    this.q = [0, 0, 0, 1];
    this.base = [0.108, 0]; // radians / second
    this.speed = [...this.base];
    this.settle = 1.25; // seconds; exponential return to the resting speed
    this.rotate(0.15, -0.1);
  }
  limit(x, y, max = 1.15) {
    const scale = Math.min(1, max / (Math.hypot(x, y) || 1));
    return [x * scale, y * scale];
  }
  rotate(yaw, pitch) {
    const angle = Math.hypot(yaw, pitch);
    if (!angle) return;
    const s = Math.sin(angle / 2) / angle;
    const [ax, ay, az, aw] = [-pitch * s, yaw * s, 0, Math.cos(angle / 2)];
    const [bx, by, bz, bw] = this.q;
    const next = [aw*bx+ax*bw+ay*bz-az*by, aw*by-ax*bz+ay*bw+az*bx, aw*bz+ax*by-ay*bx+az*bw, aw*bw-ax*bx-ay*by-az*bz];
    const norm = Math.hypot(...next);
    this.q = next.map(v => v / norm);
  }
  project([x, y, z]) {
    const [qx, qy, qz, qw] = this.q;
    const tx = 2*(qy*z-qz*y), ty = 2*(qz*x-qx*z), tz = 2*(qx*y-qy*x);
    return [x+qw*tx+qy*tz-qz*ty, y+qw*ty+qz*tx-qx*tz, z+qw*tz+qx*ty-qy*tx];
  }
  release(x, y) { this.speed = this.limit(x, y); }
  resetSpeed() { this.speed = [...this.base]; }
  step(dt) {
    const decay = Math.exp(-dt / this.settle);
    const angle = this.speed.map((v, i) => this.base[i]*dt + (v-this.base[i])*this.settle*(1-decay));
    this.speed = this.speed.map((v, i) => this.base[i]+(v-this.base[i])*decay);
    this.rotate(...angle);
  }
}
