import Singleton from "db://assets/Scripts/BahaviorTree/RunTime/Base/Singleton";

//黑板 数据中心
export default class Blackboard extends Singleton{
    static get Instance() {
        return super.GetInstance<Blackboard>()
    }

    hp = 0
    mp = 0
}