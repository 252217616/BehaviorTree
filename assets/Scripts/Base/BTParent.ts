import BTNode from "db://assets/Scripts/Base/BTNode";
import {NodeStatus} from "db://assets/Scripts/Enums";

//基础父节点
export default abstract class BTParent  extends BTNode{
    //子节点
    childrens:Array<BTNode> = []
    private _index = 0


    get index(){
        return this._index
    }

    set index(index:number){
        this._index = index
    }

    constructor(childrens:Array<BTNode>) {
        super();
        this.childrens = childrens
    }

    //是否能够执行
    abstract canExecute():boolean

    //子节点执行
    abstract onChildExecuted(childStatus:NodeStatus):void




}