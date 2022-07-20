import {NodeStatus} from "db://assets/Scripts/Enums";

//基础节点
export default abstract class BTNode {
    status:NodeStatus = NodeStatus.Inactive

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

