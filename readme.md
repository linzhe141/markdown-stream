# markdown-streamx

Tranform a stream of Markdown into HTML

[Live Demo](https://linzhe141.github.io/markdown-stream/)

## Usage

```ts
import { createMarkdownStreamRender } from "markdown-streamx";

async function procressFoo() {
  // for example, a LLM markdown stream
  // const response = await fetch("/api/chat", {
  //   method: "POST",
  //   body: JSON.stringify({
  //     question: "使用vue3写一个 v-for demo",
  //   }),
  // });
  // const markdownStream = response.body;

  const markdownStream = createStream(md);
  const container = document.createElement("div");
  document.body.appendChild(container);
  await createMarkdownStreamRender(markdownStream, container);
}
```
