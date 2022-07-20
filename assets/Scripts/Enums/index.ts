

export enum NodeStatus{
    //未激活
    Inactive,
    //运行中
    Running,
    //成功
    Success,
    //失败
    Failure,
}

export enum AbortType{
    //不中断节点运行
    None,
    //中断低优先级的节点运行
    LowPriority,
    //中断同一组合下的节点运行
    Self,
    //同时具有LowPri 和Self
    Both
}