# markdown-streamx

> [!IMPORTANT]
> Just a toy
>
> `markdown-streamx` does not check whether the input is a complete and correct，so you must ensure that the markdown you enter is normal and there is no strange usage.

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
  //     question: "Write a v-for demo using Vue 3",
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

```js
// md: aaa*\`bar\` foo \`zzz\`*bbb
// chunkSize=10: ['aaa*`bar` ', 'foo `zzz`*', 'bbb']

processMarkdownStreamChunk(stream, (ast) => {
  console.log(ast);
});
// "{"operate":"blockOpen","type":"paragraphOpen","chunk":"paragraphOpen"}",
// "{"operate":"append","type":"text","chunk":"aaa"}",
// "{"operate":"append","type":"italicOpen","chunk":"*"}",
// "{"operate":"append","type":"inlineCodeOpen","chunk":"\`"}",
// "{"operate":"append","type":"inlineCode","chunk":"bar"}",
// "{"operate":"append","type":"inlineCodeClose","chunk":"\`"}",
// "{"operate":"append","type":"italic","chunk":" "}",
// "{"operate":"append","type":"italic","chunk":"foo "}",
// "{"operate":"append","type":"inlineCodeOpen","chunk":"\`"}",
// "{"operate":"append","type":"inlineCode","chunk":"zzz"}",
// "{"operate":"append","type":"inlineCodeClose","chunk":"\`"}",
// "{"operate":"append","type":"italicClose","chunk":"*"}",
// "{"operate":"append","type":"text","chunk":"bbb"}",
```
