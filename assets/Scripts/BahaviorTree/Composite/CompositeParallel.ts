import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";
import BTComposite from "db://assets/Scripts/BahaviorTree/Base/BTComposite";

//并行节点，所有子节点按同时执行，当有一个返回失败，则返回失败，全部成功则成功
export default class CompositeParallel extends BTComposite{

    exectionStatus: Array<NodeStatus> = []


    get status(){
        let childrenComplete = true
        for (let i = 0; i < this.exectionStatus.length; i++) {
            const cur = this.exectionStatus[i];
            if(cur === NodeStatus.Running){
                childrenComplete = false
            }else if( cur === NodeStatus.Failure){
                return NodeStatus.Failure
            }
        }
        return childrenComplete?NodeStatus.Success:NodeStatus.Running
    }

    set status(_){
    }


    onStart(){
        super.onStart()
        this.exectionStatus = new Array<NodeStatus>(this.childrens.length)
        this.index = 0
        for (let i = 0; i < this.exectionStatus.length; i++) {
            this.exectionStatus[i] = NodeStatus.Inactive
        }
    }



    canExecute(): boolean {
        return this.index < this.childrens.length;
    }

    onChildExecuted(childStatus: NodeStatus,index:number): void {
       this.exectionStatus[index] = childStatus
    }

    onConditionalAbort(childIndex:number){
        this.index = 0
        for (let i = 0; i < this.exectionStatus.length; i++) {
            this.exectionStatus[i] = NodeStatus.Inactive
        }
    }


    //能否运行的并行节点
    canRunParallelChildren(){
        return true
    }

    //
    onChildStarted(){
        this.exectionStatus[this.index] = NodeStatus.Running
        this.index++
    }

}