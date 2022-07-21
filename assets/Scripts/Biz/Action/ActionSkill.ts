import {game} from "cc";
import BTAction from "db://assets/Scripts/BahaviorTree/Base/BTAction";
import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";
import Blackboard from "db://assets/Scripts/BahaviorTree/RunTime/Blackboard";

//释放技能
export default class ActionSkill extends BTAction {

    //持续时间
    private duration: number = 2000
    //当前时间
    private startTime: number = 0


    constructor(duration: number = 2000) {
        super();
        this.duration = duration
    }


    onStart() {
        super.onStart()
        this.startTime = game.totalTime

        console.log("ActionSkill onStart")
    }

    onUpdate() {
        if (game.totalTime - this.startTime >= this.duration) {
            return NodeStatus.Success
        }
        return NodeStatus.Running
    }

    onEnd() {
        Blackboard.Instance.mp -= 20
        super.onEnd()
        console.log("ActionSkill onEnd")
    }
}