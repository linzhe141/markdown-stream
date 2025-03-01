import { ChunkData } from "./core/stream-tokenizer";
import { createStreamTransform } from "./core/stream-transform";

export async function createMarkdownStreamRender(
  stream: ReadableStream,
  container: Element
) {
  injectCopyToClipboard();
  const transformedStream = createStreamTransform(stream);

  const reader = transformedStream.getReader();
  const stack: Element[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const { type, chunk, operate } = value as ChunkData;
    if (operate === "blockOpen") {
      if (type === "text") {
        const dom = document.createElement("p");
        stack.push(dom);
        dom.textContent = value.chunk;
        container.appendChild(dom);
      } else if (type === "headingType") {
        const dom = document.createElement("h" + chunk.length);
        stack.push(dom);
        container.appendChild(dom);
      } else if (type === "inlineCodeOpen") {
        const dom = document.createElement("code");
        stack.push(dom);
        container.appendChild(dom);
      } else if (type === "codeBlockOpen") {
        const s = document.createElement("div");
        s.innerHTML = `<div class="code-block" style="border-color: #334155;border-radius: 4px;border: 1px solid;overflow: hidden;">
              <div style="padding:0 16px;display: flex;justify-content: space-between; background: #334155; position: sticky;top: 0;">
                <div class="lang code-block-meta"></div>
                <div onclick="_smd_copyToClipboard__(this)" style="display: flex; align-items: center;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-xs"><path d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="currentColor"></path></svg>
                  <span style="margin-left: 8px;">copy</span>
                </div>
              </div>
              <pre style="margin:0"><code class="code-wrapper"></code></pre>
            </div>
          `;
        const dom = s.firstElementChild!;
        stack.push(dom);
        container.appendChild(dom);
      }
    } else {
      const last = stack[stack.length - 1];
      if (last) {
        if (type === "inlineCodeOpen") {
          const inlineCode = document.createElement("code");
          last.appendChild(inlineCode);
          stack.push(inlineCode);
        } else if (type === "inlineCode") {
          const inlineCode = stack[stack.length - 1];
          if (inlineCode) {
            const textNode = document.createTextNode(value.chunk);
            inlineCode.appendChild(textNode);
          }
        } else if (type === "inlineCodeClose") {
          stack.pop();
        } else if (type === "codeBlockMeta") {
          const codeBlockMeta = last.querySelector(".code-block-meta")!;
          codeBlockMeta.textContent = chunk;
        } else if (type === "codeBlock") {
          const codeWrapper = last.querySelector(".code-wrapper")!;
          const textNode = document.createTextNode(value.chunk);
          codeWrapper.appendChild(textNode);
        } else {
          const textNode = document.createTextNode(value.chunk);
          last.appendChild(textNode);
        }
      }
    }
  }
}

function injectCopyToClipboard() {
  if ((window as any)._smd_copyToClipboard__) return;
  (window as any)._smd_copyToClipboard__ = function (wrapper: Element) {
    const spanEl = wrapper.querySelector("span")!;
    spanEl.textContent = "copied!";
    setTimeout(() => (spanEl.textContent = "copy"), 2000);
    let nextSibling = wrapper.parentNode?.nextSibling;
    let preElement;
    while (nextSibling) {
      if (
        nextSibling.nodeType === 1 &&
        (nextSibling as Element).tagName === "PRE"
      ) {
        preElement = nextSibling;
        break;
      }
      nextSibling = nextSibling.nextSibling;
    }
    const textContent = preElement?.textContent;
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
  };
}
