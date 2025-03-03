export function createStream(text: string, delay = 0) {
  let position = 0;
  const chunkSize = 10;
  return new ReadableStream({
    pull(controller) {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (position >= text.length) {
            controller.close();
            resolve();
            return;
          }

          const chunk = text.slice(position, position + chunkSize);
          position += chunkSize;

          controller.enqueue(chunk);

          resolve();
        }, delay);
      });
    },
  });
}
