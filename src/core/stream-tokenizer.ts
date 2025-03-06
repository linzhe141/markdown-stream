export type State =
  | "newBlock"
  | "maybeNewBlock"
  | "paragraphOpen"
  | "paragraphClose"
  | "text"
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
  state: State = "newBlock";
  chunkTypeStack: ChunkData["type"][] = [];
  completeChunks: string[] = [];
  completeChunkItem: string[] = [];
  codeBlockIndex = 0;
  newLineIndex = 0;
  strongIndex = 0;
  headingIndex = 0;
  controller: TransformStreamDefaultController = null!;

  // 当是一个 paragraph 的 newBlock, 向ast中加入一个paragraphOpen标识
  processParagraphOpen() {
    this.enqueue("paragraphOpen", "paragraphOpen");
    this.completeChunks.push("paragraphOpen");
    this.chunkTypeStack.push("paragraphOpen");
    // paragraphOpen 时默认的chunkType是text
    // `java`foo foo-> 就是text
    this.chunkTypeStack.push("text");
  }
  // 当目前状态是“文本时”，处理`inlineCodeOpen`和`maybeStrongOpen`
  // 1. paragraph->text
  // 2. listItem->listItemContent
  // 3. heading->headingContent
  processSpecialInlineState(
    prevChunkType: State,
    c: "*" | "`",
    index: number,
    chunk: string
  ) {
    if (c === "`") {
      this.processPossiblePreviousChunk(prevChunkType);

      this.state = "inlineCodeOpen";
      this.stateInlineCodeOpen(c);
    } else if (c === "*") {
      this.processPossiblePreviousChunk(prevChunkType);

      this.state = "maybeStrongOpen";
      this.strongIndex = 0;
      this.stateMaybeStrongOpen(c, index, chunk);
    }
  }

  resetChunkDataWhenAsNewBlock() {
    this.completeChunks = [];
    this.chunkTypeStack = [];
    this.completeChunkItem = [];
  }

  processPossiblePreviousChunk(type: ChunkData["type"]) {
    if (this.completeChunkItem.length) {
      const content = this.completeChunkItem.join("");
      this.enqueue(content, type);
      this.completeChunks.push(content);
    }
    this.completeChunkItem = [];
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
        case "newBlock": {
          this.stateNewBlock(c, index, chunk);
          break;
        }
        case "maybeNewBlock": {
          this.stateMaybeNewBlock(c, index, chunk);
          break;
        }
        case "listItemOpen": {
          this.stateListItemOpen(c, index, chunk);
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

  stateNewBlock(c: string, index: number, chunk: string) {
    this.chunkTypeStack = [];
    this.completeChunks = [];
    this.completeChunkItem = [];
    if (c === "\n") return;
    if (c === "-") {
      this.enqueue("listOpen", "listOpen");
      this.completeChunks.push("listOpen");

      this.state = "listItemOpen";
      this.stateListItemOpen(c, index, chunk);
    } else if (c === "#") {
      this.state = "headingType";
      this.headingIndex = 0;
      this.stateHeadingType(c);
    } else if (c === "`") {
      this.processParagraphOpen();

      this.state = "maybeCodeBlockOpen";
      this.codeBlockIndex = 0;
      this.stateMaybeCodeBlockOpen(c, index, chunk);
    } else if (c === "*") {
      this.processParagraphOpen();

      this.state = "maybeStrongOpen";
      this.strongIndex = 0;
      this.stateMaybeStrongOpen(c, index, chunk);
    } else {
      this.processParagraphOpen();

      this.state = "text";
      this.stateText(c, index, chunk);
    }
  }

  stateMaybeNewBlock(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.completeChunkItem.push(c);
      if (this.newLineIndex === 1) {
        this.state = "newBlock";
      } else {
        this.newLineIndex++;
      }
    } else if (c === "`") {
      // 不需要单独的\n, 没有实际意义
      this.completeChunkItem = [];

      this.state = "maybeCodeBlockOpen";
      this.codeBlockIndex = 0;

      this.stateMaybeCodeBlockOpen(c, index, chunk);
    } else if (c === "-") {
      this.resetChunkDataWhenAsNewBlock();

      this.state = "listItemOpen";
      this.stateListItemOpen(c, index, chunk);
    } else if (c === "#") {
      this.resetChunkDataWhenAsNewBlock();

      this.state = "headingType";
      this.headingIndex = 0;
      this.stateHeadingType(c);
    } else {
      // 不需要单独的\n, 没有实际意义
      this.completeChunkItem = [];

      const prevChunkType =
        this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
      this.state = prevChunkType;
      // TODO 其他情况？
      // TODO 目前只考虑了在 text state 下的 maybeNewBlock
      /**
       * foo
       * bar
       */
      if (prevChunkType === "text") {
        this.stateText(c, index, chunk);
      }
    }
  }

  stateText(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.processPossiblePreviousChunk("text");

      this.state = "maybeNewBlock";
      this.newLineIndex = 0;
      this.stateMaybeNewBlock(c, index, chunk);
    } else if (c === "`" || c === "*") {
      this.processSpecialInlineState("text", c, index, chunk);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("text");
      }
    }
  }

  stateInlineCodeOpen(c: string) {
    this.enqueue(c, "inlineCodeOpen");

    this.state = "inlineCode";
    this.chunkTypeStack.push("inlineCode");
  }

  stateInlineCode(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.processPossiblePreviousChunk("inlineCode");

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
    this.enqueue(c, "inlineCodeClose");

    this.chunkTypeStack.pop();
    const prevChunkType = this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
    this.state = prevChunkType;
  }

  stateItalicOpen(c: string) {
    this.chunkTypeStack.push("italic");
    this.state = "italic";

    this.enqueue(c, "italicOpen");
  }

  stateItalic(c: string, index: number, chunk: string) {
    if (c === "*") {
      this.processPossiblePreviousChunk("italic");

      this.state = "italicClose";
      this.stateItalicClose(c);
    } else if (c === "`") {
      this.processPossiblePreviousChunk("italic");

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
    this.enqueue(c, "italicClose");

    this.chunkTypeStack.pop();
    const prevChunkType = this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
    this.state = prevChunkType;
  }

  stateMaybeStrongOpen(c: string, index: number, chunk: string) {
    if (c === "*") {
      this.completeChunkItem.push(c);
      if (this.strongIndex === 1) {
        this.processPossiblePreviousChunk("strongOpen");

        this.chunkTypeStack.push("strong");
        this.state = "strong";
      } else {
        this.strongIndex++;
      }
    } else {
      this.processPossiblePreviousChunk("italicOpen");

      this.chunkTypeStack.push("italic");
      this.state = "italic";

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
    this.chunkTypeStack.push("strong");
    this.state = "strong";

    this.completeChunkItem = [];
  }

  stateStrong(c: string, index: number, chunk: string) {
    if (c === "*") {
      this.processPossiblePreviousChunk("strong");

      this.state = "maybeStrongClose";
      this.stateMaybeStrongClose(c, index, chunk);
    } else if (c === "`") {
      this.processPossiblePreviousChunk("strong");

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

    this.chunkTypeStack.pop();
    const prevChunkType = this.chunkTypeStack[this.chunkTypeStack.length - 1]!;
    this.state = prevChunkType;
  }

  stateMaybeCodeBlockOpen(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.completeChunkItem.push(c);
      if (this.codeBlockIndex === 2) {
        this.completeChunks = [];
        this.processPossiblePreviousChunk("codeBlockOpen");
        this.chunkTypeStack = [];

        this.state = "codeBlockMeta";
      } else {
        this.codeBlockIndex++;
      }
    } else {
      this.processPossiblePreviousChunk("inlineCodeOpen");
      this.state = "inlineCode";
      this.chunkTypeStack.push("inlineCode");
      this.stateInlineCode(c, index, chunk);
    }
  }

  stateCodeBlockMeta(c: string) {
    if (c === "\n") {
      this.processPossiblePreviousChunk("codeBlockMeta");

      this.state = "codeBlock";
    } else {
      this.completeChunkItem.push(c);
    }
  }

  stateCodeBlock(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.processPossiblePreviousChunk("codeBlock");

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
    // TODO
    this.state = "newBlock";
  }

  stateHeadingType(c: string) {
    if (c === "#") {
      this.completeChunkItem.push(c);
      this.headingIndex++;
    } else if (c === " ") {
      this.processPossiblePreviousChunk("headingType");

      this.state = "headingContent";
      this.chunkTypeStack.push("headingContent");
    }
  }

  stateHeadingContent(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.state = "newBlock";
      this.processPossiblePreviousChunk("headingContent");

      this.completeChunks = [];
    } else if (c === "`" || c === "*") {
      this.processSpecialInlineState("headingContent", c, index, chunk);
    } else {
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("headingContent");
      }
    }
  }

  stateListItemOpen(c: string, index: number, chunk: string) {
    if (c === "-") {
      this.completeChunkItem.push(c);
    } else if (c === " ") {
      this.processPossiblePreviousChunk("listItemOpen");

      this.state = "listItemContent";
      this.chunkTypeStack.push("listItemContent");
    }
  }

  stateListItemContent(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.processPossiblePreviousChunk("listItemContent");

      this.enqueue("listItemClose", "listItemClose");
      this.completeChunks.push("listItemClose");

      this.state = "maybeListClose";
    } else if (c === "`" || c === "*") {
      this.processSpecialInlineState("listItemContent", c, index, chunk);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("listItemContent");
      }
    }
  }

  stateMaybeListClose(c: string, index: number, chunk: string) {
    if (c === "-") {
      this.state = "listItemOpen";
      this.stateListItemOpen(c, index, chunk);
    } else {
      this.enqueue("listClose", "listClose");
      this.completeChunks.push("listClose");

      // new Block
      this.state = "newBlock";
      this.stateNewBlock(c, index, chunk);
    }
  }
}
