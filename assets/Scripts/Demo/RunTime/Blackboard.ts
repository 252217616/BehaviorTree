import Singleton from "db://assets/Scripts/Demo/Base/Singleton";

//黑板 数据中心
export default class Blackboard extends Singleton{
    static get Instance() {
        return super.GetInstance<Blackboard>()
    }

    hp = 100
    mp = 100
}