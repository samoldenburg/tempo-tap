var count = 0;

onmessage = function(event) {
  count++;
  postMessage(count);
}
