import {_decorator, Component} from 'cc';
import BTTree from "db://assets/Scripts/Base/BTTree";
import MyTree from "db://assets/Scripts/Biz/Tree/MyTree";
import BTNode from "db://assets/Scripts/Base/BTNode";
import BTParent from "db://assets/Scripts/Base/BTParent";
import {AbortType, NodeStatus} from "db://assets/Scripts/Enums";
import BTComposite from "db://assets/Scripts/Base/BTComposite";
import BTConditional from "db://assets/Scripts/Base/BTConditional";
import BTDecorator from "db://assets/Scripts/Base/BTDecorator";

const {ccclass, property} = _decorator;

@ccclass('BehaviorManager')
export class BehaviorManager extends Component {
    isCanReStart: boolean = false
    tree: BTTree
    //前序遍历保存行为树所有的节点
    nodeList: Array<BTNode> = []
    //运行栈 当前运行中的节点栈
    activeStack: Array<number> = []
    //每个节点的父节点再nodeList上的索引
    parentIndex: Array<number> = []
    //每个节点的子元素在nodeList上的索引
    childrenIndex: Array<Array<number>> = []
    //当前元素是爸爸的第几个孩子
    relativeChildIndex: Array<number> = []
    //第一个爸爸组合节点的index
    parentCompositeIndex: Array<number> = []
    //孩子是条件节点的索引数组
    childConditionalIndex: Array<Array<number>> = []

    //条件重评估对象
    conditionalReevaluateList: Array<ConditionalReevaluate> = []
    conditionalReevaluateMap: Map<number, ConditionalReevaluate> = new Map()

    start() {
        this.enableBehacvior()
    }


    private restart() {
        if (this.isCanReStart) {
            this.pushNode(0)
            this.removeChildConditionalReevalute(-1)
        }
    }

    private enableBehacvior() {
        this.tree = new MyTree()
        this.parentIndex.push(-1)
        this.relativeChildIndex.push(-1)
        this.parentCompositeIndex.push(-1)
        this.addToNodeList(this.tree.root, {parentCompositeIndex: -1})
        this.pushNode(0)
    }

    private addToNodeList(node: BTNode, data: { parentCompositeIndex: number }) {
        this.nodeList.push(node)
        //当前元素在nodeLits的索引
        const index = this.nodeList.length - 1
        //拥有子元素
        if (node instanceof BTParent) {
            this.childrenIndex.push([])
            this.childConditionalIndex.push([])
            for (let i = 0; i < node.childrens.length; i++) {
                this.parentIndex.push(index)
                this.childrenIndex[index].push(this.nodeList.length)
                this.relativeChildIndex.push(i)
                //防止装入装饰节点
                if (node instanceof BTComposite) {
                    data.parentCompositeIndex = index
                }
                this.parentCompositeIndex.push(data.parentCompositeIndex)

                this.addToNodeList(node.childrens[i], data)
            }
        } else {
            this.childrenIndex.push(null)
            this.childConditionalIndex.push(null)
            if (node instanceof BTConditional) {
                const parentCompositeIndex = this.parentCompositeIndex[index]
                if (parentCompositeIndex !== -1) {
                    this.childConditionalIndex[parentCompositeIndex].push(index)
                }
            }
        }
    }

    update(deltaTime: number) {
        this.tick()
    }


    tick() {
        this.reevaluateConftionalNode()
        let preIndex = -1
        let preStatus = NodeStatus.Inactive
        while (this.activeStack.length) {
            const curIndex = this.activeStack[this.activeStack.length - 1]
            if (preIndex === curIndex) {
                break
            }
            preIndex = curIndex
            preStatus = this.runNode(curIndex, preStatus)
        }
    }

    runNode(index: number, preStatus: NodeStatus) {
        this.pushNode(index)
        const node = this.nodeList[index]
        let status = preStatus
        if (node instanceof BTParent) {
            status = this.runParentNode(index, preStatus)
        } else {
            status = node.onUpdate();
        }

        if (status !== NodeStatus.Running) {
            status = this.popNode(index, status)
        }

        return status

    }

    runParentNode(index: number, preStatus: NodeStatus) {
        const parentNode = this.nodeList[index] as BTParent
        let childstatus = NodeStatus.Inactive
        while (parentNode.canExecute() && childstatus !== NodeStatus.Running) {
            childstatus = preStatus = this.runNode(this.childrenIndex[index][parentNode.index], preStatus)
        }
        return preStatus
    }

