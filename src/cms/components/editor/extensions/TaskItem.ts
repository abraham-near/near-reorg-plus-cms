import TaskItem from '@tiptap/extension-task-item'

// Checkbox inputs and data-checked are removed by the sanitizer; keep state in a class.
export const SafeTaskItem = TaskItem.extend({
  addAttributes() { return { checked: { default: false, rendered: false, parseHTML: (element) => element.classList.contains('cms-task-checked') } } },
  parseHTML() { return [{ tag: 'li[data-type="taskItem"]', priority: 51, contentElement: 'div' }] },
  renderHTML({ node }) { return ['li', { 'data-type': 'taskItem', class: node.attrs.checked ? 'cms-task-checked' : 'cms-task-unchecked' }, ['span', { 'aria-hidden': 'true' }, node.attrs.checked ? '☑ ' : '☐ '], ['div', {}, 0]] },
}).configure({ nested: true })
