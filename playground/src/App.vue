<script setup lang="ts">
import { ref } from "vue";
import { md } from "./md";
import { createMarkdownStreamRender } from "../../src";
const container = ref<Element | null>(null);
const disabled = ref(false);
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
async function clickHandle() {
  if (disabled.value) return;
  disabled.value = true;
  const stream = createStream(md);
  const containerDom = container.value!;
  containerDom.innerHTML = "";
  await createMarkdownStreamRender(stream, containerDom);
  disabled.value = false;
}
</script>
<template>
  <div class="w-screen h-screen py-16 mx-auto max-w-[800px]">
    <button
      class="flex bg-[#0a0a0a] text-white py-3 px-4 rounded-sm border border-[#262626] hover:bg-[#262626]"
      :class="{
        'cursor-not-allowed': disabled,
        'cursor-pointer': !disabled,
      }"
      @click="clickHandle"
    >
      <div v-if="disabled" class="animate-spin size-6 mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8"
          ></path>
        </svg>
      </div>
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
