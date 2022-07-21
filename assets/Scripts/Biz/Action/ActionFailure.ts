import BTAction from "db://assets/Scripts/BahaviorTree/Base/BTAction";
import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";

export default class ActionFailure extends BTAction{

    onUpdate(){
        return NodeStatus.Failure
    }
}