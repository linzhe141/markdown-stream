export type State =
  | "text"
  | "maybeNewLine"
  | "newLine"
  | "maybeCodeBlockOpen"
  | "maybeCodeBlockClose"
  | "codeBlockOpen"
  | "codeBlockMeta"
  | "codeBlock"
  | "codeBlockClose"
  | "headingType"
  | "headingContent"
  | "inlineCodeOpen"
  | "inlineCode"
  | "inlineCodeClose"
  | "italicOpen"
  | "italic"
  | "italicClose"
  | "maybeStrongOpen"
  | "maybeStrongClose"
  | "strongOpen"
  | "strong"
  | "strongClose"
  | "listOpen"
  | "listItemOpen"
  | "listItemContent"
  | "listItemClose"
  | "listClose"
  | "maybeListClose";

export type ChunkData = {
  operate: "blockOpen" | "append";
  type: State;
  chunk: string;
};
export class StreamTokenizer {
  state: State = "newLine";
  chunkTypeStack: ChunkData["type"][] = [];
  completeChunks: string[] = [];
  completeChunkItem: string[] = [];
  codeBlockIndex = 0;
  newLineIndex = 0;
  strongIndex = 0;
  headingIndex = 0;
  controller: TransformStreamDefaultController = null!;

  processPossiblePreviousChunk(type: ChunkData["type"]) {
    if (this.completeChunkItem.length) {
      const content = this.completeChunkItem.join("");
      this.enqueue(content, type);
      this.completeChunks.push(content);
    }
  }
  enqueueCompleteChunk(type: ChunkData["type"]) {
    const content = this.completeChunkItem.join("");
    this.enqueue(content, type);
    this.completeChunks.push(content);
    this.completeChunkItem = [];
  }
  enqueue(
    content: string,
    type: ChunkData["type"],
    operate?: ChunkData["operate"]
  ) {
    const chunkData: ChunkData = {
      operate:
        operate ?? (this.completeChunks.length === 0 ? "blockOpen" : "append"),
      type,
      chunk: content,
    };
    this.controller.enqueue(chunkData);
  }
  parseChunk(chunk: string) {
    let index = 0;

    while (index < chunk.length) {
      const c = chunk[index];
      switch (this.state) {
        case "maybeNewLine": {
          this.stateMaybeNewline(c, index, chunk);
          break;
        }
        case "newLine": {
          this.stateNewLine(c, index, chunk);
          break;
        }
        case "listItemOpen": {
          this.stateListItem(c, index, chunk);
          break;
        }
        case "listItemContent": {
          this.stateListItemContent(c, index, chunk);
          break;
        }
        case "maybeListClose": {
          this.stateMaybeListClose(c, index, chunk);
          break;
        }

        case "text": {
          this.stateText(c, index, chunk);
          break;
        }
        case "inlineCodeOpen": {
          this.stateInlineCodeOpen(c);
          break;
        }
        case "inlineCode": {
          this.stateInlineCode(c, index, chunk);
          break;
        }
        case "inlineCodeClose": {
          this.stateInlineCodeClose(c);
          break;
        }
        case "italicOpen": {
          this.stateItalicOpen(c);
          break;
        }
        case "italic": {
          this.stateItalic(c, index, chunk);
          break;
        }
        case "italicClose": {
          this.stateItalicClose(c);
          break;
        }

        case "maybeStrongOpen": {
          this.stateMaybeStrongOpen(c, index, chunk);
          break;
        }
        case "maybeStrongClose": {
          this.stateMaybeStrongClose(c, index, chunk);
          break;
        }
        case "strongOpen": {
          this.stateStrongOpen(c);
          break;
        }
        case "strong": {
          this.stateStrong(c, index, chunk);
          break;
        }

        case "maybeCodeBlockOpen": {
          this.stateMaybeCodeBlockOpen(c, index, chunk);
          break;
        }
        case "codeBlockMeta": {
          this.stateCodeBlockMeta(c);
          break;
        }
        case "codeBlock": {
          this.stateCodeBlock(c, index, chunk);
          break;
        }
        case "maybeCodeBlockClose": {
          this.stateMaybeCodeBlockClose(c, index, chunk);
          break;
        }
        case "headingType": {
          this.stateHeadingType(c);
          break;
        }
        case "headingContent": {
          this.stateHeadingContent(c, index, chunk);
          break;
        }
      }
      index++;
    }
  }

