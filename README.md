Cocos 3.6 自定义 Gizmo 和 Editor 物件
===

## 效果预览

1. Prefab：（包含多个子节点和自定义 GIZMO）

![image](https://user-images.githubusercontent.com/1681689/188359730-608763ad-c06b-4d60-ac26-e6bf60579620.png)

2. 场景编辑：（看不见 Prefab 细节，防止误修改）

![image](https://user-images.githubusercontent.com/1681689/188359795-c2f9b26b-1756-4e0b-89dc-f472ae9647ad.png)

3. 构建和实际运行：（剔除自定义 GIZMO）

![image](https://user-images.githubusercontent.com/1681689/188359828-7f519d7b-689b-4fb5-bdaa-0464994697af.png)


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