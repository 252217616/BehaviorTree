import BTParent from "db://assets/Scripts/Base/BTParent";
import {AbortType} from "db://assets/Scripts/Enums";
import BTNode from "db://assets/Scripts/Base/BTNode";

//组合节点
export default abstract class BTComposite  extends BTParent{
    abortType:AbortType
    constructor(childrens:Array<BTNode> = [],abortType:AbortType = AbortType.None) {
        super(childrens);
        this.abortType = abortType
    }
}