import BTTree from "db://assets/Scripts/Base/BTTree";
import CompositeSelector from "db://assets/Scripts/Biz/Composite/CompositeSelector";
import ConditionalMp from "db://assets/Scripts/Biz/Conditional/ConditionalMp";
import ConditionalHp from "db://assets/Scripts/Biz/Conditional/ConditionalHp";
import ActionWork from "db://assets/Scripts/Demo/Action/ActionWork";
import ActionSleep from "db://assets/Scripts/Demo/Action/ActionSleep";
import {AbortType} from "db://assets/Scripts/Enums";
import CompositeParallel from "db://assets/Scripts/Biz/Composite/CompositeParallel";

export default class MyTree extends BTTree {
    constructor() {
        super();
        this.init()
    }

    private init() {
        this.root = new CompositeSelector([
            new CompositeParallel([
                new CompositeSelector([
                    new ConditionalHp(),new ActionWork(4000)
                ],AbortType.Self),
                new CompositeSelector([
                    new ConditionalMp(),new ActionSleep(8000)
                ],AbortType.Self),
            ])
        ])

        // this.root =
        //     new CompositeSequence(
        //         [new CompositeSelector([
        //             new CompositeSequence([
        //                 new ConditionalMp(),new CompositeSequence([
        //                     new ActionWait(),new ActionSkill()
        //                 ])
        //             ],AbortType.Self),
        //             new CompositeSequence([
        //                 new ConditionalHp(),new ActionAttack()
        //             ]),
        //             new CompositeRandomSequence([
        //                 new ActionWork(),new ActionSleep()
        //             ])
        //         ])])


    }
}