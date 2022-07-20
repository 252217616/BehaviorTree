import {NodeStatus} from "db://assets/Scripts/Enums";
import BTConditional from "db://assets/Scripts/Base/BTConditional";
import Blackboard from "db://assets/Scripts/Demo/RunTime/Blackboard";

export default class ConditionalHp extends BTConditional{

    onUpdate(){
        console.log("Blackboard.Instance.hp : ",Blackboard.Instance.hp,"ConditionalHp 判断结果：", Blackboard.Instance.hp >= 100)
        if(Blackboard.Instance.hp >= 100){
            return NodeStatus.Success
        }
        return NodeStatus.Failure
    }
}