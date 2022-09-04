import { CCObject, Color, Component, geometry, gfx, Layers, Material, MeshRenderer, Node, primitives, utils, Vec3, _decorator } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property, executeInEditMode, playOnFocus } = _decorator;

const GIZMO_NAME = '__GIZMO__';
const BOUND_GIZMO_NAME = '__BOUND__';
const BOUND_BOX_EXPAND = 0.01;

/**
 * ★★★ 注意 ★★★
 * 1. 必须挂载在【顶层空节点】
 * 2. 根节点上除本脚本之外，【不可挂载任何脚本】
 * 
 * 自定义场景中拖拉拽的物体，支持以下特性：
 * 1. 隐藏细节
 * 2. 自定义 Gizmo
 * 3. 自动创建选择包围盒
 */
@ccclass('CustomEditorItem')
@executeInEditMode
@playOnFocus
export abstract class CustomEditorItem extends Component {

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

