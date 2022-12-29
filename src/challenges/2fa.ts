import {
  AllMiddlewareArgs,
  GenericMessageEvent,
  SlackEventMiddlewareArgs,
} from "@slack/bolt";
import { NextFunction, Request, Response } from "express";
import { Challenge } from "./lib/challenge";

const CODE = "4B9F7";

// Every team needs a different URL in case they're all on this challenge at the same time
const urls: { [team: number]: string } = {
  1: "login",
  2: "auth",
  3: "authorize",
  4: "2fa",
  5: "signin",
  6: "log-in",
  7: "sign-in",
  8: "verify-login",
  9: "confirm",
  10: "verify",
  11: "prove",
  12: "check",
  13: "certify",
  14: "ratify",
  15: "accredit",
  16: "accredit-login",
  17: "ratify-login",
  18: "certify-login",
  19: "check-login",
  20: "prove-login",
  21: "confirm-login",
  22: "authorize-login",
  23: "two-factor-auth",
  24: "two-factor-authorization",
  25: "authorise",
  26: "permit",
  27: "permit-login",
  28: "approve",
  29: "approve-login",
  30: "epoch-auth",
  31: "authorize"
};

const twoFactorAuth: Challenge = {
  name: "Two-Factor Auth",
  async init(ctx) {
    const url = urls[ctx.team.id];

    const onRequest = (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== "POST") {
        next();
        return;
      }

      const chunks: Buffer[] = [];

      req.on("data", (chunk) => {
        chunks.push(chunk);
      });

      req.on("end", () => {
        const body = Buffer.concat(chunks).toString();

        const parsed = new URLSearchParams(body);

        if (parsed.get("user_id") !== "U013B6CPV62") {
          res.send("You're not authorized to run this slash command.");
          return;
        }

        if (parsed.get("text") !== "starship") {
          res.send(
            `Unknown subcommand. The only supported command is \`/${url} starship\``
          );
          return;
        }

        res.send(
          `Your two-factor auth code is: ${CODE}. Enter it into your team's channel to log in.`
        );
      });
    };

    const onMessage = async (
      args: SlackEventMiddlewareArgs<"message"> & AllMiddlewareArgs
    ) => {
      const event = args.event as GenericMessageEvent;

      if (
        event.channel === ctx.team.channel &&
        !event.thread_ts &&
        event.text === CODE
      ) {
        await ctx.post(":white_check_mark: You've been logged in!");
        await ctx.solve();
      }
    };

    ctx.httpListener.addListener(`/slack/commands/${url}`, onRequest);
    ctx.listener.event("message", onMessage);

    return () => {
      ctx.httpListener.removeListener(`/slack/commands/${url}`, onRequest);
      ctx.listener.removeListener("event:message", onMessage);
    };
  },
  async start(ctx) {
    const url = urls[ctx.team.id];

    await ctx.post(
      `You enter the password, but of course it can't be that simple. _Somebody_ set up two-factor authentication that can only be fulfilled by a specific person via a Slack slash command. And that person is millions of miles away.

You know three things though:
- The slash command endpoint is https://epoch-mission-control.herokuapp.com/slack/commands/${url}
- The only user who can use that slash command has a user ID of \`U013B6CPV62\`
- The developers were too busy to build in signing secret verification

Perhaps you can somehow trick the 2FA server into letting you in?`
    );
  },
};

export default twoFactorAuth;
