import {NodeStatus} from "db://assets/Scripts/Enums";
import BTComposite from "db://assets/Scripts/Base/BTComposite";

//选择节点，所有子节点按顺序执行，当有一个返回成功则中止返回成功，全部节点返回失败，则该节点返回失败
export default class CompositeSelector extends BTComposite{

    onStart(){
        super.onStart()
        this.index = 0
    }

    // onUpdate(){
    //     if(this.status === NodeStatus.Success){
    //         return NodeStatus.Success
    //     }
    //     if(this.index >= this.childrens.length){
    //         this.status = NodeStatus.Failure
    //         return NodeStatus.Failure
    //     }
    //     const child = this.childrens[this.index];
    //     const res = child.run()
    //
    //     if(res === NodeStatus.Success){
    //         this.status = NodeStatus.Success
    //         return NodeStatus.Success
    //     }
    //     if(res === NodeStatus.Failure){
    //         this.index++
    //     }
    //
    //     return NodeStatus.Running
    // }

    canExecute(): boolean {
        return this.index < this.childrens.length && this.status !== NodeStatus.Success;
    }

    onChildExecuted(childStatus: NodeStatus,_:number): void {
        switch (childStatus){
            case NodeStatus.Inactive:
                break;
            case NodeStatus.Running:
                this.status = NodeStatus.Running
                break;
            case NodeStatus.Success:
                this.status = NodeStatus.Success
                break;
            case NodeStatus.Failure:
                this.index++
                if(this.index >= this.childrens.length){
                    this.status = NodeStatus.Failure
                }else {
                    this.status = NodeStatus.Running
                }
                break
            default:
                break
        }
    }

    onConditionalAbort(childIndex:number){
        this.index = childIndex
        this.status = NodeStatus.Inactive
    }
}