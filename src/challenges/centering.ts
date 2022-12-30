import { AllMiddlewareArgs, SlackEventMiddlewareArgs } from "@slack/bolt";
import { FileShareMessageEvent } from "@slack/bolt/dist/types/events/message-events";
import { Challenge, ChallengeContext } from "./lib/challenge";

import axios from "axios";
import puppeteer from "puppeteer";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { readFile } from "fs/promises";

const centering: Challenge = {
  name: "Centering A Div",
  async init(ctx: ChallengeContext) {
    const onMessage = async (
      args: SlackEventMiddlewareArgs<"message"> & AllMiddlewareArgs
    ) => {
      const event = args.event as FileShareMessageEvent;

      if (
        event.channel === ctx.team.channel &&
        event.files &&
        event.files[0] &&
        event.files[0].filetype === "html" &&
        event.files[0].url_private &&
        !event.thread_ts
      ) {
        const file = await axios(event.files[0].url_private, {
          headers: {
            Authorization: `Bearer ${ctx.token}`,
          },
        });

        const browser = await puppeteer.launch({
          args: ["--no-sandbox"],
        });
        const page = await browser.newPage();

        await page.setContent(file.data);
        const screenshot = (await page.screenshot()) as Buffer;

        await browser.close();

        const img1 = PNG.sync.read(screenshot);
        const img2 = PNG.sync.read(await readFile("screenshot-a.png"));
        const img3 = PNG.sync.read(await readFile("screenshot-b.png"));

        const diffPixels = pixelmatch(img1.data, img2.data, null, 800, 600);
        
        const diffPixels2 = pixelmatch(img1.data, img3.data, null, 800, 600);

        if (diffPixels > 500 && diffPixels2 > 500) {
          await ctx.slack.client.reactions.add({
            name: "x",
            channel: event.channel,
            timestamp: event.ts,
          });

          await ctx.slack.client.files.upload({
            channels: ctx.team.channel,
            file: screenshot,
            initial_comment:
              "Hmm... that doesn't look quite right to me. Here's what I'm seeing :arrow_down: (make sure you've followed all the instructions!)",
          });
        } else {
          await ctx.slack.client.reactions.add({
            name: "white_check_mark",
            channel: event.channel,
            timestamp: event.ts,
          });

          await ctx.slack.client.files.upload({
            filename: "EEBY DEEBY",
            channels: ctx.team.channel,
            file: screenshot,
            initial_comment:
              "Congratulations, you've beat all odds to vertically center something in CSS and improve upon the communications UI!",
          });

          await ctx.solve();
        }
      }
    };

    ctx.listener.event("message", onMessage);

    return () => {
      ctx.listener.removeListener("event:message", onMessage);
    };
  },
  async start(ctx: ChallengeContext) {
    await ctx.post(`With your ship's oxygen at a safe level, your crew takes a look the communications system.

You can't help but notice that the UI looks terrible! So terrible, in fact, that you can barely figure out how to log in.

_Needs more eeby deeby_, you think.

Being the developer you are, you decide to take a minute to spice up the communications UI while the rest of your team isn't looking :shushing_face:

*Your objective:* in a single HTML file, create a page that simply contains the text \`EEBY DEEBY\`, with this style:

- a \`sans-serif\` font
- the thickest possible font weight
- red (\`#FF0000\`)
- 30px font size

There's a catch though: the text must be *vertically and horizontally centered*. _Is this even possible?_ you think to yourself.

You may submit your new UI in one of 2 different ways:

- Upload an \`.html\` file to this channel
- Place your solution in a text snippet (not a message) sent to this channel. (make sure the \`type\` is set to HTML)

Good luck!`);
  },
};

export default centering;
