export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;     // Remaining duration in ms
  maxLife: number;  // Max starting duration in ms
  active: boolean;
}

export class ParticlePool {
  public particles: Particle[] = [];
  public readonly maxSize: number;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
    
    // Pre-allocate all particle entities to completely avoid garbage collection allocations at runtime
    for (let i = 0; i < maxSize; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        life: 0,
        maxLife: 0,
        active: false,
      });
    }
  }

  /**
   * Recycles inactive particles from the pre-allocated pool without using 'new Particle()'.
   * 
   * @param x Spawn origin coordinate X
   * @param y Spawn origin coordinate Y
   * @param color Spawning color hex code
   * @param count Total number of particles to trigger (burst strength)
   */
  public emit(x: number, y: number, color: string, count: number) {
    let emitted = 0;

    for (let i = 0; i < this.maxSize; i++) {
      if (emitted >= count) break;

      const p = this.particles[i];
      if (!p.active) {
        p.x = x;
        p.y = y;

        // Radial explosion vector math
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.18 + 0.04; // px per ms speed variance
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        p.color = color;

        // Custom particle lifetime values between 250ms and 750ms
        const startingLife = Math.random() * 500 + 250;
        p.life = startingLife;
        p.maxLife = startingLife;
        p.active = true;

        emitted++;
      }
    }
  }

  /**
   * Ticks active particles inside the deterministic frame updates.
   * Exited particles automatically mark their active flags back to false.
   * 
   * @param dt Normalization timestep delta in ms
   */
  public update(dt: number) {
    for (let i = 0; i < this.maxSize; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        if (p.life <= 0) {
          p.active = false;
        }
      }
    }
  }
}
