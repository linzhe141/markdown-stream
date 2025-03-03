import { getMarkdownStreamAst } from "../src";
import { expect, test } from "vitest";
import { createStream } from "./testUtils";

test(`basic  heading`, async () => {
  const md = `# H1H1H1H1H1
## H2H2H2H2H2
### H3H3H3H3H3`;
  const ast = await getMarkdownStreamAst(createStream(md));
  expect(ast.map((i) => JSON.stringify(i))).toMatchSnapshot();
});

test(`heading with inline code`, async () => {
  const md1 = `# \`bar\``;
  const ast1 = await getMarkdownStreamAst(createStream(md1));
  expect(ast1.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md2 = `# foo \`bar\``;
  const ast2 = await getMarkdownStreamAst(createStream(md2));
  expect(ast2.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md3 = `# \`bar\` for`;
  const ast3 = await getMarkdownStreamAst(createStream(md3));
  expect(ast3.map((i) => JSON.stringify(i))).toMatchSnapshot();
});

test(`heading with "*"`, async () => {
  const md1 = `# *\`bar\`*`;
  const ast1 = await getMarkdownStreamAst(createStream(md1));
  expect(ast1.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md2 = `# *foo* \`bar\``;
  const ast2 = await getMarkdownStreamAst(createStream(md2));
  expect(ast2.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md3 = `# \`bar\` *for*`;
  const ast3 = await getMarkdownStreamAst(createStream(md3));
  expect(ast3.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md4 = `# *\`bar\` for*`;
  const ast4 = await getMarkdownStreamAst(createStream(md4));
  expect(ast4.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md5 = `# *\`bar\` for*zzz`;
  const ast5 = await getMarkdownStreamAst(createStream(md5));
  expect(ast5.map((i) => JSON.stringify(i))).toMatchSnapshot();
});

test(`heading with "**"`, async () => {
  const md1 = `# **\`bar\`**`;
  const ast1 = await getMarkdownStreamAst(createStream(md1));
  expect(ast1.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md2 = `# **foo** \`bar\``;
  const ast2 = await getMarkdownStreamAst(createStream(md2));
  expect(ast2.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md3 = `# \`bar\` **for**`;
  const ast3 = await getMarkdownStreamAst(createStream(md3));
  expect(ast3.map((i) => JSON.stringify(i))).toMatchSnapshot();
  const md4 = `# **\`bar\` for**`;
  const ast4 = await getMarkdownStreamAst(createStream(md4));
  expect(ast4.map((i) => JSON.stringify(i))).toMatchSnapshot();

  const md5 = `# **\`bar\` for**zzz`;
  const ast5 = await getMarkdownStreamAst(createStream(md5));
  expect(ast5.map((i) => JSON.stringify(i))).toMatchSnapshot();
});
