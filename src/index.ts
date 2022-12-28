import "reflect-metadata";
import { createConnection } from "typeorm";

import { Team } from "./types/team";

import { app, currentChallenges } from "./state";
import { setChallenge } from "./util";
import config from "./config";
import { Block, SectionBlock } from "@slack/bolt";
import challenges from "./challenges";

app.command("/start", async ({ ack, command: { text, user_id: user } }) => {
  if (!config.admin.includes(user)) {
    await ack("wat");
    return;
  }

  const teams = await Team.find();

  if (text === "") {
    await ack("yay");

    teams.forEach(async (team) => {
      await setChallenge(team, 0, true);
    });
    return;
  } else if (text === "null") {
    await ack("yay");

    teams.forEach(async (team) => {
      await setChallenge(team, null, true);
    });
    return;
  }

  const number = parseInt(text);

  if (isNaN(number) || number >= challenges.length) {
    await ack("hmm");
    return;
  }

  teams.forEach(async (team) => {
    if (text === "null") {
      await setChallenge(team, null, true);
      console.log(currentChallenges);

      return;
    }

    await setChallenge(team, number || 0, true);
  });

  await ack("yay");
});

app.command("/starship-status", async ({ ack }) => {
  const blocks: Block[] = [];

  const teams = await Team.createQueryBuilder("team").orderBy("id").getMany();

  teams.forEach((team) => {
    if (team.currentChallenge !== null) {
      blocks.push(<SectionBlock>{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Team ${team.id} (${
            team.name ? "*" + team.name + "*" : "_no name yet_"
          }) is on challenge ${team.currentChallenge + 1}/${
            challenges.length
          }: *${challenges[team.currentChallenge].name}*`,
        },
      });
    } else {
      blocks.push(<SectionBlock>{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Team ${team.id} (${
            team.name ? "*" + team.name + "*" : "_no name yet_"
          }) isn't working on a challenge right now.`,
        },
      });
    }
  });

  await ack({
    blocks,
  });
});

(async () => {
  await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Team],
    synchronize: true,
    ssl: true
  });

  // Init challenges
  const teams = await Team.find();
  teams.forEach(async (team) => {
    if (team.currentChallenge !== null) {
      await setChallenge(team, team.currentChallenge, false);
    }
  });

  await app.start(parseInt(process.env.PORT!) || 3000);
  console.log("App started!");
})();
