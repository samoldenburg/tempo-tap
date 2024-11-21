<script setup lang="ts">
import { type Ref } from 'vue';
import { onMounted, ref, watch } from 'vue'

const wrapRef = ref<HTMLElement | null>(null);

type Timing = {
  t: number;
}

let resetTimeout: number | undefined;
let timing: Timing[] = [];
let showHelp: Ref<boolean, boolean> = ref(false);
let wasReset: Ref<boolean, boolean> = ref(false);
let bpm: Ref<number, number> = ref(0);
let stdDev: Ref<number, number> = ref(0);
let mae: Ref<number, number> = ref(0);

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
    mae.value = meanAbsoluteError(avg, ints)
  }
}

const doAnimating = (ints: number[], avg: number) => {
  if (ints.length > 1) {
    const duration = avg / 1000 * 4; // Convert ms to seconds for CSS
    const pageWrap = wrapRef.value as unknown as HTMLElement;
    if (pageWrap) {
      pageWrap.style.animationDuration = `${duration}s`; // Dynamically set animation speed
      if (!pageWrap.classList.contains('pulsing')) {
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
</script>

<template>
  <div id="page-wrap" tabindex="0" ref="wrapRef" @keydown="handleKey">
    <div v-if="showHelp" id="help">
      <button @click="showHelp = false">x</button>
      <h2>Help</h2>
      <p>Tap along with any key to the beat of a song and learn the BPM of that song.</p>
      <p>Press Escape, or wait 5 seconds to reset.</p>
    </div>

    <div id="inner">
      <h1 @click="showHelp = true">Tempo Tap</h1>
      <h2>BPM: {{ bpm.toFixed(2) }}</h2>

      <h3 v-if="wasReset">😎</h3>

      <table>
        <tbody>
        <tr>
          <th>Key Presses</th>
          <td>{{ timing.length }}</td>
        </tr>
        <tr>
          <th>Mean Absolute Error</th>
          <td>{{ mae.toFixed(2) }}</td>
        </tr>
        <tr>
          <th>Standard Deviation *3</th>
          <td>{{  (stdDev*3).toFixed(2) }}</td>
        </tr>
        </tbody>
      </table>

    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes pulse {
  0%{background-position:0% 38%}
  50%{background-position:100% 63%}
  100%{background-position:0% 38%}
}

.pulsing {
  animation-name: pulse;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
}

#page-wrap {
  --highlight: rgb(0, 68, 68);
  --shadow: rgb(17, 41, 85);

  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: linear-gradient(236deg, var(--highlight), var(--shadow), var(--highlight), var(--shadow));
  background-size: 800% 800%;
  color: #ccc;

  &:focus {
    border: 5px solid #6e5ec7;
    outline: none;
  }

  #help {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30rem;
    padding: 2rem;
    background: #666;
    z-index: 999;

    button {
      position: absolute;
      top: 0;
      right: 0;
      background: none;
      border: none;
      font-size: 2rem;
      color: white;
      padding: 1rem;
      cursor: pointer;
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
      cursor: help;
      text-decoration-line: underline;
      text-decoration-style: dashed;

      &:after {
        content: "❓";
        font-size: 0.75rem;
        position:relative;
        bottom: 1rem;
      }
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
      }
    }
  }
}
</style>