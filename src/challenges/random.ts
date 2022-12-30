import {
    AllMiddlewareArgs,
    GenericMessageEvent,
    SlackEventMiddlewareArgs,
} from "@slack/bolt";
import { Challenge, ChallengeContext } from "./lib/challenge";

const SEED = 30;
const FINAL = "0.03003690855112706";
const FINAL_DIGITS = "03690855112706";
const random: Challenge = {
    name: "Cracking the Seed",
    async init(ctx: ChallengeContext) {
        const onMessage = async (
            args: SlackEventMiddlewareArgs<"message"> & AllMiddlewareArgs
        ) => {
            const event = args.event as GenericMessageEvent;

            if (
                event.channel === ctx.team.channel &&
                !event.thread_ts &&
                event.text === FINAL ||
                event.text === FINAL_DIGITS
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
        await ctx.post(`0.5390815646058106, 0.2891964436397205, 0.030... It seems like your computer broke right as you were about to generate the last few digits of the initialization sequence. Thankfully you set the seed to the current date.
Enter the last few digits of the third random number down in the chat :arrow_down: (PS: make sure to use Python to generate the random numbers)`);
    },
};

export default random;
