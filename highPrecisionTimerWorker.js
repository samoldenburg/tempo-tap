// highPrecisionTimerWorker.js
self.onmessage = function (e) {
  const sharedBuffer = e.data;
  const counter = new Uint32Array(sharedBuffer);

  function incrementCounter() {
    Atomics.add(counter, 0, 1);
    setTimeout(incrementCounter, 0);
  }

  incrementCounter();
};
