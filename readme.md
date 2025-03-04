# markdown-streamx

> [!IMPORTANT] A toy
> `markdown-streamx` does not check whether the input is a complete and correct

Tranform a stream of Markdown into HTML

[Live Demo](https://linzhe141.github.io/markdown-stream/)

## Usage

### createMarkdownStreamRender

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

### processMarkdownStreamChunk

```ts
const markdownStream = createStream(md);

processMarkdownStreamChunk(stream, (ast) => {
  console.log(ast);
});
```

> [!IMPORTANT]
> the `ast` in processMarkdownStreamChunk above

```snap
  "{"operate":"blockOpen","type":"italicOpen","chunk":"*"}",
  "{"operate":"append","type":"italic","chunk":"foo"}",
  "{"operate":"append","type":"inlineCodeOpen","chunk":"\`"}",
  "{"operate":"append","type":"inlineCode","chunk":"bar"}",
  "{"operate":"append","type":"inlineCodeClose","chunk":"\`"}",
  "{"operate":"append","type":"italic","chunk":"zzzzzzzz"}",
  "{"operate":"append","type":"italicClose","chunk":"*"}",
  "{"operate":"append","type":"text","chunk":"g"}",
  "{"operate":"append","type":"text","chunk":"gg"}",
  "{"operate":"blockOpen","type":"italicOpen","chunk":"*"}",
  "{"operate":"append","type":"italic","chunk":"xxxx"}",
  "{"operate":"append","type":"italicClose","chunk":"*"}",
  "{"operate":"blockOpen","type":"italicOpen","chunk":"*"}",
  "{"operate":"append","type":"inlineCodeOpen","chunk":"\`"}",
  "{"operate":"append","type":"inlineCode","chunk":"linzhe"}",
  "{"operate":"append","type":"inlineCodeClose","chunk":"\`"}",
  "{"operate":"append","type":"italicClose","chunk":"*"}",
```
