<script setup lang="ts">
import { Chart, Grid, Line } from 'vue3-charts'
import { defineProps, ref, provide, watch, type Ref } from 'vue'
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import type { EChartsOption } from 'echarts/types/dist/shared';

const props = defineProps(['intervals']) as { intervals: number[] }

const debugInts = ref([406, 409, 440, 415, 400, 447, 436, 411, 392, 417, 394, 384, 389]);


use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  LineChart,
  MarkLineComponent
]);

const getChartOptions = (intervals: number[]): EChartsOption => {
  const bpms = intervals.map(n => (60000 / n))
  const average = Math.round(bpms.reduce((sum, current) => sum + current, 0) / intervals.length);

  return {
    xAxis: {
      type: 'category',
      data: bpms.map((n, i) => i),
      name: 'Tap #',
    },

    grid: {
      id: 'y',
      show: false
    },

    yAxis: {
      type: 'value',
      name: 'BPM',
      min: Math.min(average - (average / 15), bpms.reduce((min, cur) => Math.min(min, cur), 9999)),
      max: Math.max(average + (average / 15), bpms.reduce((min, cur) => Math.max(min, cur), 0)),
      splitLine: {
        lineStyle: {
          color: "#ffffff22",
          type: 'dashed'
        }
      },
      axisLabel: {
        formatter(value) {
          return String(Math.round(value))
        }
      },
      nameLocation: 'end'
    },

    series: [
      {
        data: bpms,
        type: 'line',
        animation: false,
        lineStyle: {
          color: '#99c',
          width: 2,
          type: 'solid'
        },
        itemStyle: {
          color: '#aaf',
        },
        markLine: {
          data: [
            {
              yAxis: average,
              name: 'avg',
              lineStyle: {
                type: 'dotted',
                color: '#faa'
              },
              label: {
                formatter: '{b}{c}',
                position: 'insideStart',
                textBorderWidth: 0,
                textShadowBlur: false
              }

            }
          ]
        }
      },
    ],
  } as EChartsOption
}

const option = ref(getChartOptions(props.intervals));
watch(() => props.intervals, (intervals) => {
  option.value = getChartOptions(intervals)
})
</script>

<template>
  <div id="container">
    <v-chart class="chart" :option="option" autoresize />
  </div>
</template>

<style scoped>
#container {
  max-height: 20rem;
}

.chart {
  height: 20rem;
}
</style>
