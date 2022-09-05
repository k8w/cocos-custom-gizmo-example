Cocos 3.6 自定义 Gizmo
===

## 工作流程

1. 在 Scene 中，像往常一样制作 Prefab
2. 保存为 Prefab 前，在最外层套一个空 Node，挂载 `CustomEditorItem`
3. 开启 `editing`，可以往 `__GIZMO__` 中添加自定义的 GIZMO；可以拖入 `SpriteGizmo`，也可以使用自定义模型。
4. 关闭 `editing`，保存 Prefab。

> 提示
> `__GIZMO__` 及其资源不会显示和打包到版本中，可以放心使用。

## 注意事项
1. `CustomEditorItem` 必须挂载在【顶层空节点】
2. 在 Scene 中不可开启 `editing`，除非断开所有 `Prefab` 连接。