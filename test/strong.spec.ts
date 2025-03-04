import { getMarkdownStreamAst } from "../src";
import { expect, test } from "vitest";
import { createStream } from "./testUtils";

test(`basic  strong`, async () => {
  const md = `
**xxxx**

**\`linzhe\`**
`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});

test(`strong with inline code`, async () => {
  const md = `aaa**\`bar\` foo \`zzz\`**bbb`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});


test(`strong with one newline`, async () => {
  const md = `*foo\`bar\`zzzzzzzz*ggg
*xxxx* 
*\`linzhe\`*`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});
