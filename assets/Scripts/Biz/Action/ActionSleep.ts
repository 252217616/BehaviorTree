import {game} from "cc";
import BTAction from "db://assets/Scripts/BahaviorTree/Base/BTAction";
import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";

//睡眠
export default class ActionSleep extends BTAction {

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
        console.log("ActionSleep onStart")
    }

    onUpdate() {
        if (game.totalTime - this.startTime >= this.duration) {
            return NodeStatus.Success
        }
        return NodeStatus.Running
    }

    onEnd() {
        super.onEnd()
        console.log("ActionSleep onEnd")
    }
}