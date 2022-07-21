import {NodeStatus} from "db://assets/Scripts/Enums";
import BTComposite from "db://assets/Scripts/Base/BTComposite";

//顺序节点，所有子节点按顺序执行，当有一个返回失败，则中止并返回失败
export default class CompositeSequence extends BTComposite{

    onStart(){
        super.onStart()
        this.index = 0
    }

    // onUpdate(){
    //     if(this.status === NodeStatus.Failure){
    //         return NodeStatus.Failure
    //     }
    //     if(this.index >= this.childrens.length){
    //         this.status = NodeStatus.Success
    //         return NodeStatus.Success
    //     }
    //     const child = this.childrens[this.index];
    //     const res = child.run()
    //
    //     if(res === NodeStatus.Failure){
    //         this.status = NodeStatus.Failure
    //         return NodeStatus.Failure
    //     }
    //     if(res === NodeStatus.Success){
    //         this.index++
    //     }
    //
    //     return NodeStatus.Running
    // }

    canExecute(): boolean {
        return this.index < this.childrens.length && this.status !== NodeStatus.Failure;
    }

    onChildExecuted(childStatus: NodeStatus,_:number): void {
        switch (childStatus){
            case NodeStatus.Inactive:
                break;
            case NodeStatus.Running:
                this.status = NodeStatus.Running
                break;
            case NodeStatus.Success:
                this.index++
                if(this.index >= this.childrens.length){
                    this.status = NodeStatus.Success
                }else {
                    this.status = NodeStatus.Running
                }
                break;
            case NodeStatus.Failure:
                this.status = NodeStatus.Failure
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