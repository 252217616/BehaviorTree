import {NodeStatus} from "db://assets/Scripts/Enums";
import BTDecorator from "db://assets/Scripts/Base/BTDecorator";

export default class DecoratorInverter extends BTDecorator{
    canExecute(): boolean {
        return this.status == NodeStatus.Inactive || this.status === NodeStatus.Running;
    }

    onChildExecuted(childStatus: NodeStatus,_:number): void {
        this.status = childStatus
    }
    //
    // onUpdate(){
    //     return this.decorator(this.childrens[0].run())
    // }

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