  stateMaybeNewline(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.completeChunkItem.push(c);
      if (this.newLineIndex === 1) {
        this.chunkTypeStack.push("newLine");
        this.state = "newLine";
      } else {
        this.newLineIndex++;
      }
    } else if (c === "`") {
      this.completeChunkItem = [];
      this.state = "maybeCodeBlockOpen";
      this.codeBlockIndex = 0;

      this.stateMaybeCodeBlockOpen(c, index, chunk);
    } else if (c === "-") {
      this.completeChunks = [];
      this.chunkTypeStack = [];
      this.completeChunkItem = [];

      this.state = "listItemOpen";
      this.stateListItem(c, index, chunk);
    } else if (c === "#") {
      this.completeChunks = [];
      this.chunkTypeStack = [];
      this.completeChunkItem = [];

      this.state = "headingType";
      this.headingIndex = 0;
      this.stateHeadingType(c);
    } else {
      // 不需要这个 \n
      this.completeChunkItem = [];

      const prevChunkType =
        this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
      this.state = prevChunkType;
      if (prevChunkType === "text") {
        this.stateText(c, index, chunk);
      }
    }
  }
  stateListItem(c: string, index: number, chunk: string) {
    if (c === "-") {
      this.completeChunkItem.push(c);
    } else if (c === " ") {
      this.processPossiblePreviousChunk("listItemOpen");
      this.completeChunkItem = [];

      this.state = "listItemContent";
      this.chunkTypeStack.push("listItemContent");
    }
  }
  stateListItemContent(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.processPossiblePreviousChunk("text");

      this.enqueue("listItemClose", "listItemClose");
      this.completeChunks.push("listItemClose");

      this.state = "maybeListClose";
      this.completeChunkItem = [];
    } else if (c === "`") {
      this.processPossiblePreviousChunk("text");
      this.completeChunkItem = [];

      this.state = "inlineCodeOpen";
      this.stateInlineCodeOpen(c);
    } else if (c === "*") {
      this.processPossiblePreviousChunk("text");
      this.completeChunkItem = [];

      this.state = "maybeStrongOpen";
      this.strongIndex = 0;
      this.stateMaybeStrongOpen(c, index, chunk);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("text");
      }
    }
  }

  stateMaybeListClose(c: string, index: number, chunk: string) {
    if (c === "-") {
      this.state = "listItemOpen";
      this.stateListItem(c, index, chunk);
    } else {
      this.enqueue("listClose", "listClose");
      this.completeChunks.push("listClose");

      this.chunkTypeStack = [];
      this.completeChunks = [];
      this.completeChunkItem = [];

      this.state = "text";
      this.stateText(c, index, chunk);
    }
  }

  stateNewLine(c: string, index: number, chunk: string) {
    this.chunkTypeStack = [];
    this.completeChunks = [];
    this.completeChunkItem = [];
    if (c === "\n") return;
    if (c === "`") {
      this.chunkTypeStack.push("text");
      this.state = "maybeCodeBlockOpen";
      this.codeBlockIndex = 0;
      this.stateMaybeCodeBlockOpen(c, index, chunk);
    } else if (c === "-") {
      this.enqueue("listOpen", "listOpen");
      this.completeChunks.push("listOpen");
      this.state = "listItemOpen";
      this.stateListItem(c, index, chunk);
    } else if (c === "#") {
      this.state = "headingType";
      this.headingIndex = 0;
      this.stateHeadingType(c);
    } else if (c === "*") {
      this.chunkTypeStack.push("text");
      this.state = "maybeStrongOpen";
      this.strongIndex = 0;
      this.stateMaybeStrongOpen(c, index, chunk);
    } else {
      this.state = "text";
      this.chunkTypeStack.push("text");
      this.stateText(c, index, chunk);
    }
  }

  stateText(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.state = "maybeNewLine";
      this.processPossiblePreviousChunk("text");
      this.completeChunkItem = [];
      this.newLineIndex = 0;
      this.stateMaybeNewline(c, index, chunk);
    } else if (c === "`") {
      this.processPossiblePreviousChunk("text");
      this.completeChunkItem = [];

      this.state = "inlineCodeOpen";
      this.stateInlineCodeOpen(c);
    } else if (c === "*") {
      this.processPossiblePreviousChunk("text");
      this.completeChunkItem = [];

      this.state = "maybeStrongOpen";
      this.strongIndex = 0;
      this.stateMaybeStrongOpen(c, index, chunk);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("text");
      }
    }
  }

  stateInlineCodeOpen(c: string) {
    if (c === "`") {
      this.completeChunkItem.push(c);
      this.enqueue(c, "inlineCodeOpen");
      this.completeChunkItem = [];
      this.state = "inlineCode";
      this.chunkTypeStack.push("inlineCode");
    }
  }
  stateInlineCode(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.processPossiblePreviousChunk("inlineCode");
      this.completeChunkItem = [];

      this.state = "inlineCodeClose";
      this.stateInlineCodeClose(c);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("inlineCode");
      }
    }
  }
  stateInlineCodeClose(c: string) {
    if (c === "`") {
      this.enqueue(c, "inlineCodeClose");
      this.completeChunkItem.push(c);
      this.completeChunkItem = [];

      this.chunkTypeStack.pop();
      const prevChunkType =
        this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
      this.state = prevChunkType as any;
    }
  }

  stateItalicOpen(c: string) {
    if (c === "*") {
      this.chunkTypeStack.push("italic");
      this.state = "italic";

      this.completeChunkItem.push(c);
      this.enqueue(c, "italicOpen");

      this.completeChunkItem = [];
    }
  }
  stateItalic(c: string, index: number, chunk: string) {
    if (c === "*") {
      this.processPossiblePreviousChunk("italic");
      this.completeChunkItem = [];

      this.state = "italicClose";
      this.stateItalicClose(c);
    } else if (c === "`") {
      this.processPossiblePreviousChunk("italic");
      this.completeChunkItem = [];

      this.state = "inlineCodeOpen";
      this.stateInlineCodeOpen(c);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("italic");
      }
    }
  }
  stateItalicClose(c: string) {
    if (c === "*") {
      this.enqueue(c, "italicClose");
      this.completeChunkItem.push(c);
      this.completeChunkItem = [];

      this.chunkTypeStack.pop();
      const prevChunkType =
        this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
      this.state = prevChunkType as any;
    }
  }

  stateMaybeStrongOpen(c: string, index: number, chunk: string) {
    if (c === "*") {
      this.completeChunkItem.push(c);
      if (this.strongIndex === 1) {
        this.processPossiblePreviousChunk("strongOpen");

        this.chunkTypeStack.push("strong");
        this.state = "strong";

        this.completeChunkItem = [];
      } else {
        this.strongIndex++;
      }
    } else {
      this.processPossiblePreviousChunk("italicOpen");

      this.chunkTypeStack.push("italic");
      this.state = "italic";

      this.completeChunkItem = [];
      this.stateItalic(c, index, chunk);
    }
  }
  stateMaybeStrongClose(c: string, index: number, chunk: string) {
    if (c === "*") {
      this.completeChunkItem.push(c);
      if (this.strongIndex === 0) {
        this.state = "strongClose";
        this.stateStrongClose();
      } else {
        this.strongIndex--;
      }
    } else {
      this.state = "strong";
      this.stateStrong(c, index, chunk);
    }
  }

  stateStrongOpen(c: string) {
    if (c === "*") {
      this.chunkTypeStack.push("strong");
      this.state = "strong";

      this.completeChunkItem = [];
    }
  }
  stateStrong(c: string, index: number, chunk: string) {
    if (c === "*") {
      this.processPossiblePreviousChunk("strong");
      this.completeChunkItem = [];

      this.state = "maybeStrongClose";
      this.stateMaybeStrongClose(c, index, chunk);
    } else if (c === "`") {
      this.processPossiblePreviousChunk("strong");
      this.completeChunkItem = [];

      this.state = "inlineCodeOpen";
      this.stateInlineCodeOpen(c);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("strong");
      }
    }
  }
  stateStrongClose() {
    this.processPossiblePreviousChunk("strongClose");
    this.completeChunkItem = [];

    this.chunkTypeStack.pop();
    const prevChunkType = this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
    this.state = prevChunkType as any;
  }

  stateMaybeCodeBlockOpen(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.completeChunkItem.push(c);
      if (this.codeBlockIndex === 2) {
        this.completeChunks = [];
        this.processPossiblePreviousChunk("codeBlockOpen");
        this.chunkTypeStack = [];
        this.completeChunkItem = [];

        this.state = "codeBlockMeta";
      } else {
        this.codeBlockIndex++;
      }
    } else {
      this.processPossiblePreviousChunk("inlineCodeOpen");
      this.completeChunkItem = [];
      this.state = "inlineCode";
      this.chunkTypeStack.push("inlineCode");
      this.stateInlineCode(c, index, chunk);
    }
  }

  stateCodeBlockMeta(c: string) {
    if (c === "\n") {
      this.processPossiblePreviousChunk("codeBlockMeta");

      this.completeChunkItem = [];
      this.state = "codeBlock";
    } else {
      this.completeChunkItem.push(c);
    }
  }
  stateCodeBlock(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.processPossiblePreviousChunk("codeBlock");
      this.completeChunkItem = [];

      this.state = "maybeCodeBlockClose";
      this.stateMaybeCodeBlockClose(c, index, chunk);
    } else {
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("codeBlock");
      }
    }
  }
  stateMaybeCodeBlockClose(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.completeChunkItem.push(c);
      if (this.codeBlockIndex === 0) {
        this.state = "codeBlockClose";
        this.stateCodeBlockClose();
      } else {
        this.codeBlockIndex--;
      }
    } else {
      this.state = "codeBlock";
      this.stateCodeBlock(c, index, chunk);
    }
  }
  stateCodeBlockClose() {
    this.processPossiblePreviousChunk("codeBlockClose");
    this.completeChunkItem = [];
    // TODO
    this.state = "newLine";
  }

  stateHeadingType(c: string) {
    if (c === "#") {
      this.completeChunkItem.push(c);
      this.headingIndex++;
    } else if (c === " ") {
      this.processPossiblePreviousChunk("headingType");
      this.completeChunkItem = [];

      this.state = "headingContent";
      this.chunkTypeStack.push("headingContent");
    }
  }
  stateHeadingContent(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.state = "newLine";
      this.processPossiblePreviousChunk("headingContent");

      this.completeChunkItem = [];
      this.completeChunks = [];
    } else if (c === "*") {
      this.processPossiblePreviousChunk("headingContent");
      this.completeChunkItem = [];

      this.state = "maybeStrongOpen";
      this.strongIndex = 0;
      this.stateMaybeStrongOpen(c, index, chunk);
    } else if (c === "`") {
      this.processPossiblePreviousChunk("headingContent");
      this.completeChunkItem = [];

      this.state = "inlineCodeOpen";
      this.stateInlineCodeOpen(c);
    } else {
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("headingContent");
      }
    }
  }
}
