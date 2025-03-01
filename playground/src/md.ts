export const md = `好的！下面 Vue 3 的简单 \`v-for\` 示例。这个示例会遍历一个数组，并将数组中的每一项渲染为一个列表项。

# 代码示例 vue3 todo list

\`\`\`html  filename="app.vue"
<template>
  <div>
    <h1>Vue 3 v-for 示例</h1>
    <ul>
      <li v-for="(item, index) in items" :key="index">
        {{ index + 1 }}. {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  setup() {
    // 定义一个包含字符串的数组
    const items = ref(['苹果', '香蕉', '橙子', '葡萄', '芒果']);

    return {
      items,
    };
  },
};
</script>

<style>
/* 简单的样式 */
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 10px 0;
  font-size: 18px;
}
</style>
\`\`\`

### 代码说明
1. **\`v-for\` 指令**：\`v-for\` 用于遍历数组 \`items\`，并将每个元素渲染为一个 \`<li>\` 标签。
2. **\`key\` 属性**：\`key\` 是 Vue 用于跟踪每个节点的唯一标识，这里使用 \`index\` 作为 \`key\`。
3. **\`ref\`**：使用 \`ref\` 创建一个响应式数组 \`items\`。
4. **模板**：在模板中渲染一个标题和一个无序列表，列表项的内容是数组中的每个元素。

### 运行效果
页面会显示一个标题和一个列表，列表项为：
\`\`\`
1. 苹果
2. 香蕉
3. 橙子
4. 葡萄
5. 芒果
\`\`\`

你可以根据需要修改 \`items\` 数组的内容，列表会自动更新。希望这个示例对你有帮助！如果有其他问题，随时问我哦！`;
