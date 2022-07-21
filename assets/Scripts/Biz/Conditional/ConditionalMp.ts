import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";
import BTConditional from "db://assets/Scripts/BahaviorTree/Base/BTConditional";
import Blackboard from "db://assets/Scripts/BahaviorTree/RunTime/Blackboard";

export default class ConditionalMp extends BTConditional{

    onUpdate(){
        console.log("Blackboard.Instance.mp : ",Blackboard.Instance.mp,"ConditionalMp 判断结果：", Blackboard.Instance.mp >= 100)
        if(Blackboard.Instance.mp >= 100){
            return NodeStatus.Success
        }
        return NodeStatus.Failure
    }
}