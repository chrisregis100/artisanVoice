/**
 * AudioWorklet processor — converts Float32 microphone samples to PCM16 chunks.
 * Batches 128-sample frames into configurable chunks before posting to the main thread.
 */
class Pcm16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    /** @type {number[]} */
    this._buffer = [];
    /** How many samples to accumulate before posting a chunk (≈ 170ms @ 24 kHz). */
    this._chunkSize = 4096;
  }

  /**
   * @param {Float32Array[][]} inputs
   * @returns {boolean}
   */
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer.push(channel[i]);
    }

    while (this._buffer.length >= this._chunkSize) {
      const chunk = this._buffer.splice(0, this._chunkSize);
      const int16 = new Int16Array(this._chunkSize);
      for (let i = 0; i < this._chunkSize; i++) {
        const s = Math.max(-1, Math.min(1, chunk[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      // Transfer ownership to avoid copying
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm16-processor", Pcm16Processor);
