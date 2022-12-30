import {
  AllMiddlewareArgs,
  GenericMessageEvent,
  SlackEventMiddlewareArgs,
} from "@slack/bolt";
import { setChallenge } from "../util";
import { Challenge, ChallengeContext } from "./lib/challenge";

function onMessage(ctx: ChallengeContext) {
  return async ({
    event,
  }: SlackEventMiddlewareArgs<"message"> & AllMiddlewareArgs) => {
    if (
      event.channel === ctx.team.channel &&
      (event as GenericMessageEvent).text === "46553"
    ) {
      try{
        await Promise.all([
          ctx.post(
            ":white_check_mark: `Access granted. Oxygen reserve migration complete.`"
          ),
          ctx.slack.client.reactions.add({
            timestamp: event.ts,
            token: ctx.token,
            name: "white_check_mark",
            channel: event.channel,
          }),
        ]);
      }
      catch(e){
        console.log(e)
      }
      await ctx.solve();
    } else if (
      event.channel === ctx.team.channel &&
      (event as GenericMessageEvent).text === "back"
    ) {
      await setChallenge(ctx.team, ctx.team.currentChallenge! - 1, true);
    }
  };
}

export default {
  name: "Restoring Oxygen, Part 2",

  async init(ctx: ChallengeContext) {
    const messageListener = onMessage(ctx);

    ctx.listener.event("message", messageListener);

    return () => {
      ctx.listener.removeListener("event:message", messageListener);
    };
  },
  async start(ctx: ChallengeContext) {
    await ctx.post(
      `You suddenly remember that oxygen can only be fully switched over with an admin code. Please type the admin code below :arrow_down:
 
_hint: don't know it? type \`back\` to try the previous challenge again._`
    );
  },
} as Challenge;
