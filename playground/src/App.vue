<script setup lang="ts">
import { onMounted, ref } from "vue";
import { md } from "./md";
import {
  createMarkdownStreamRender,
  getMarkdownStreamAst,
  processMarkdownStreamChunk,
} from "../../src";
const container = ref<Element | null>(null);
const disabled = ref(false);
function createStream(text: string, chunkSize = 6, delay = 0) {
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
  // console.log(await getMarkdownStreamAst(stream));
  // processMarkdownStreamChunk(stream, (ast) => {
  //   console.log(ast);
  // });
  disabled.value = false;
}
onMounted(clickHandle);
</script>
<template>
  <div class="mx-auto h-screen w-screen max-w-[800px] py-16">
    <div class="flex items-center justify-between">
      <button
        class="flex rounded-sm border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-white hover:bg-[#262626]"
        :class="{
          'cursor-not-allowed': disabled,
          'cursor-pointer': !disabled,
        }"
        @click="clickHandle"
      >
        <div v-if="disabled" class="mr-2 size-6 animate-spin">
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
      <a href="https://github.com/linzhe141/markdown-stream" class="text-white"
        ><svg
          height="32"
          aria-hidden="true"
          viewBox="0 0 24 24"
          version="1.1"
          width="32"
          data-view-component="true"
          fill="currentColor"
        >
          <path
            d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91.575.101.79-.244.79-.546 0-.273-.014-1.178-.014-2.142-2.889.532-3.636-.704-3.866-1.35-.13-.331-.69-1.352-1.18-1.625-.402-.216-.977-.748-.014-.762.906-.014 1.553.834 1.769 1.179 1.035 1.74 2.688 1.25 3.349.948.1-.747.402-1.25.733-1.538-2.559-.287-5.232-1.279-5.232-5.678 0-1.25.445-2.285 1.178-3.09-.115-.288-.517-1.467.115-3.048 0 0 .963-.302 3.163 1.179.92-.259 1.897-.388 2.875-.388.977 0 1.955.13 2.875.388 2.2-1.495 3.162-1.179 3.162-1.179.633 1.581.23 2.76.115 3.048.733.805 1.179 1.825 1.179 3.09 0 4.413-2.688 5.39-5.247 5.678.417.36.776 1.05.776 2.128 0 1.538-.014 2.774-.014 3.162 0 .302.216.662.79.547C20.709 21.637 24 17.324 24 12.25 24 5.896 18.854.75 12.5.75Z"
          ></path></svg
      ></a>
    </div>
    <div
      class="prose dark:prose-invert my-10 mt-10"
      ref="container"
      style="max-width: 100%"
    ></div>
    <div class="h-[100px]"></div>
  </div>
</template>
<
