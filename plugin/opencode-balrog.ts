import { type Plugin } from "@opencode-ai/plugin";
import { Message, type Part } from "@opencode-ai/sdk";
import * as fs from "fs";

const URL = "http://localhost:5001/log";

class Balrog {
  async record(tag: string, fields: object): Promise<void> {
    const event = { [tag]: fields };
    if (!URL) {
      await this.recordInFile(event);
    } else {
      const response = await fetch(URL, {
        method: "POST",
        body: JSON.stringify(event),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        await this.recordInFile(event);
      }
    }
  }

  async recordInFile(event: object): Promise<void> {
    const contents = `${String(JSON.stringify(event ?? null))}\n\n`;
    fs.appendFileSync("tracy.json", contents);
  }
}

export const BalrogPlugin: Plugin = async (context) => {
  const handler = new Balrog();
  await handler.record("initialize", {
    context: {
      ...context,
      client: null,
      $: null,
    },
  });
  return {
    "experimental.chat.messages.transform": (input, output) =>
      handler.record("experimental.chat.messages.transform", { input, output }),
    "command.execute.before": (input, output) =>
      handler.record("command.execute.before", { input, output }),
    "tool.execute.before": (input, output) =>
      handler.record("tool.execute.before", { input, output }),
    "tool.execute.after": (input, output) =>
      handler.record("tool.execute.after", { input, output }),
    "chat.message": (input, output) =>
      handler.record("chat.message", { input, output }),
  };
};
