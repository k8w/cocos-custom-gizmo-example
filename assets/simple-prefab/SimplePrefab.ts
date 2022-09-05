import { CCObject, Color, Component, geometry, gfx, Layers, Material, MeshRenderer, Node, primitives, utils, Vec3, _decorator } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode, playOnFocus } = _decorator;

const GIZMO_NAME = '__GIZMO__ (EDITOR_ONLY)';
const BOUND_GIZMO_NAME = '__BOUND__ (EDITOR ONLY)';
const BOUND_BOX_EXPAND = 0.01;

/**
 * ★★★ 制作 Prefab ★★★
 * 1. 挂载在 Prefab 的最外层节点上
 * 2. 在 Prefab 编辑面板中点开 editing -> 编辑 -> 保存
 * 3. 可以在 __GIZMO__ 中拖入 SpriteGizmo 来实现自定义 GIZMO
 * 4. 也可在 __GIZMO__ 中自由拖入其它 3D 模型或物体，GIZMO 仅在编辑器内可见，构建发布时会剔除
 * 
 * ★★★ 使用 Prefab ★★★
 * 1. 策划在场景中拖入 Prefab 直接使用（将不会看见 Prefab 的细节，也不会导致误修改）
 * 2. 将自动创建外层的包围盒，可以在场景编辑器内所见即所得的点选
 * 
 * ★★★ 已知问题 ★★★
 * 1. 使用 Prefab 时不要打开 editing 修改，除非已经解除 Prefab 关联（节点变为白色）
 */
@ccclass('SimplePrefab')
@executeInEditMode
@playOnFocus
export class SimplePrefab extends Component {

    private _editing: boolean = false;
    @property
    public get editing(): boolean {
        return this._editing;
    }
    public set editing(v: boolean) {
        this._editing = v;
        this._resetGizmo();
        (v ? this._unsetFlag : this._setFlag).call(this, this.node.children, CCObject.Flags.HideInHierarchy | CCObject.Flags.LockedInEditor);
        this._resetBounds();
    }

    start() {
        if (EDITOR) {
            this.hideFlags |= CCObject.Flags.EditorOnly;
            this.editing = false;
        }
        else {
            this.node.getChildByName(GIZMO_NAME)?.removeFromParent();
        }
    }

    update() {
        if (EDITOR && this._editing) {
            this._resetGizmo();
            this._resetBounds();
        }
    }

    private _resetGizmo() {
        if (EDITOR) {
            let node = this.node.getChildByName(GIZMO_NAME);
            if (!node) {
                node = new Node(GIZMO_NAME);
                this.node.addChild(node);
            }
            this._setFlag([node], CCObject.Flags.EditorOnly);
        }
    }

    protected _resetBounds() {
        let meshRenderer = this.getComponent(MeshRenderer) ?? this.addComponent(MeshRenderer)!;
        meshRenderer.hideFlags |= CCObject.Flags.AllHideMasks;

        meshRenderer.mesh = null;
        meshRenderer.material = null;

        let bound: geometry.AABB | undefined;
        this.node.getComponentsInChildren(MeshRenderer).forEach(v => {
            if (v.node === this.node) {
                return;
            }
            v.model?.updateWorldBound();
            if (!v.model?.worldBounds) {
                return;
            }

            if (!bound) {
                bound = v.model.worldBounds.clone()
            }
            else {
                geometry.AABB.merge(bound, bound, v.model.worldBounds)
            }
        })

        if (!bound) {
            return;
        }

        let min = new Vec3;
        let max = new Vec3;
        bound.getBoundary(min, max);
        let worldPos = this.node.worldPosition;
        min.subtract(worldPos).subtract3f(BOUND_BOX_EXPAND, BOUND_BOX_EXPAND, BOUND_BOX_EXPAND);
        max.subtract(worldPos).add3f(BOUND_BOX_EXPAND, BOUND_BOX_EXPAND, BOUND_BOX_EXPAND);

        meshRenderer.mesh = utils.MeshUtils.createMesh(primitives.translate(primitives.box({
            width: max.x - min.x,
            length: max.z - min.z,
            height: max.y - min.y
        }), {
            x: (max.x + min.x) / 2,
            y: (max.y + min.y) / 2,
            z: (max.z + min.z) / 2
        }));


        let material = new Material();
        material.initialize({
            effectName: 'builtin-debug-renderer'
        });
        if (this._editing) {
            this.node.layer = Layers.Enum.EDITOR;

            // 编辑模式下 显示边界的绿线
            let bound = this.node.getChildByName(BOUND_GIZMO_NAME);
            if (!bound) {
                bound = new Node(BOUND_GIZMO_NAME);
                this.node.addChild(bound);
                bound.hideFlags |= CCObject.Flags.AllHideMasks;
                bound.addComponent(MeshRenderer);
            }
            let boundMeshRenderer = bound.getComponent(MeshRenderer)!
            boundMeshRenderer.mesh = utils.MeshUtils.createMesh(this._getBoundWireframe(min, max));
            let boundMaterial = new Material();
            boundMaterial.initialize({
                effectName: 'builtin-unlit',
                states: {
                    primitive: gfx.PrimitiveMode.LINE_LIST
                }
            });
            boundMaterial.setProperty('mainColor', new Color(0, 255, 0, 255))
            boundMeshRenderer.material = boundMaterial;
        }
        else {
            this.node.layer = Layers.Enum.DEFAULT;
            this.node.getChildByName(BOUND_GIZMO_NAME)?.removeFromParent();
        }

        meshRenderer.material = material;
    }

    private _setFlag(nodes: Node[], flag: number) {
        nodes.forEach(v => {
            v.hideFlags |= flag;
            if (v.name !== GIZMO_NAME) {
                this._setFlag(v.children, flag);
            }
        })
    }

    private _unsetFlag(nodes: Node[], flag: number) {
        nodes.forEach(v => {
            v.hideFlags &= ~(flag);
            if (v.name !== GIZMO_NAME) {
                this._unsetFlag(v.children, flag)
            }
        })
    }

    private _getBoundWireframe(minPos: Vec3, maxPos: Vec3): primitives.IGeometry {
        const p1 = [minPos.x, minPos.y, minPos.z];
        const p2 = [maxPos.x, minPos.y, minPos.z];
        const p3 = [maxPos.x, minPos.y, maxPos.z];
        const p4 = [minPos.x, minPos.y, maxPos.z];
        const p5 = [minPos.x, maxPos.y, minPos.z];
        const p6 = [maxPos.x, maxPos.y, minPos.z];
        const p7 = [maxPos.x, maxPos.y, maxPos.z];
        const p8 = [minPos.x, maxPos.y, maxPos.z];

        return {
            positions: [
                ...p1, ...p2,
                ...p2, ...p3,
                ...p3, ...p4,
                ...p4, ...p1,
                ...p5, ...p6,
                ...p6, ...p7,
                ...p7, ...p8,
                ...p8, ...p5,
                ...p1, ...p5,
                ...p2, ...p6,
                ...p3, ...p7,
                ...p4, ...p8
            ]
        }
    }

}

