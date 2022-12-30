import {
  AllMiddlewareArgs,
  GenericMessageEvent,
  SlackEventMiddlewareArgs,
} from "@slack/bolt";
import { Challenge } from "./lib/challenge";

const next: Challenge = {
  name: "Fueling Up",
  async init(ctx) {
    let timeout: NodeJS.Timeout | undefined = undefined;
    let currentNumber = 0;
    let lastPoster = "";

    const onMessage = async (
      args: SlackEventMiddlewareArgs<"message"> & AllMiddlewareArgs
    ) => {
      const event = args.event as GenericMessageEvent;

      if (event.channel !== ctx.team.channel) return;

      if (timeout === undefined && event.text?.includes("50")) {
        ctx.post("Your 30 seconds starts now.", false);

        timeout = setTimeout(() => {
          timeout = undefined;

          lastPoster = "";
          currentNumber = 0;

          ctx.post(
            `:boom: You're out of time! Please re-enter the correct amount of fuel stimulant to try again.`,
            false
          );
        }, 30000);

        return;
      }

      if (timeout !== undefined) {
        const num = parseInt(event.text!);

        if (isNaN(num)) {
          return;
        }

        if (event.user === lastPoster) {
          ctx.post(
            `:boom: You can't count consecutively, <@${event.user}>. Please re-enter the correct amount of fuel stimulant to try again.`,
            false
          );
          clearTimeout(timeout);
          timeout = undefined;

          lastPoster = "";
          currentNumber = 0;
        } else if (num !== currentNumber + 1) {
          ctx.post(
            `:boom: Invalid number (should have been ${
              currentNumber + 1
            }). Please re-enter the correct amount of fuel stimulant to try again.`,
            false
          );
          clearTimeout(timeout);
          timeout = undefined;

          lastPoster = "";
          currentNumber = 0;
        } else if (num >= 20) {
          clearTimeout(timeout);
          timeout = undefined;

          lastPoster = "";
          currentNumber = 0;

          await ctx.solve();
        } else {
          currentNumber = num;
          lastPoster = event.user;
        }
      }
    };

    ctx.listener.event("message", onMessage);

    return () => {
      ctx.listener.removeListener("event:message", onMessage);
    };
  },
  async start(ctx) {
    await ctx.post(`To fuel up your rover, you need to do two things:

- Calculate how much fuel stimulant (in mililiters) is required for *10 liters of fuel* _(put your answer in the chat :arrow_down:)_

- Lifting the somewhat large fuel canister requires the strength of two people, so your crew will have *30 seconds* for at least two members to count from 1 to 20 together.

Same rules as <#CDJMS683D>: numbers must be in order, and *no counting consecutively.*`);
  },
};

export default next;
