import BTParent from "db://assets/Scripts/BahaviorTree/Base/BTParent";
import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";

//装饰节点
export default abstract class BTDecorator  extends BTParent{

    decorator(status:NodeStatus){
        return this.status
    }

}