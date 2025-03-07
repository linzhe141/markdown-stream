import { ChunkData } from "./core/stream-tokenizer";
import { createStreamTransform } from "./core/stream-transform";
import {
  renderer as defaultRenderer,
  type RendererOptions,
} from "./core/renderer";
export async function createMarkdownStreamRender(
  stream: ReadableStream,
  container: Element,
  renderer: RendererOptions = defaultRenderer
) {
  const transformedStream = createStreamTransform(stream);
  const reader = transformedStream.getReader();

  const stack: Element[] = [];
  const {
    createParagraph,
    createParagraphContainer,
    createCodeBlock,
    createHeading,
    createInlineCode,
    createItalic,
    createStrong,
    createList,
    createListItem,
  } = renderer;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const { type, chunk, operate } = value as ChunkData;
    if (operate === "blockOpen") {
      switch (type) {
        case "paragraphOpen": {
          const dom = createParagraph();
          stack.push(dom);
          container.appendChild(dom);
          break;
        }
        case "headingType": {
          const dom = createHeading(chunk.length);
          stack.push(dom);
          container.appendChild(dom);
          break;
        }
        case "inlineCodeOpen": {
          const t = createParagraphContainer();
          const dom = createInlineCode();
          t.appendChild(dom);
          stack.push(t);
          stack.push(dom);
          container.appendChild(t);
          break;
        }
        case "italicOpen": {
          const t = createParagraphContainer();
          const dom = createItalic();
          t.appendChild(dom);
          stack.push(t);
          stack.push(dom);
          container.appendChild(t);
          break;
        }
        case "strongOpen": {
          const t = createParagraphContainer();
          const dom = createStrong();
          t.appendChild(dom);
          stack.push(t);
          stack.push(dom);
          container.appendChild(t);
          break;
        }
        case "codeBlockOpen": {
          const dom = createCodeBlock();
          stack.push(dom);
          container.appendChild(dom);
          break;
        }
        case "listOpen": {
          const dom = createList();
          stack.push(dom);
          container.appendChild(dom);
          break;
        }
      }
    } else {
      const last = stack[stack.length - 1];
      if (last) {
        switch (type) {
          case "inlineCodeOpen": {
            const inlineCode = createInlineCode();
            last.appendChild(inlineCode);
            stack.push(inlineCode);
            break;
          }
          case "inlineCode": {
            const inlineCode = stack[stack.length - 1];
            if (inlineCode) {
              const textNode = document.createTextNode(value.chunk);
              inlineCode.appendChild(textNode);
            }
            break;
          }
          case "inlineCodeClose": {
            stack.pop();
            break;
          }
          case "italicOpen": {
            const italicCode = createItalic();
            last.appendChild(italicCode);
            stack.push(italicCode);
            break;
          }
          case "italic": {
            const italicCode = stack[stack.length - 1];
            if (italicCode) {
              const textNode = document.createTextNode(value.chunk);
              italicCode.appendChild(textNode);
            }
            break;
          }
          case "italicClose": {
            stack.pop();
            break;
          }
          case "strongOpen": {
            const strongCode = createStrong();
            last.appendChild(strongCode);
            stack.push(strongCode);
            break;
          }
          case "strong": {
            const strongCode = stack[stack.length - 1];
            if (strongCode) {
              const textNode = document.createTextNode(value.chunk);
              strongCode.appendChild(textNode);
            }
            break;
          }
          case "strongClose": {
            stack.pop();
            break;
          }
          case "codeBlockMeta": {
            const codeBlockMeta = last.querySelector(".code-block-meta")!;
            codeBlockMeta.textContent = chunk;
            break;
          }
          case "codeBlock": {
            const codeWrapper = last.querySelector(".code-wrapper")!;
            const textNode = document.createTextNode(value.chunk);
            codeWrapper.appendChild(textNode);
            break;
          }
          case "codeBlockClose": {
            stack.pop();
            break;
          }
          case "listOpen": {
            const dom = createList();
            last.appendChild(dom);
            stack.push(dom);
            break;
          }
          case "listItemOpen": {
            const listItem = createListItem();
            last.appendChild(listItem);
            stack.push(listItem);
            break;
          }
          case "listItemContent": {
            const listItem = stack[stack.length - 1];
            if (listItem) {
              const textNode = document.createTextNode(value.chunk);
              listItem.appendChild(textNode);
            }
            break;
          }
          case "listItemClose": {
            stack.pop();
            break;
          }
          case "listClose": {
            stack.pop();
            break;
          }

          default: {
            const textNode = document.createTextNode(value.chunk);
            last.appendChild(textNode);
            break;
          }
        }
      }
    }
  }
}

export async function getMarkdownStreamAst(stream: ReadableStream) {
  const transformedStream = createStreamTransform(stream);
  const ast: ChunkData[] = [];
  const reader = transformedStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    ast.push(value);
  }
  return ast;
}

export async function processMarkdownStreamChunk(
  stream: ReadableStream,
  handler: (ast: ChunkData) => void
) {
  const transformedStream = createStreamTransform(stream);
  const reader = transformedStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    handler(value);
  }
}
