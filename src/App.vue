<script setup lang="ts">
import { type Ref } from 'vue';
import { onMounted, ref, watch } from 'vue'

const ORIGIN_NOTE = 5;
const ANIMATION_RATE = 1/2;

const wrapRef = ref<HTMLElement | null>(null);

type Timing = {
  t: number;
}

let resetTimeout: number | undefined;
let timing: Timing[] = [];
let animationsEnabled: Ref<boolean, boolean> = ref(false);
let wasReset: Ref<boolean, boolean> = ref(false);
let bpm: Ref<number, number> = ref(0);
let mae: Ref<number, number> = ref(0);
let stdDev: Ref<number, number> = ref(0);

const msIntervalToBpm = (interval: number): number => 60000/interval

const intervals = (timing: Timing[]): number[] => timing.reduce((accumulator: number[], currentValue: Timing, currentIndex: number) => {
  if (currentIndex === 0) return accumulator

  accumulator.push(timing[currentIndex].t - timing[currentIndex - 1].t)
  return accumulator
}, [] as number[])

const average = (values: number[]) => values.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / values.length

const standardDeviation = (mean: number, ints: number[]) => {
  const variance = ints.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / ints.length
  return Math.sqrt(variance)
}

const meanAbsoluteError = (mean: number, intervals: number[]): number => {
  return intervals.reduce((sum, interval) => sum + Math.abs(interval - mean), 0) / intervals.length;
};

const reset = () => {
  timing = []
  console.log(wrapRef)

  // reset display
  wasReset.value = true
  setTimeout(() => {
    wasReset.value = false
  }, 5000)
}

const doCalculations = (ints: number[], avg: number) => {
  if (ints.length > 1) {
    // timing calculations
    bpm.value = msIntervalToBpm(avg)
    stdDev.value = standardDeviation(avg, ints)

    // 5 intervals or more
    if (ints.length >= ORIGIN_NOTE) {
      // start at the 4th index
      mae.value = meanAbsoluteError(Math.round(avg), ints.slice(ORIGIN_NOTE - 1))
    }
  }
}

const doAnimating = (ints: number[], avg: number) => {
  if (ints.length > 1) {
    const duration = avg / 1000 * (1 / ANIMATION_RATE); // ms->s, apply rate
    const pageWrap = wrapRef.value as unknown as HTMLElement;
    if (pageWrap) {
      pageWrap.style.animationDuration = `0s`;
      pageWrap.style.animationDuration = `${duration}s`;

      // only change the class list if animations are enabled
      if (!pageWrap.classList.contains('pulsing') && animationsEnabled.value) {
        pageWrap.classList.add('pulsing');
      }
    }
  }
}

const handleKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    reset()
    return;
  }

  wasReset.value = false

  timing.push({
    t: (new Date()).getTime()
  })

  const ints = intervals(timing)
  const avg = average(ints)
  doCalculations(ints, avg)
  doAnimating(ints, avg)

  clearTimeout(resetTimeout)
  resetTimeout = setTimeout(reset, 5000)
}

watch(timing, () => {
  const ints = intervals(timing);
  if (ints.length > 1) {
    const avg = average(ints);
    const duration = avg / 1000; // Convert ms to seconds for CSS
    const pageWrap = wrapRef.value as unknown as HTMLElement;
    if (pageWrap) {
      pageWrap.style.animationDuration = `${duration}s`;
    }
  }
})

watch(animationsEnabled, (v) => {
  if (v === false) {
    const pageWrap = wrapRef.value as unknown as HTMLElement;
    pageWrap.classList.remove('pulsing');
    return;
  }

  if (bpm) {
    const pageWrap = wrapRef.value as unknown as HTMLElement;
    pageWrap.classList.add('pulsing');
  }
})
</script>

<template>
  <div id="page-wrap" tabindex="0" ref="wrapRef" @keydown="handleKey">
    <div id="inner">
      <h1 class="help" title="Tap to the beat of a song. Esc to reset.">Tempo Tap</h1>
      <h2>BPM: {{ bpm.toFixed(2) }}</h2>

      <h3 v-if="wasReset">😎</h3>

      <table>
        <tbody>
        <tr>
          <th>Key Presses</th>
          <td>{{ timing.length }}</td>
        </tr>
        <tr>
          <th class="help" title="Based on the timing of your 5th keyPress, and the current BPM rounded to the nearest whole number">Mean Absolute Error</th>
          <td>{{ mae == 0 ? "(no data)" : mae.toFixed(2) }}</td>
        </tr>
        <tr>
          <th>Standard Deviation</th>
          <td>{{  stdDev.toFixed(2) }}</td>
        </tr>
        </tbody>
      </table>

      <div class="controls">
        <label><input type="checkbox" id="checkbox" v-model="animationsEnabled" /> Enable Animations</label>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes pulse {
  0%{
    background-position:0% 33%
  }
  25%{
  --lightness: 20%;
  }
  50%{
    background-position:100% 67%;
    // LOL
    --angle: 12deg;
    --degreeshift: 20;
    --saturation: 50%;
    --movement: 90%;
    --lightness: 20%;
    --basehue: 40;
  }
  75%{
  --lightness: 20%;
  }
  100%{
    background-position:0% 33%
  }
}

.pulsing {
  animation-name: pulse;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
}

#page-wrap {
  // lol i spent way more time playing with these numbers for fun than i care to admit
  --basehue: 200;
  --degreeshift: 5;
  --saturation: 85%;
  --lightness: 20%;
  --movement: 2%;
  --angle: 90deg;


  --highlight: hsl(calc(var(--basehue) + (var(--degreeshift) / 2)), var(--saturation), var(--lightness));
  --shadow: hsl(calc(var(--basehue) - (var(--degreeshift) / 2)), var(--saturation), var(--lightness));

  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: linear-gradient(var(--angle), var(--highlight), var(--shadow), var(--highlight), var(--shadow));
  background-size: var(--movement) var(--movement);
  color: #ccc;

  &:focus {
    border: 5px solid #6e5ec7;
    outline: none;
  }

  .help {
    cursor: help;
    text-decoration-line: underline;
    text-decoration-style: dashed;

    &:after {
      content: "❓";
      font-size: 0.5em;
      position:relative;
      bottom: 1em;
    }
  }

  #inner {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30rem;
    padding: 2rem;
    background: rgba(50, 50, 50, 0.5);
    box-shadow: 5px 5px 15px rgba(0,0,0, 0.35);
    border-radius: 1rem;

    h1 {
      margin: 2rem 0;
      padding: 0;
    }

    h2 {
      margin: 1rem 0;
      padding: 0;
    }

    table {
      width: 100%;
      border: 1px solid #555;
      border-collapse: collapse;
      margin: 2rem 0;

      th,td {
        border: 1px solid #555;
        padding: 0.5rem 1rem;
      }

      th {
        text-align: left;
      }

      td {
        text-align: right;
        width: 5rem;
      }
    }
  }
}
</style>