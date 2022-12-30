import {
  AllMiddlewareArgs,
  BlockAction,
  ButtonAction,
  SlackActionMiddlewareArgs,
  SlackEventMiddlewareArgs,
} from "@slack/bolt";
import { Team } from "../types/team";
import { Challenge, ChallengeContext } from "./lib/challenge";

const isProduction = process.env.NODE_ENV === "production";

const NUM_REACTIONS = isProduction ? 3 : 1;
const EMOJI = "white_check_mark";

function onReaction(ctx: ChallengeContext) {
  return async ({
    event,
  }: SlackEventMiddlewareArgs<"reaction_added"> & AllMiddlewareArgs) => {
    if (
      event.reaction === EMOJI &&
      event.item.type === "message" &&
      event.item.channel === ctx.team.channel
    ) {
      let resp
      try{
       resp = await ctx.slack.client.conversations.history({
        latest: event.item.ts,
        inclusive: true,
        limit: 1,
        channel: ctx.team.channel,
        token: ctx.token,
      });
    }
      catch(e){
        console.log(ctx.team.channel)
    }

      if (!resp.messages) return;

      const message = resp.messages[0];

      if (message) {
        const { text, reactions } = message;
        try{
        if (
          reactions &&
          (reactions
            .find((i) => i.name === EMOJI)!
            .users!.filter((u) => !isProduction || u !== event.item_user)
            .length || 0) >= NUM_REACTIONS
        ) {
          await ctx.slack.client.chat.postMessage({
            token: ctx.token,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `Would you like to make *${text}* your team name?`,
                },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Yes!",
                    },
                    style: "primary",
                    action_id: `confirm-team-name-${ctx.team.id}`,
                    value: text,
                  },
                ],
              },
            ],
            text: `Would you like to make *${text}* your team name?`,
            channel: ctx.team.channel,
          });
        }}catch(e){
          console.log(ctx.team.channel)
      }
      }
    }
  };
}

export default {
  name: "Team Name",

  async init(ctx: ChallengeContext) {
    const reactionListener = onReaction(ctx);
    const actionListener = async ({
      ack,
      payload: { value: text },
      body,
    }: SlackActionMiddlewareArgs<BlockAction<ButtonAction>>) => {
      await ack();
      try{
      await ctx.slack.client.chat.update({
        ts: body.message!.ts,
        channel: body.channel!.id,
        token: ctx.token,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Would you like to make *${text}* your team name?`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<@${body.user.id}> clicked *Yes!*`,
            },
          },
        ],
        text: `Would you like to make *${text}* your team name?`,
      });
    }catch(e){
      console.log(ctx.team.channel)
  }

      ctx.team.name = text;
      await ctx.team.save();
      try{
      await ctx.slack.client.conversations.rename({
        channel: ctx.team.channel,
        name: `${!isProduction ? "test-" : ""}spaceteam-${text
          .trim()
          .toLowerCase()
          .replace(/\s/g, "-")
          .replace(/[^a-z0-9-]/g, "")}`,
        token: ctx.userToken,
      });
    }catch(e){
      console.log(ctx.team.channel)
  }
      await ctx.post(`I've set your team name to *${text}*!`);

      const teams = await Team.find();
      await ctx.solve();
    };

    ctx.listener.event("reaction_added", reactionListener);
    ctx.listener.action(`confirm-team-name-${ctx.team.id}`, actionListener);

    return () => {
      ctx.listener.removeListener("event:reaction_added", reactionListener);
      ctx.listener.removeListener(
        `action:confirm-team-name-${ctx.team.id}`,
        actionListener
      );
    };
  },
  async start(ctx: ChallengeContext) {
    await ctx.post(
      `One quick thing before you start: you'll need to work together to come up with a team name. Put your ideas down in the chat :arrow_down:, then react with :${EMOJI}: to the ones you like the most.

I'll continue once a message has ${NUM_REACTIONS} :${EMOJI}: reactions.`
    );
  },
} as Challenge;
