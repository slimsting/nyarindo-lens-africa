(() => {
  "use strict";

  const canvas = document.getElementById("experimentCanvas");
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;

  const experiment = document.body.dataset.experiment || "particles";
  const bounded = experiment === "fields";
  const attraction = document.getElementById("attraction");
  const repulsion = document.getElementById("repulsion");
  const population = document.getElementById("population");
  const damping = document.getElementById("damping");
  const attractionValue = document.getElementById("attractionValue");
  const repulsionValue = document.getElementById("repulsionValue");
  const populationValue = document.getElementById("populationValue");
  const dampingValue = document.getElementById("dampingValue");
  const resetButton = document.getElementById("resetExperiment");
  const pauseButton = document.getElementById("pauseExperiment");
  const status = document.getElementById("experimentStatus");
  const counts = {
    contracting: document.getElementById("contractingCount"),
    expanding: document.getElementById("expandingCount"),
    equilibrium: document.getElementById("equilibriumCount"),
    collisions: document.getElementById("collisionCount"),
    clusters: document.getElementById("clusterCount"),
  };

  const equilibriumDistance = bounded ? 42 : 35;
  const collisionDistance = bounded ? 12 : 10;
  const wallInset = 22;
  const maxSpeed = bounded ? 3.2 : 2.6;
  const maxForce = 2.1;

  let particles = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let collisions = 0;
  let frame = 0;
  let paused = false;
  let animationFrame = 0;

  function themeColor(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function newParticle() {
    const left = bounded ? wallInset : 0;
    const top = bounded ? wallInset : 0;
    const w = Math.max(10, width - left * 2);
    const h = Math.max(10, height - top * 2);
    return {
      x: left + Math.random() * w,
      y: top + Math.random() * h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      mass: 0.7 + Math.random() * 0.9,
      previousSpeed: 0,
      state: "equilibrium",
      spark: 0,
    };
  }

  function reset() {
    collisions = 0;
    frame = 0;
    const count = Number(population.value);
    particles = Array.from({ length: count }, newParticle);
    updateOutputs();
    updateStats(0, 0, count);
  }

  function normalizedDistance(dx, dy) {
    return Math.max(0.5, Math.hypot(dx, dy));
  }

  function forceAt(distance) {
    const attractionStrength = Number(attraction.value) * 0.0042;
    const repulsionStrength = Number(repulsion.value) * 0.0064;
    const ratio = equilibriumDistance / distance;
    const pull = -attractionStrength * ratio * ratio;
    const push = repulsionStrength * Math.pow(ratio, 6);
    return Math.max(-maxForce, Math.min(maxForce, pull + push));
  }

  function clusterCount() {
    if (!particles.length) return 0;
    const visited = new Uint8Array(particles.length);
    let clusters = 0;
    const reach = equilibriumDistance * 1.55;

    for (let start = 0; start < particles.length; start += 1) {
      if (visited[start]) continue;
      clusters += 1;
      const stack = [start];
      visited[start] = 1;
      while (stack.length) {
        const index = stack.pop();
        const a = particles[index];
        for (let other = 0; other < particles.length; other += 1) {
          if (visited[other]) continue;
          const b = particles[other];
          if (Math.hypot(a.x - b.x, a.y - b.y) <= reach) {
            visited[other] = 1;
            stack.push(other);
          }
        }
      }
    }
    return clusters;
  }

  function updateStats(contracting, expanding, equilibrium, clusters) {
    counts.contracting.textContent = String(contracting);
    counts.expanding.textContent = String(expanding);
    counts.equilibrium.textContent = String(equilibrium);
    counts.collisions.textContent = String(collisions);
    if (clusters !== undefined) counts.clusters.textContent = String(clusters);
  }

  function tick() {
    const accelerations = particles.map(() => ({ x: 0, y: 0 }));

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = normalizedDistance(dx, dy);
        if (distance < collisionDistance) {
          collisions += 1;
          a.spark = 15;
          b.spark = 15;
        }
        const force = forceAt(distance);
        const fx = force * (dx / distance);
        const fy = force * (dy / distance);
        accelerations[i].x += fx * b.mass;
        accelerations[i].y += fy * b.mass;
        accelerations[j].x -= fx * a.mass;
        accelerations[j].y -= fy * a.mass;
      }
    }

    let contracting = 0;
    let expanding = 0;
    let equilibrium = 0;
    const wallDamping = Number(damping?.value || 0.78);

    particles.forEach((particle, index) => {
      particle.vx += accelerations[index].x * 0.72;
      particle.vy += accelerations[index].y * 0.72;
      const speed = Math.hypot(particle.vx, particle.vy);
      if (speed > maxSpeed) {
        particle.vx *= maxSpeed / speed;
        particle.vy *= maxSpeed / speed;
      }

      const currentSpeed = Math.hypot(particle.vx, particle.vy);
      if (currentSpeed < 0.07) particle.state = "equilibrium";
      else if (currentSpeed >= particle.previousSpeed) particle.state = "expanding";
      else particle.state = "contracting";
      particle.previousSpeed = currentSpeed;

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (bounded) {
        if (particle.x < wallInset) { particle.x = wallInset; particle.vx = Math.abs(particle.vx) * wallDamping; }
        if (particle.x > width - wallInset) { particle.x = width - wallInset; particle.vx = -Math.abs(particle.vx) * wallDamping; }
        if (particle.y < wallInset) { particle.y = wallInset; particle.vy = Math.abs(particle.vy) * wallDamping; }
        if (particle.y > height - wallInset) { particle.y = height - wallInset; particle.vy = -Math.abs(particle.vy) * wallDamping; }
      } else {
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }

      if (particle.state === "contracting") contracting += 1;
      else if (particle.state === "expanding") expanding += 1;
      else equilibrium += 1;
      if (particle.spark > 0) particle.spark -= 1;
    });

    frame += 1;
    updateStats(contracting, expanding, equilibrium, frame % 24 === 0 ? clusterCount() : undefined);
  }

  function draw() {
    context.fillStyle = themeColor("--bg") || "#000413";
    context.fillRect(0, 0, width, height);

    if (bounded) {
      context.save();
      context.strokeStyle = themeColor("--wall") || "#4c84ca";
      context.globalAlpha = 0.36;
      context.setLineDash([7, 6]);
      context.strokeRect(wallInset, wallInset, width - wallInset * 2, height - wallInset * 2);
      context.restore();
    }

    const colors = {
      equilibrium: themeColor("--equilibrium") || "#68c788",
      expanding: themeColor("--expand") || "#5aabe8",
      contracting: themeColor("--contract") || "#e65d68",
    };

    for (const particle of particles) {
      const color = colors[particle.state];
      if (particle.spark > 0) {
        context.beginPath();
        context.arc(particle.x, particle.y, 13, 0, Math.PI * 2);
        context.fillStyle = color;
        context.globalAlpha = particle.spark / 55;
        context.fill();
        context.globalAlpha = 1;
      }
      context.beginPath();
      context.arc(particle.x, particle.y, 2.4 * particle.mass, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    }
  }

  function loop() {
    if (!paused) {
      tick();
      draw();
    }
    animationFrame = requestAnimationFrame(loop);
  }

  function updateOutputs() {
    attractionValue.textContent = attraction.value;
    repulsionValue.textContent = repulsion.value;
    populationValue.textContent = population.value;
    if (damping && dampingValue) dampingValue.textContent = damping.value;
  }

  [attraction, repulsion].forEach((control) => {
    control.addEventListener("input", updateOutputs);
  });
  population.addEventListener("input", () => {
    updateOutputs();
    reset();
  });
  damping?.addEventListener("input", updateOutputs);
  resetButton.addEventListener("click", reset);
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    pauseButton.textContent = paused ? "Continue observation" : "Pause observation";
    pauseButton.setAttribute("aria-pressed", String(paused));
    status.textContent = paused ? "The field is held still for observation." : "The field is moving again.";
  });
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("nyarindo:themechange", draw);
  window.addEventListener("pagehide", () => cancelAnimationFrame(animationFrame), { once: true });

  resize();
  reset();
  loop();
})();
