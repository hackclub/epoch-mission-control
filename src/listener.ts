import {
  App,
  ExpressReceiver,
  Middleware,
  SlackAction,
  SlackActionMiddlewareArgs,
  SlackCommandMiddlewareArgs,
  SlackEventMiddlewareArgs,
} from "@slack/bolt";
import { EventEmitter } from "events";

import config from "./config";

export class HttpListener extends EventEmitter {
  receiver: ExpressReceiver;

  constructor(receiver: ExpressReceiver) {
    super();

    this.receiver = receiver;

    receiver.app.get("/", (req, res) => {
      res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    });

    receiver.app.use((req, res, next) => {
      try{
        if (this.listenerCount(req.path) > 0) {
          this.emit(req.path, req, res, next);
        } else {
          next();
        }
      }
      catch(e){
        console.log(e)
      }
    });
  }
}

export class SlackEventListener extends EventEmitter {
  app: App;

  commandListeners: string[] = [];
  eventListeners: string[] = [];

  constructor(app: App) {
    super();

    this.app = app;

    config.commands.forEach((c) => {
      app.command(c, this.commandListener(c));
    });

    config.events.forEach((e) => {
      app.event(e, this.eventListener(e));
    });

    config.actions.forEach((e) => {
      app.action(e, this.actionListener(e));
    });
  }

  command(
    command: string,
    channel: string,
    listener: Middleware<SlackCommandMiddlewareArgs>
  ): void {
    this.addListener(`command:${command}:${channel}`, listener);
  }

  removeCommand(
    command: string,
    channel: string,
    listener: Middleware<SlackCommandMiddlewareArgs>
  ): void {
    this.removeListener(`command:${command}:${channel}`, listener);
  }

  action<T extends SlackAction>(
    action_id: string,
    listener: Middleware<SlackActionMiddlewareArgs<T>>
  ): void {
    this.addListener(`action:${action_id}`, listener);
  }

  event<T extends string>(
    event: T,
    listener: Middleware<SlackEventMiddlewareArgs<T>>
  ): void {
    this.addListener(`event:${event}`, listener);
  }

  private commandListener(
    command: string
  ): Middleware<SlackCommandMiddlewareArgs> {
    return async (args) => {
      if (
        this.listenerCount(`command:${command}:${args.command.channel_id}`) > 0
      ) {
        this.emit(`command:${command}:${args.command.channel_id}`, args);
      } else {
        console.log("ack-ing unhandled command");
        await args.ack();
      }
    };
  }

  private eventListener<T extends string>(
    event: T
  ): Middleware<SlackEventMiddlewareArgs<T>> {
    return async (args) => {
      this.emit(`event:${event}`, args);
    };
  }

  private actionListener(
    action_id: string
  ): Middleware<SlackActionMiddlewareArgs> {
    return async (args) => {
      if (this.listenerCount(`action:${action_id}`) > 0) {
        this.emit(`action:${action_id}`, args);
      } else {
        console.log("ack-ing unhandled action");
        await args.ack();
      }
    };
  }
}
