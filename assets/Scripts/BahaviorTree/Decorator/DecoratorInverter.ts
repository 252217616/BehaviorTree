import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";
import BTDecorator from "db://assets/Scripts/BahaviorTree/Base/BTDecorator";

//反转节点
export default class DecoratorInverter extends BTDecorator{
    canExecute(): boolean {
        return this.status == NodeStatus.Inactive || this.status === NodeStatus.Running;
    }

    onChildExecuted(childStatus: NodeStatus,_:number): void {
        this.status = childStatus
    }


    decorator(status:NodeStatus) {
        switch (status) {
            case NodeStatus.Failure:
                return NodeStatus.Success
            case NodeStatus.Success:
                return NodeStatus.Failure
            default:
                return status
        }
    }
}