import { ParticlePool } from '../ParticlePool';

describe('Particle Object Pool System', () => {
  test('should pre-allocate the exact specified number of particles upon initialization', () => {
    const pool = new ParticlePool(200);
    expect(pool.particles.length).toBe(200);
    expect(pool.maxSize).toBe(200);
    
    // All pre-allocated particles must initially be inactive
    pool.particles.forEach((p) => {
      expect(p.active).toBe(false);
      expect(p.life).toBe(0);
      expect(p.maxLife).toBe(0);
    });
  });

  test('should activate requested number of particles when emitting', () => {
    const pool = new ParticlePool(10);
    expect(pool.particles.length).toBe(10);

    // Emit 3 particles
    pool.emit(100, 150, '#ff0000', 3);

    const activeParticles = pool.particles.filter(p => p.active);
    expect(activeParticles.length).toBe(3);

    // Verify properties of emitted active particles
    activeParticles.forEach(p => {
      expect(p.x).toBe(100);
      expect(p.y).toBe(150);
      expect(p.color).toBe('#ff0000');
      expect(p.life).toBeGreaterThanOrEqual(250);
      expect(p.life).toBeLessThanOrEqual(750);
      expect(p.maxLife).toBe(p.life);
      // Velocity should be populated
      expect(p.vx).not.toBe(0);
      expect(p.vy).not.toBe(0);
    });

    const inactiveParticles = pool.particles.filter(p => !p.active);
    expect(inactiveParticles.length).toBe(7);
  });

  test('should not increase the size of the underlying pre-allocated array even when emitting beyond maxSize', () => {
    const pool = new ParticlePool(10);
    
    // Emit 15 particles (cap is 10)
    pool.emit(100, 150, '#ff0000', 15);

    expect(pool.particles.length).toBe(10);
    const activeParticles = pool.particles.filter(p => p.active);
    expect(activeParticles.length).toBe(10); // Capped at pool capacity
  });

  test('should update active particle positions and decay lifetimes over tick updates', () => {
    const pool = new ParticlePool(5);
    pool.emit(0, 0, '#ffffff', 1);

    const activeParticle = pool.particles.find(p => p.active)!;
    const initialX = activeParticle.x;
    const initialY = activeParticle.y;
    const vx = activeParticle.vx;
    const vy = activeParticle.vy;
    const initialLife = activeParticle.life;

    // Tick the updates by 10ms
    pool.update(10);

    expect(activeParticle.x).toBeCloseTo(initialX + vx * 10, 5);
    expect(activeParticle.y).toBeCloseTo(initialY + vy * 10, 5);
    expect(activeParticle.life).toBe(initialLife - 10);
    expect(activeParticle.active).toBe(true);
  });

  test('should flag particles as inactive once their life expires', () => {
    const pool = new ParticlePool(5);
    pool.emit(0, 0, '#ffffff', 1);

    const p = pool.particles.find(p => p.active)!;
    const maxTick = p.life + 10; // slightly longer than particle lifetime

    // Tick pool past the lifetime
    pool.update(maxTick);

    expect(p.active).toBe(false);
    expect(p.life).toBeLessThanOrEqual(0);
  });

  test('should recycle inactive particles and reuse them for subsequent emissions', () => {
    const pool = new ParticlePool(2);
    
    // 1. Emit 2 particles (fills the pool)
    pool.emit(0, 0, '#ff0000', 2);
    expect(pool.particles.filter(p => p.active).length).toBe(2);

    // 2. Try emitting one more (should do nothing since pool is full)
    pool.emit(100, 100, '#00ff00', 1);
    expect(pool.particles.filter(p => p.active).length).toBe(2);
    expect(pool.particles.every(p => p.color === '#ff0000')).toBe(true);

    // 3. Expire the lifetime of the first particle manually
    pool.particles[0].life = 0;
    pool.update(1); // triggers update, sets particle 0 active=false

    expect(pool.particles[0].active).toBe(false);
    expect(pool.particles[1].active).toBe(true);

    // 4. Emit again. Particle 0 should be recycled and reused with the new color/coordinates
    pool.emit(50, 50, '#0000ff', 1);
    expect(pool.particles.filter(p => p.active).length).toBe(2);
    expect(pool.particles[0].active).toBe(true);
    expect(pool.particles[0].x).toBe(50);
    expect(pool.particles[0].y).toBe(50);
    expect(pool.particles[0].color).toBe('#0000ff');
  });
});