    pushNode(index: number) {
        if (this.activeStack.length === 0 || this.activeStack[this.activeStack.length - 1] !== index) {
            this.activeStack.push(index)
            const node = this.nodeList[index]
            console.log("pushNode ", node)
            node.onStart()
        }
    }

    popNode(index: number, status: NodeStatus) {
        this.activeStack.pop()
        const node = this.nodeList[index]
        node.onEnd()
        console.log("popNode ", node)
        const parentIndex = this.parentIndex[index]
        if (parentIndex !== -1) {
            //当前节点是条件节点
            if (node instanceof BTConditional) {
                //拿到最上层
                const parentCompositeIndex = this.parentCompositeIndex[index];
                if (parentCompositeIndex !== -1) {
                    const compositeNode = this.nodeList[parentCompositeIndex] as BTComposite
                    if (compositeNode.abortType !== AbortType.None) {
                        if (this.conditionalReevaluateMap.has(parentCompositeIndex)) {
                            //如果有先不要执行
                            const conditionalReevaluate = this.conditionalReevaluateMap.get(parentCompositeIndex);
                            conditionalReevaluate.compositeIndex = -1
                            conditionalReevaluate.status = status
                        } else {
                            const conditionalReevaluate = new ConditionalReevaluate(index, status, compositeNode.abortType === AbortType.LowPriority ? -1 : parentCompositeIndex);
                            console.log("生成conditionalReevaluate",conditionalReevaluate)
                            this.conditionalReevaluateList.push(conditionalReevaluate)
                            this.conditionalReevaluateMap.set(index, conditionalReevaluate)
                        }
                    }

                }
            }

            const parentNode = this.nodeList[parentIndex] as BTParent
            if (node instanceof BTDecorator) {
                status = node.decorator(status)
            }
            parentNode.onChildExecuted(status)
        }

        //判断组合节点时 条件重定向生成
        if (node instanceof BTComposite) {
            if (node.abortType === AbortType.Self || node.abortType === AbortType.None || !this.activeStack.length) {
                //删除
                this.removeChildConditionalReevalute(index)
            }else if(node.abortType === AbortType.LowPriority || node.abortType === AbortType.Both){
                for (let i = 0; i < this.childConditionalIndex[index].length; i++) {
                    const curNode = this.childConditionalIndex[index][i];
                    if(this.conditionalReevaluateMap.has(curNode)){
                        const curCR = this.conditionalReevaluateMap.get(curNode);
                        curCR.compositeIndex = this.parentCompositeIndex[index]
                    }
                }
                for (let i = 0; i < this.conditionalReevaluateList.length; i++) {
                    const curNode = this.conditionalReevaluateList[i];
                    if(curNode.compositeIndex === index){
                        curNode.compositeIndex = this.parentCompositeIndex[index]
                    }
                }
            }
        }

        if (!this.activeStack.length) {
            this.restart()
        }
        return status
    }

    private removeChildConditionalReevalute(index: number) {
        for (let i = this.conditionalReevaluateList.length - 1; i >= 0; i--) {
            const cur = this.conditionalReevaluateList[i];
            if(cur.compositeIndex === index){
                console.log("移除conditionalReevaluate",cur)
                this.conditionalReevaluateMap.delete(index)
                this.conditionalReevaluateList.splice(i,1)
            }

        }
    }

    private reevaluateConftionalNode() {
        //倒序遍历收集到的重评估对象
        for (let i = this.conditionalReevaluateList.length -1; i >= 0; i--) {
            const {index,status:preStatus,compositeIndex} = this.conditionalReevaluateList[i];
            //组合节点是-1的时候跳过
            if(compositeIndex === -1){
                continue
            }
            const status = this.nodeList[index].onUpdate()
            //状态没有变化时跳过
            if(status === preStatus){
                continue
            }
            //首先找到当前节点和条件变化的节点的共同父节点
            const curNodeIndex = this.activeStack.length - 1
            const commonParentIndex = this.findCommonParentIndex(curNodeIndex,index)
            //把当前节点的所有父节点退出运行栈

        }
    }

    private findCommonParentIndex(index1: number, index2: number) {
        //收集index1 所有的父节点
        const set = new Set()
        let num = index1
        while (num !== -1){
            set.add(num)
            num = this.parentIndex[num]
        }

        num = index2
        while (!set.has(num)){
            num = this.parentIndex[num]
        }

        return num
    }
}

export class ConditionalReevaluate {
    constructor(public index: number, public status: NodeStatus, public compositeIndex: number) {
    }
}

