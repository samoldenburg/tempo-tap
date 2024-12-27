<script setup lang="ts">
import { type Ref } from 'vue';
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Charts from './Charts.vue'
import Game from './Game.vue'

const ORIGIN_NOTE = 5;
const ANIMATION_RATE = 1 / 2;

const wrapRef = ref<HTMLElement | null>(null);

export type Timing = {
  raw: number[],
  intervals: number[],
  avg: number,
  bpm: number,
  stdDev: number,
  meanAbsErr: number
}

const timing: Ref<Timing, Timing> = ref({
  raw: [],
  intervals: [],
  avg: 0,
  bpm: 0,
  stdDev: 0,
  meanAbsErr: 0
});

let animationsEnabled: Ref<boolean, boolean> = ref(true);
let wasReset: Ref<boolean, boolean> = ref(false);

const msIntervalToBpm = (interval: number): number => 60000 / interval

const intervals = (timing: number[]): number[] => timing.reduce((accumulator: number[], currentValue: number, currentIndex: number) => {
  if (currentIndex === 0) return accumulator

  accumulator.push(timing[currentIndex] - timing[currentIndex - 1])
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
  timing.value.raw = []
}

const doCalculations = () => {
  const { value: { intervals, avg } } = timing;
  if (intervals.length > 1) {
    // timing calculations

    timing.value.bpm = msIntervalToBpm(avg)
    timing.value.stdDev = standardDeviation(avg, intervals)

    // 5 intervals or more
    if (intervals.length >= ORIGIN_NOTE) {
      // start at the 4th index
      timing.value.meanAbsErr = meanAbsoluteError(
        avg,
        intervals.slice(ORIGIN_NOTE - 1)
      )
    }
  }
}

const doAnimating = () => {
  if (timing.value.intervals.length > 1) {
    const duration = Math.round(timing.value.avg) / 1000 * (1 / ANIMATION_RATE); // ms->s, apply rate
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
  const ignoreKeys = [
    'AudioVolumeUp',
    'AudioVolumeDown',
    'MediaPlayPause',
    'MediaTrackPrevious',
    'MediaTrackNext',
  ]
  if (ignoreKeys.includes(event.key)) return
  if (event.key === 'Escape') {
    reset()
    return;
  }

  timing.value.raw.push(performance.now())
  timing.value.intervals = intervals(timing.value.raw);
  timing.value.avg = average(timing.value.intervals);

  doCalculations()
  doAnimating()
  // clearTimeout(resetTimeout)
  // resetTimeout = setTimeout(reset, 5000)
}

watch(timing, () => {
  const ints = intervals(timing.value.raw);
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

  if (timing.value.bpm) {
    const pageWrap = wrapRef.value as unknown as HTMLElement;
    pageWrap.classList.add('pulsing');
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <div id="page-wrap" tabindex="0" ref="wrapRef">
    <div id="inner">
      <h1 class="help" title="Tap to the beat of a song. Esc to reset.">Tempo Tap</h1>
      <h2>BPM: {{ timing.bpm.toFixed(2) }}</h2>

      <h3 v-if="wasReset">😎</h3>

      <table>
        <tbody>
          <tr>
            <th>Key Presses</th>
            <td>{{ timing.raw.length }}</td>
          </tr>
          <tr>
            <th class="help"
              title="Based on the timing of your 5th keyPress, and the current BPM rounded to the nearest whole number">
              Mean Absolute Error</th>
            <td>{{ timing.meanAbsErr == 0 ? "(no data)" : timing.meanAbsErr.toFixed(2) }}</td>
          </tr>
          <tr>
            <th>Standard Deviation</th>
            <td>{{ timing.stdDev.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>

      <div id="charts">
        <Charts :timing="timing" />
      </div>

      <!--
      <div id="game">
        <Game v-if="true" :timing="timing" />
      </div>
      -->

      <div id="controls">
        <label class="help" title="Seizure Warning? Pretty obnoxious? Only kinda feels like it goes to the beat?"><input
            type="checkbox" id="checkbox" v-model="animationsEnabled" /> Enable Animations</label>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes pulse {
  0% {
    background-position: 0% 33%
  }

  50% {
    background-position: 100% 67%;
    // LOL
    --angle: 12deg;
    --degreeshift: 30;
    --saturation: 90%;
    --movement: 400%;
    --lightness: 25%;
    --basehue: 270;
  }

  100% {
    background-position: 0% 33%
  }
}

.pulsing {
  animation-name: pulse;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
}

#page-wrap {
  // lol i spent way more time playing with these numbers for fun than i care to admit
  --basehue: 220;
  --degreeshift: 5;
  --saturation: 75%;
  --lightness: 25%;
  --movement: 60%;
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
  background: linear-gradient(var(--angle), var(--highlight), var(--shadow), var(--highlight), var(--shadow), var(--highlight));
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
      position: relative;
      bottom: 1em;
    }
  }

  #inner {
    position: relative;
    top: 4rem;
    left: 50%;
    transform: translateX(-50%);
    width: 30rem;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.35);
    box-shadow: 1rem 1rem 2rem rgba(0, 0, 0, 0.35);
    border-radius: 0.5rem;
    border: 0.5rem solid rgba(255, 0, 255, 0.05);

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

      th,
      td {
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


    #charts {
      margin-bottom: 2rem;
    }

    #controls {}
  }
}
</style>
