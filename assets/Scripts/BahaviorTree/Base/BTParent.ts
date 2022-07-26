import BTNode from "db://assets/Scripts/BahaviorTree/Base/BTNode";
import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";

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
    abstract onChildExecuted(childStatus:NodeStatus,index:number):void

    //条件中止
    onConditionalAbort(childIndex:number){
    }

    //能否运行的并行节点
    canRunParallelChildren(){
        return false
    }

    //
    onChildStarted(){

    }


}