export type State =
  | "text"
  | "newLine"
  | "maybeCodeBlockOpen"
  | "maybeCodeBlockClose"
  | "codeBlockMeta"
  | "codeBlock"
  | "headingType"
  | "headingContent"
  | "inlineCodeOpen"
  | "inlineCode"
  | "inlineCodeClose";
export type ChunkData = {
  operate: "blockOpen" | "append";
  type:
    | "text"
    | "codeBlockOpen"
    | "codeBlockMeta"
    | "codeBlock"
    | "codeBlockClose"
    | "headingType"
    | "headingContent"
    | "inlineCodeOpen"
    | "inlineCode"
    | "inlineCodeClose";
  chunk: string;
};

export class StreamTokenizer {
  state: State = "text";
  completeChunks: string[] = [];
  completeChunkItem: string[] = [];
  chunksDebugInfo: any[] = [];
  codeBlockIndex = 0;
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
        case "text": {
          this.stateText(c, index, chunk);
          break;
        }
        case "inlineCodeOpen": {
          this.stateInlineCodeOpen(c, index, chunk);
          break;
        }
        case "inlineCode": {
          this.stateInlineCode(c, index, chunk);
          break;
        }
        case "inlineCodeClose": {
          this.stateInlineCodeClose(c, index, chunk);
          break;
        }
        case "newLine": {
          this.stateNewLine(c, index, chunk);
          break;
        }
        case "maybeCodeBlockOpen": {
          this.stateMaybeCodeBlockOpen(c, index, chunk);
          break;
        }
        case "codeBlockMeta": {
          this.stateCodeBlockMeta(c, index, chunk);
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
          this.stateHeadingType(c, index, chunk);
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

  stateText(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.state = "newLine";
      this.processPossiblePreviousChunk("text");
      // this.chunksDebugInfo.push(this.completeChunks)
      this.completeChunkItem = [];
      this.completeChunks = [];
    } else if (c === "`") {
      this.processPossiblePreviousChunk("text");
      this.completeChunkItem = [];

      this.state = "inlineCodeOpen";
      this.stateInlineCodeOpen(c, index, chunk);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("text");
      }
    }
  }

  stateInlineCodeOpen(c: string, _index: number, _chunk: string) {
    if (c === "`") {
      this.completeChunkItem.push(c);
      this.enqueue(c, "inlineCodeOpen");
      this.completeChunkItem = [];
      this.state = "inlineCode";
    }
  }
  stateInlineCode(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.processPossiblePreviousChunk("inlineCode");
      this.completeChunkItem = [];

      this.state = "inlineCodeClose";
      this.stateInlineCodeClose(c, index, chunk);
    } else {
      // 其他字符
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("inlineCode");
      }
    }
  }
  stateInlineCodeClose(c: string, _index: number, _chunk: string) {
    if (c === "`") {
      this.enqueue(c, "inlineCodeClose");
      this.completeChunkItem.push(c);
      this.completeChunkItem = [];
      this.state = "text";
    }
  }
  stateNewLine(c: string, index: number, chunk: string) {
    // if (c === "\n") return
    if (c === "`") {
      this.state = "maybeCodeBlockOpen";
      this.codeBlockIndex = 0;
      this.stateMaybeCodeBlockOpen(c, index, chunk);
    } else if (c === "#") {
      this.state = "headingType";
      this.headingIndex = 0;
      this.stateHeadingType(c, index, chunk);
    } else {
      this.state = "text";
      this.stateText(c, index, chunk);
    }
  }
  stateMaybeCodeBlockOpen(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.completeChunkItem.push(c);
      if (this.codeBlockIndex === 2) {
        this.processPossiblePreviousChunk("codeBlockOpen");
        this.completeChunkItem = [];

        this.state = "codeBlockMeta";
      } else {
        this.codeBlockIndex++;
      }
    } else {
      this.processPossiblePreviousChunk("inlineCodeOpen");
      this.completeChunkItem = [];
      this.state = "inlineCode";
      this.stateInlineCode(c, index, chunk);
    }
  }

  stateCodeBlockMeta(c: string, _index: number, _chunk: string) {
    if (c === "\n") {
      this.processPossiblePreviousChunk("codeBlockMeta");

      // this.chunksDebugInfo.push(this.completeChunks)
      this.completeChunkItem = [];
      // this.completeChunks = []
      this.state = "codeBlock";
    } else {
      this.completeChunkItem.push(c);
    }
  }
  stateCodeBlock(c: string, index: number, chunk: string) {
    if (c === "`") {
      this.state = "maybeCodeBlockClose";
      this.codeBlockIndex = 0;
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
      if (this.codeBlockIndex === 2) {
        this.completeChunkItem = this.completeChunkItem.splice(
          0,
          this.completeChunkItem.length - 3
        );
        const content = this.completeChunkItem.join("");
        this.enqueue(content, "codeBlock");
        this.completeChunks.push(content);
        this.completeChunkItem = [];
        this.completeChunks = [];

        this.enqueue("```", "codeBlockClose");
        this.completeChunkItem = [];
        this.completeChunks = [];
        this.state = "text";
      } else {
        this.codeBlockIndex++;
      }
    } else {
      this.state = "codeBlock";
      this.stateCodeBlock(c, index, chunk);
    }
  }
  stateHeadingType(c: string, _index: number, _chunk: string) {
    if (c === "#") {
      this.completeChunkItem.push(c);
      this.headingIndex++;
    } else if (c === " ") {
      this.processPossiblePreviousChunk("headingType");
      this.completeChunkItem = [];

      this.state = "headingContent";
    }
  }
  stateHeadingContent(c: string, index: number, chunk: string) {
    if (c === "\n") {
      this.state = "newLine";
      this.processPossiblePreviousChunk("headingContent");

      this.completeChunkItem = [];
      this.completeChunks = [];
    } else {
      this.completeChunkItem.push(c);
      if (index === chunk.length - 1) {
        this.enqueueCompleteChunk("headingContent");
      }
    }
  }
}
