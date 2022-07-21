import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";

//基础节点
export default abstract class BTNode {
    private _status:NodeStatus = NodeStatus.Inactive


    get status(){
        return this._status
    }

    set status(status:NodeStatus){
        this._status = status
    }

    run(){
        if(this.status === NodeStatus.Inactive){
            this.onStart()
        }

        const res = this.onUpdate();

        if(res !== NodeStatus.Running){
            this.onEnd()
        }

        return res
    }

    onStart(){
        this.status = NodeStatus.Running
    }

    onUpdate(){
        return NodeStatus.Success
    }
    onEnd(){
        this.status =  NodeStatus.Inactive
    }
}

