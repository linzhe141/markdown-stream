<script setup lang="ts">
import { ref } from "vue";
import { md } from "./md";
import { createMarkdownStreamRender } from "../../src";
const container = ref<Element | null>(null);
function createStream(text: string, chunkSize = 10, delay = 50) {
  let position = 0;

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
function clickHandle() {
  const stream = createStream(md);
  const containerDom = container.value!;
  createMarkdownStreamRender(stream, containerDom);
}
</script>
<template>
  <div class="w-screen h-screen py-16 mx-auto max-w-[800px]">
    <button
      class="bg-[#0a0a0a] text-white py-2 px-4 rounded-sm border border-[#262626] hover:bg-[#262626] cursor-pointer"
      @click="clickHandle"
    >
      Re-render
    </button>
    <div
      class="my-10 prose mt-10 dark:prose-invert"
      ref="container"
      style="max-width: 100%"
    ></div>
  </div>
</template>
<
