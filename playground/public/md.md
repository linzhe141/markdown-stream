Sure! Below is a simple `v-for` example in Vue 3. This example iterates over an array and renders each item in the array as a list item.

# Code Example _vue3 todo list_

```html filename="app.vue"
<template>
  <div>
    <h1>Vue 3 v-for Example</h1>
    <ul>
      <li v-for="(item, index) in items" :key="index">
        {{ index + 1 }}. {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
  import { ref } from "vue";

  export default {
    setup() {
      // Define an array of strings
      const items = ref(["Apple", "Banana", "Orange", "Grape", "Mango"]);

      return {
        items,
      };
    },
  };
</script>

<style>
  /* Simple styles */
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    margin: 10px 0;
    font-size: 18px;
  }
</style>
```

### Code Explanation

- **`v-for` directive**: `v-for` is used to iterate over the `items` array and render each element as an `<li>` tag.
  - _Supports nested lists_
- **`key` attribute**: `key` is a unique identifier used by Vue to track each node. Here, `index` is used as the `key`.
  - _Supports nested lists_
  - _Supports nested lists_
    - _Supports nested lists_
  - _Supports nested lists_
- **`ref`**: `ref` is used to create a reactive array `items`.
- **Template**: The template renders a title and an unordered list, with each list item displaying an element from the array.

### Running Effect

The page will display a title and a list with the following items:

```
1. Apple
2. Banana
3. Orange
4. Grape
5. Mango
```

You can modify the contents of the `items` array as needed, and the list will automatically update. I hope this example is helpful! If you have any other questions, feel free to ask!
