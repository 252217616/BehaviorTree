import {_decorator, Component} from 'cc';
import BTTree from "db://assets/Scripts/BahaviorTree/Base/BTTree";
import MyTree from "db://assets/Scripts/Tree/MyTree";
import BTNode from "db://assets/Scripts/BahaviorTree/Base/BTNode";
import BTParent from "db://assets/Scripts/BahaviorTree/Base/BTParent";
import {AbortType, NodeStatus} from "db://assets/Scripts/BahaviorTree/Enums";
import BTComposite from "db://assets/Scripts/BahaviorTree/Base/BTComposite";
import BTConditional from "db://assets/Scripts/BahaviorTree/Base/BTConditional";
import BTDecorator from "db://assets/Scripts/BahaviorTree/Base/BTDecorator";
import Blackboard from "db://assets/Scripts/BahaviorTree/RunTime/Blackboard";

const {ccclass, property} = _decorator;

@ccclass('BehaviorManager')
export class BehaviorManager extends Component {
    isCanReStart: boolean = false
    tree: BTTree
    //前序遍历保存行为树所有的节点
    nodeList: Array<BTNode> = []
    //运行栈 当前运行中的节点栈
    activeStack: Array<Array<number>> = []
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
        this.scheduleOnce(()=>{
            console.log("加血")
            Blackboard.Instance.hp = 1000
        },1)
    }


    private restart() {
        if (this.isCanReStart) {
            console.log("重启行为树")
            this.removeChildConditionalReevalute(-1)
            this.pushNode(0, 0)
        }
    }

    private enableBehacvior() {
        this.tree = new MyTree()
        this.activeStack.push([])
        this.parentIndex.push(-1)
        this.relativeChildIndex.push(-1)
        this.parentCompositeIndex.push(-1)
        this.addToNodeList(this.tree.root, {parentCompositeIndex: -1})
        this.pushNode(0, 0)
    }

    private addToNodeList(node: BTNode, data: { parentCompositeIndex: number }) {
        //保存当前节点
        this.nodeList.push(node)
        //当前元素在nodeLits的索引
        const index = this.nodeList.length - 1
        //拥有子元素
        if (node instanceof BTParent) {
            //如果是父节点类型，给孩子索引增加空数组
            this.childrenIndex.push([])
            this.childConditionalIndex.push([])
            for (let i = 0; i < node.childrens.length; i++) {
                //前序遍历框架 ...
                //给每个孩子保存父节点内容
                this.parentIndex.push(index)
                //保存当前父节点的孩子索引
                this.childrenIndex[index].push(this.nodeList.length)
                //保存当前节点的是父亲第几个孩子索引
                this.relativeChildIndex.push(i)
                //防止装入装饰节点
                if (node instanceof BTComposite) {
                    data.parentCompositeIndex = index
                }
                //该节点的上层组合节点索引
                this.parentCompositeIndex.push(data.parentCompositeIndex)
                //前序遍历框架 ...
                this.addToNodeList(node.childrens[i], data)
            }
        } else {
            //没有子元素的节点
            this.childrenIndex.push(null)
            this.childConditionalIndex.push(null)
            if (node instanceof BTConditional) {
                //如果是条件节点 找出上层的组合节点
                const parentCompositeIndex = this.parentCompositeIndex[index]
                if (parentCompositeIndex !== -1) {
                    //给上层组合节点增加孩子是条件节点的索引
                    this.childConditionalIndex[parentCompositeIndex].push(index)
                }
            }
        }
    }

    update(deltaTime: number) {
        //每回合执行一次tick
        this.tick()
    }


    tick() {
        //条件判断 并回滚
        this.reevaluateConftionalNode()
        //遍历所有的运行栈
        for (let i = this.activeStack.length - 1; i >= 0; i--) {
            //拿到运行栈
            const stack = this.activeStack[i];
            //上一次执行的节点索引
            let preIndex = -1
            //上一次执行的节点状态
            let preStatus = NodeStatus.Inactive
            //当运行栈中有节点时执行
            while (preStatus !== NodeStatus.Running && i < this.activeStack.length && stack.length) {
                //找出当前运行节点的索引
                const curIndex = stack[stack.length - 1]
                //如果本次和上次一样则跳过（防止重复执行）
                if (preIndex === curIndex) {
                    break
                }
                //更新前置节点
                preIndex = curIndex
                //执行节点，并更新前置节点状态
                preStatus = this.runNode(curIndex, i, preStatus)
            }

        }

    }

    runNode(index: number, stackIndex: number, preStatus: NodeStatus) {
        //将节点推入运行栈，并执行节点的onStart方法（内部有判断，如果当前节点已经在运行栈中就不执行）
        this.pushNode(index, stackIndex)
        //拿到当前节点
        const node = this.nodeList[index]
        let status = preStatus
        if (node instanceof BTParent) {
            //如果是父节点，执行父节点逻辑
            status = this.runParentNode(index, stackIndex, preStatus)
            if (node.canRunParallelChildren()) {
                status = node.status
            }
        } else {
            //普通节点执行节点的onUpdate方法
            status = node.onUpdate();
        }
        //如果节点已经执行完毕，非running状态，则推出运行栈，并执行onEnd方法，和父节点的onChildExecuted方法，改变运行孩子索引和父节点的状态
        if (status !== NodeStatus.Running) {
            status = this.popNode(index, stackIndex, status)
        }
        //将本次节点运行的状态返回
        return status

    }

    runParentNode(index: number, stackIndex: number, preStatus: NodeStatus) {
        //强转为父节点
        const parentNode = this.nodeList[index] as BTParent
        if (!parentNode.canRunParallelChildren() || parentNode.status !== NodeStatus.Running) {
            let childStatus = NodeStatus.Inactive
            //如果父节点可执行，并且状态非running 则继续执行
            while (parentNode.canExecute() && (childStatus !== NodeStatus.Running || parentNode.canRunParallelChildren())) {
                const childIndex = parentNode.index
                //如果是并行节点，增加运行栈将任务都推送进去
                if (parentNode.canRunParallelChildren()) {
                    this.activeStack.push([])
                    stackIndex = this.activeStack.length - 1
                    //增加parentNode index
                    parentNode.onChildStarted()
                }
                //执行孩子节点
                childStatus = preStatus = this.runNode(this.childrenIndex[index][childIndex],stackIndex, preStatus)
            }
        }

        return preStatus
    }

    pushNode(index: number, stackIndex: number) {
        const stack = this.activeStack[stackIndex]
        if (stack.length === 0 || stack[stack.length - 1] !== index) {
            stack.push(index)
            const node = this.nodeList[index]
            console.log("pushNode ", node)
            //执行初始化方法
            node.onStart()
        }
    }

    popNode(index: number, stackIndex: number, status: NodeStatus,popChildren = true) {
        const stack = this.activeStack[stackIndex]
        //当前运行节点出栈
        stack.pop()
        //拿到当前节点
        const node = this.nodeList[index]
        //执行onEnd方法
        node.onEnd()
        console.log("popNode ", node)
        //拿到当前节点的父节点索引
        const parentIndex = this.parentIndex[index]
        //如果有父节点
        if (parentIndex !== -1) {
            //当前节点是条件节点，生成条件重新评估对象
            if (node instanceof BTConditional) {
                //拿到当前节点的父组合节点
                const parentCompositeIndex = this.parentCompositeIndex[index];
                //如果有
                if (parentCompositeIndex !== -1) {
                    //拿到父组合节点
                    const compositeNode = this.nodeList[parentCompositeIndex] as BTComposite
                    //如果父组合节点有重新评估类型 则生成
                    if (compositeNode.abortType !== AbortType.None) {
                        if (this.conditionalReevaluateMap.has(index)) {
                            //如果有先不要执行
                            const conditionalReevaluate = this.conditionalReevaluateMap.get(index);
                            console.log("生成1conditionalReevaluate", conditionalReevaluate)
                            conditionalReevaluate.compositeIndex = -1
                            conditionalReevaluate.status = status
                        } else {
                            //如果上级组合节点是低优先级，则本次不执行，等到执行到行为树右边时再执行
                            const conditionalReevaluate = new ConditionalReevaluate(index, status, compositeNode.abortType === AbortType.LowPriority ? -1 : parentCompositeIndex);
                            console.log("生成2conditionalReevaluate", conditionalReevaluate)
                            this.conditionalReevaluateList.push(conditionalReevaluate)
                            this.conditionalReevaluateMap.set(index, conditionalReevaluate)
                        }
                    }

                }
            }

            const parentNode = this.nodeList[parentIndex] as BTParent
            if (node instanceof BTDecorator) {
                //如果是装饰节点 则将状态装饰
                status = node.decorator(status)
            }
            //运行子状态影响父状态的方法
            parentNode.onChildExecuted(status, this.relativeChildIndex[index])
        }

        //如果当前节点是组合节点退出
        if (node instanceof BTComposite) {
            //如果条件重新评估 只影响自己 或者 没有，或者当前运行栈已经没有运行节点了，则清空以当前节点为父节点的的条件重评估
            if (node.abortType === AbortType.Self || node.abortType === AbortType.None || !stack.length) {
                this.removeChildConditionalReevalute(index)
                //如果当前节点的重评估状态为低优先级，或者Both，则要将当前节点为父节点的条件重评估，父节点向上移动
            } else if (node.abortType === AbortType.LowPriority || node.abortType === AbortType.Both) {
                //遍历该节点下所有的条件节点（必须遍历 有可能当前节点下的条件重新评估指向-1，先不执行，当父节点退出时，指向上级，开始执行）
                for (let i = 0; i < this.childConditionalIndex[index].length; i++) {
                    //拿到条件节点的索引
                    const curNodeIndex = this.childConditionalIndex[index][i];
                    //如果有条件重评估
                    if (this.conditionalReevaluateMap.has(curNodeIndex)) {
                        //拿到条件重评估
                        const curCR = this.conditionalReevaluateMap.get(curNodeIndex);
                        //将父节点指向当前节点的父组合节点
                        curCR.compositeIndex = this.parentCompositeIndex[index]
                    }
                }
                //遍历所有的条件重评估对象  把有可能是下级传递上来的条件重评估再往上传递
                for (let i = 0; i < this.conditionalReevaluateList.length; i++) {
                    const curNode = this.conditionalReevaluateList[i];
                    if (curNode.compositeIndex === index) {
                        curNode.compositeIndex = this.parentCompositeIndex[index]
                    }
                }
            }
        }
        //并行节点返回失败将其他节点pop出去
        console.log(status,node)
        if(popChildren){
            //拿到右边的运行栈
            for (let i = this.activeStack.length - 1; i < stackIndex; i--) {
                const stack = this.activeStack[i];
                if(stack.length > 0 && this.isParentNode(index,stack[stack.length-1])){
                    for (let j = stack.length -1; j >= 0; j--) {
                        this.popNode(stack[stack.length-1],i,NodeStatus.Failure,false)

                    }
                }

            }
        }


        //如果当前没有可以运行的节点了则重新开始行为树
        if(stack.length === 0){
            if(stackIndex === 0){
                //所有运行栈都运行完成了
                this.restart()
            }else {
                //当前栈运行完毕，其他栈还有 删除当前栈
                this.activeStack.splice(stackIndex,1)
            }
        }
        //返回状态
        return status
    }

    private isParentNode(parentIndex:number,childIndex:number) {
        for (let i = childIndex; i !== -1; i = this.parentIndex[i]) {
            if(i === parentIndex){
                return true
            }
        }
        return false

    }

    private removeChildConditionalReevalute(index: number) {
        for (let i = this.conditionalReevaluateList.length - 1; i >= 0; i--) {
            const cur = this.conditionalReevaluateList[i];
            if (cur.compositeIndex === index) {
                console.log("移除conditionalReevaluate", cur)
                this.conditionalReevaluateMap.delete(cur.index);
                this.conditionalReevaluateList.splice(i, 1)
            }

        }
    }

    private reevaluateConftionalNode() {
        //倒序遍历收集到的重评估对象
        for (let i = this.conditionalReevaluateList.length - 1; i >= 0; i--) {
            const {index, status: preStatus, compositeIndex} = this.conditionalReevaluateList[i];
            //组合节点是-1的时候跳过
            if (compositeIndex === -1) {
                continue
            }
            const status = this.nodeList[index].onUpdate()
            //状态没有变化时跳过
            if (status === preStatus) {
                continue
            }

            for (let j = this.activeStack.length -1; j >= 0; j--) {
                const stack = this.activeStack[j];
                //首先找到当前节点和条件变化的节点的共同父节点
                let curNodeIndex = stack[stack.length - 1]
                const commonParentIndex = this.findCommonParentIndex(curNodeIndex, index)
                if(this.isParentNode(compositeIndex,commonParentIndex)){
                    const stackLen = this.activeStack.length
                    //1、把当前节点的所有父节点退出运行栈
                    while (curNodeIndex !== -1 && curNodeIndex !== commonParentIndex && stackLen === this.activeStack.length) {
                        this.popNode(curNodeIndex,j, NodeStatus.Failure,false)
                        curNodeIndex = this.parentIndex[curNodeIndex]
                    }
                }

            }

            //2、把公共节点下最顶级的父节点的右侧的条件重评估移除
            //倒序遍历 j -》 i的所有重评估对象都要删掉
            for (let j = this.conditionalReevaluateList.length - 1; j >= i; j--) {
                const curCR = this.conditionalReevaluateList[j];
                //只有当前重评估节点的父组合节点是重评估的父节点才可以删除
                if(this.isParentNode(compositeIndex,curCR.index)){
                    this.conditionalReevaluateMap.delete(curCR.index)
                    this.conditionalReevaluateList.splice(j, 1)
                }
            }
            //3、当前生效的条件重评估对象同一组合下的条件重评估对象停止并删除
            //当前重评估对象的父组合节点
            const compositeNode = this.nodeList[this.parentCompositeIndex[index]] as BTComposite
            //遍历左边的元素
            for (let j = i - 1; j >= 0; j--) {
                const CR = this.conditionalReevaluateList[j];
                //如果有相同的父组合节点
                if (this.parentCompositeIndex[CR.index] === this.parentCompositeIndex[index]) {
                    //如果父组合重评估类型是低优先级
                    if (compositeNode.abortType === AbortType.LowPriority) {
                        //不执行
                        CR.compositeIndex = -1
                    }
                }
            }
            //4、当前重评估的父节点到公共的父节点要重置内部的执行索引
            const conditionalParentIndex = []
            for (let j = this.parentIndex[index]; j != compositeIndex; j = this.parentIndex[j]) {
                conditionalParentIndex.push(j)
            }
            conditionalParentIndex.push(compositeIndex)
            for (let j = conditionalParentIndex.length - 1; j >= 0; j--) {
                const parentNode = this.nodeList[conditionalParentIndex[j]] as BTParent
                if (j === 0) {
                    parentNode.onConditionalAbort(this.relativeChildIndex[index])
                } else {

                    parentNode.onConditionalAbort(this.relativeChildIndex[conditionalParentIndex[j - 1]])
                }
            }
        }
    }

    private findCommonParentIndex(index1: number, index2: number) {
        //收集index1 所有的父节点
        const set = new Set()
        let num = index1
        while (num !== -1) {
            set.add(num)
            num = this.parentIndex[num]
        }

        num = index2
        while (!set.has(num)) {
            num = this.parentIndex[num]
        }

        return num
    }
}

export class ConditionalReevaluate {
    constructor(public index: number, public status: NodeStatus, public compositeIndex: number) {
    }
}

