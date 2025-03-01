import { StreamTokenizer } from "./stream-tokenizer";

export function createStreamTransform(stream: ReadableStream) {
  const tokenizer = new StreamTokenizer();
  const streamTransform = new TransformStream({
    transform(chunk: string, controller) {
      if (!tokenizer.controller) tokenizer.controller = controller;
      tokenizer.parseChunk(chunk);
    },
  });
  return stream.pipeThrough(streamTransform);
}
