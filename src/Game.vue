<script lang="ts" setup>
import { onMounted, onUnmounted, ref, defineProps, watch } from 'vue';
import { genChart } from './lib/chart';

import { type Timing } from './App.vue';

interface Props {
  timing: Timing
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement | null>(null);

let frameIndex = 0;
const frameCount = 2;
const frameWidth = 512;
const frameHeight = 512;
let animationFrameId = 0;

const chart = genChart();

// do bar lines next
// they should be drawn every beat
// and cross the receptors exactly on the beat
// base the first "beat" on the 5th timing point
// base the bpm, and hence scrollrate on the average since the 5th timing point
// there will be no animation before beat 5

const handleKeyPress = (event: KeyboardEvent) => {
  const ignoreKeys = [
    'AudioVolumeUp',
    'AudioVolumeDown',
    'MediaPlayPause',
    'MediaTrackPrevious',
    'MediaTrackNext',
  ]
  if (ignoreKeys.includes(event.key)) return
};

const drawTargets = (ctx: CanvasRenderingContext2D, sprite: HTMLImageElement) => {
  const targetSize = 65;
  const spacing = 15;
  const numImages = 4;
  const totalWidth = (targetSize * numImages) + (spacing * (numImages - 1));
  const startX = (ctx.canvas.width - totalWidth) / 2;
  const startY = 40;
  const rotations = [90, 0, 180, 270];

  for (let i = 0; i < numImages; i++) {
    const x = startX + i * (targetSize + spacing);
    const y = startY;
    const angle = rotations[i] * (Math.PI / 180); // Convert degrees to radians

    ctx.save(); // Save the current state
    ctx.translate(x + targetSize / 2, y + targetSize / 2); // Move to the center of the square
    ctx.rotate(angle); // Rotate the context
    ctx.translate(-targetSize / 2, -targetSize / 2); // Move back to the top-left corner of the square

    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.drawImage(
      sprite,
      frameIndex * frameWidth, 0, frameWidth, frameHeight,
      0, 0, targetSize, targetSize
    );

    ctx.restore(); // Restore the original state
  }
};

let lastTime = props.timing.raw[0] || performance.now();
const animate = (ctx: CanvasRenderingContext2D, sprite: HTMLImageElement) => {
  const currentTime = performance.now();
  const elapsedTime = currentTime - lastTime;

  const framesPerBeat = frameCount;
  const frameDelay = props.timing.avg / framesPerBeat; // milliseconds until next animation frame

  if (elapsedTime >= frameDelay) {
    frameIndex = (frameIndex + 1) % frameCount;
    lastTime = currentTime;
  }

  drawTargets(ctx, sprite);
  animationFrameId = requestAnimationFrame(() => animate(ctx, sprite));
};

onMounted(() => {
  const sprite = new Image();
  sprite.src = 'src/assets/receptors2.png';
  sprite.onload = () => {
    const canvas = canvasRef.value;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        animate(ctx, sprite);
      }
    }
  };

  window.addEventListener('keypress', handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keypress', handleKeyPress);
  cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div id="wrapper">
    <canvas ref="canvasRef" id="gameCanvas" height="400" width="480"></canvas>
  </div>
</template>

<style lang="scss" scoped>
#wrapper {
  margin: 2rem 0;
  background: linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.25));
  min-height: 25rem;
  position: relative;
  border-radius: 0.5rem;

  box-shadow: 0.5rem 0.5rem 1rem rgba(0, 0, 0, 0.1);

  #gameCanvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
