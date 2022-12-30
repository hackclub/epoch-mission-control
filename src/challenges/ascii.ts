import {
    AllMiddlewareArgs,
    GenericMessageEvent,
    SlackEventMiddlewareArgs,
} from "@slack/bolt";
import { Challenge, ChallengeContext } from "./lib/challenge";

const ASCII_CODE = "Happy Hacking Epoch!";

const translator: Challenge = {
    name: "My Translator",
    async init(ctx: ChallengeContext) {
        const onMessage = async (
            args: SlackEventMiddlewareArgs<"message"> & AllMiddlewareArgs
        ) => {
            const event = args.event as GenericMessageEvent;

            if (
                event.channel === ctx.team.channel &&
                !event.thread_ts &&
                event.text === ASCII_CODE
            ) {
                await ctx.solve();
            }
        };

        ctx.listener.event("message", onMessage);

        return () => {
            ctx.listener.removeListener("event:message", onMessage);
        };
    },
    async start(ctx: ChallengeContext) {
        await ctx.post(`You go to check if your translation machine is working and by golly you find that it is broken. All it does it keep spitting back these numbers. 72 97 112 112 121 32 72 97 99 107 105 110 103 32 69 112 111 99 104 33. If only you had some sort of table to solve it.`);
    },
};

export default translator;
