<script setup lang="ts">
import { Chart, Grid, Line } from 'vue3-charts'
import { defineProps, ref, watch, type Ref } from 'vue'
import { type Timing } from './App.vue';

const props = defineProps(['intervals']) as { intervals: number[] }

const margin = ref({
    left: 0,
    top: 20,
    right: 20,
    bottom: 0
})

const intervalMapper = (int: number, index: number) => {
    return {
        tap: index,
        interval: 60000/int
    }
}
</script>

<template>
    <div>
        <Chart
            :size="{ width: 500, height: 400 }"
            :data="props.intervals.map(intervalMapper)"
            :margin="margin">

            <template #layers>
            <Grid strokeDasharray="2,2" />
            <Line :dataKeys="['tap', 'interval']" />
            </template>

        </Chart>
    </div>
</template>