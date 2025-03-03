import { getMarkdownStreamAst } from "../src";
import { expect, test } from "vitest";
import { createStream } from "./testUtils";

test(`basic  italic`, async () => {
  const md = `
*foo\`bar\`zzzzzzzz*ggg

*xxxx*

*\`linzhe\`*
`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});

test(`italic with inline code`, async () => {
  const md = `aaa*\`bar\` foo \`zzz\`*bbb`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});
