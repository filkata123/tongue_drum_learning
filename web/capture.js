// AudioWorklet that forwards every input sample to the page in blocks, so note detection
// sees continuous audio no matter how busy or throttled the page's rendering is.
const BLOCK = 1024;

class Capture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.block = new Float32Array(BLOCK);
    this.n = 0;
  }

  process(inputs) {
    const ch = inputs[0][0];
    for (let i = 0; i < 128; i++) {
      this.block[this.n++] = ch ? ch[i] : 0; // no input connected yet = silence
      if (this.n === BLOCK) {
        this.port.postMessage(this.block, [this.block.buffer]);
        this.block = new Float32Array(BLOCK);
        this.n = 0;
      }
    }
    return true;
  }
}

registerProcessor("capture", Capture);
