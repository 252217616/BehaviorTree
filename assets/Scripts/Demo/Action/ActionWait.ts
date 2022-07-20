import {game} from "cc";
import BTAction from "db://assets/Scripts/Base/BTAction";
import {NodeStatus} from "db://assets/Scripts/Enums";

//等待 （技能前摇）
export default class ActionWait extends BTAction {

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
        console.log("ActionWait onStart")
    }

    onUpdate() {
        if (game.totalTime - this.startTime >= this.duration) {
            return NodeStatus.Success
        }
        return NodeStatus.Running
    }

    onEnd() {
        super.onEnd()
        console.log("ActionWait onEnd")
    }
}