import { getMarkdownStreamAst } from "../src";
import { expect, test } from "vitest";
import { createStream } from "./testUtils";

test(`list basic`, async () => {
  const md = `- **\`v-for\` 指令**：\`v-for\` 用于遍历数组 \`items\`，并将每个元素渲染为一个 \`<li>\` 标签。
- **模板**：foo`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});

test(`nested list`, async () => {
  const md = `- xxx
  - yyy
    - 222
  - aaa
- 333
`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});

test(`multiple lists with text in between`, async () => {
  const md = `- xxx
  - yyy
    - 222
  - aaa
- 333

aaaaaaaaaa

- xxx
  - yyy
    - 222
  - aaa
- 333
`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});
