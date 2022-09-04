import { CCObject, Component, MeshRenderer, Texture2D, _decorator } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('SpriteGizmo')
@executeInEditMode
export class SpriteGizmo extends Component {

    @property(Texture2D)
    private _texture!: Texture2D;
    @property(Texture2D)
    public get texture(): Texture2D {
        return this._texture;
    }
    public set texture(v: Texture2D) {
        this._texture = v;
        this._updateQuad();
    }

    onEnable() {
        let node = this.node.getChildByName('Quad')!;
        node.hideFlags |= CCObject.Flags.HideInHierarchy | CCObject.Flags.LockedInEditor;
        this._updateQuad()
    }

    private _updateQuad() {
        let node = this.node.getChildByName('Quad')!;
        node.setScale(1, this.texture.height / this.texture.width, 1);
        node.getComponent(MeshRenderer)!.material!.setProperty('mainTexture', this.texture);
    }

}

