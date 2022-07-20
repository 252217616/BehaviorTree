import BTTree from "db://assets/Scripts/Base/BTTree";
import CompositeRandomSequence from "db://assets/Scripts/Biz/Composite/CompositeRandomSequence";
import CompositeSequence from "db://assets/Scripts/Biz/Composite/CompositeSequence";
import CompositeSelector from "db://assets/Scripts/Biz/Composite/CompositeSelector";
import ConditionalMp from "db://assets/Scripts/Biz/Conditional/ConditionalMp";
import ActionWait from "db://assets/Scripts/Demo/Action/ActionWait";
import ActionSkill from "db://assets/Scripts/Demo/Action/ActionSkill";
import ConditionalHp from "db://assets/Scripts/Biz/Conditional/ConditionalHp";
import ActionAttack from "db://assets/Scripts/Demo/Action/ActionAttack";
import ActionWork from "db://assets/Scripts/Demo/Action/ActionWork";
import ActionSleep from "db://assets/Scripts/Demo/Action/ActionSleep";
import {AbortType} from "db://assets/Scripts/Enums";

export default class MyTree extends BTTree {
    constructor() {
        super();
        this.init()
    }

    private init() {
        this.root =
            new CompositeSequence(
                [new CompositeSelector([
                    new CompositeSequence([
                        new ConditionalMp(),new CompositeSequence([
                            new ActionWait(),new ActionSkill()
                        ])
                    ],AbortType.Self),
                    new CompositeSequence([
                        new ConditionalHp(),new ActionAttack()
                    ]),
                    new CompositeRandomSequence([
                        new ActionWork(),new ActionSleep()
                    ])
                ])])

    }
}