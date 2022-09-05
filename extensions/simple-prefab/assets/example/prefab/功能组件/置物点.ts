import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('置物点')
export class 置物点 extends Component {
    start() {
        console.log('我是置物点，一个功能组件，你看不见我，但是我生效啦~')
    }
}

