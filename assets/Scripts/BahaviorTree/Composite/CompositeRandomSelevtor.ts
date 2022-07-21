import {NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";
import BTComposite from "db://assets/Scripts/BahaviorTree/Base/BTComposite";

//选择随机节点，所有子节点随机执行，当有一个返回成功则中止返回成功，全部节点返回失败，则该节点返回失败
export default class CompositeRandomSelevtor extends BTComposite{

    //真正执行的顺序
    executionOrder:Array<number> = []

    get index(){
        return this.executionOrder[this.executionOrder.length - 1]
    }

    onStart(){
        super.onStart()
        this.shuffle()
    }

    // onUpdate(){
    //     if(this.status === NodeStatus.Success){
    //         return NodeStatus.Success
    //     }
    //     if(!this.executionOrder.length){
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
    //        this.executionOrder.pop()
    //     }
    //
    //     return NodeStatus.Running
    // }
    private shuffle() {
        this.executionOrder = []
        const indexList = Array.from({length:this.childrens.length},(k,v)=> v)
        for (let i = indexList.length -1; i >= 0; i--) {
            const randomIndex = Math.floor(Math.random() * indexList.length)
            this.executionOrder.push(indexList.splice(randomIndex,1)[0])
        }
    }


    canExecute(): boolean {
        return this.executionOrder.length && this.status !== NodeStatus.Success;
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
                this.executionOrder.pop()
                if(!this.executionOrder.length){
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
        this.shuffle()
        this.status = NodeStatus.Inactive
    }
}