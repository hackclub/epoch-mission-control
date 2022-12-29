import { Challenge, ChallengeContext } from "./lib/challenge";

import { Request, Response } from "express";

export default {
  name: "Restoring Oxygen, Part 1",

  async init(ctx: ChallengeContext) {
    const onRequest = async (req: Request, res: Response) => {
      if (req.method === "POST") {
        res.json({
          ok: true,
          oxygen_status: "OK",
          admin_code: "46553",
          oxygen_reserve: "backup",
        });

        await ctx.post(
          ":white_check_mark: `Oxygen reserve migration system armed.`"
        );
        await ctx.solve();
        return;
      }
    };

    ctx.httpListener.addListener(`/oxygen/6${ctx.team.id}763`, onRequest);

    return () => {
      ctx.httpListener.removeListener(`/oxygen/6${ctx.team.id}763`, onRequest);
    };
  },
  async start(ctx: ChallengeContext) {
    await ctx.slack.client.chat.postMessage({
      text: `The secret URL is https://epoch-mission-control.herokuapp.com/oxygen/6${ctx.team.id}763. You are recommended to pay attention to the response.`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `You quickly realize that your first and most pressing problem is oxygen; your ship's main oxygen store was only designed to last the duration of the trip.

Thankfully, the ship's engineers built in a backup oxygen reserve, but it's rather difficult to access.

To switch your ship's oxygen over to the backup, you'll need to make a POST request to a URL that's hidden in this message.`,
          },
        },
        {
          type: "divider",
        },
      ],
      channel: ctx.team.channel,
      token: ctx.token,
    });
  },
} as Challenge;
