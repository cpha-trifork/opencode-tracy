import { type Plugin } from "@opencode-ai/plugin";
import { Message, type Part } from "@opencode-ai/sdk";
import * as fs from "fs";

async function appendRecord(record: object): Promise<void> {
  const contents = `${String(JSON.stringify(record ?? null))}\n\n`;
  fs.appendFileSync("tracy.json", contents);
}

function partToJson(part: Part): object {
  const base = {
    id: part.id,
    messageID: part.messageID,
    sessionID: part.sessionID,
    type: part.type,
  };
  switch (part.type) {
    case "text":
      return {
        ...base,
        text: part.text,
        synthetic: part.synthetic,
        ignored: part.ignored,
        metadata: part.metadata,
      };
    case "reasoning":
      return {
        ...base,
        text: part.text,
        metadata: part.metadata,
      };
    case "step-start":
      return {
        ...base,
        snapshot: part.snapshot,
      };
    case "patch":
      return {
        ...base,
        files: part.files,
        hash: part.hash,
      };
    case "subtask":
    case "file":
    case "tool":
    case "step-finish":
    case "snapshot":
    case "agent":
    case "retry":
    case "compaction":
      // TODO
      return {
        ...base,
        unknown: true,
      };
  }
}

function messageToJson(message: Message): object {
  const base = {
    id: message.id,
    sessionID: message.sessionID,
    role: message.role,
  };
  switch (message.role) {
    case "user":
      return {
        ...base,
        system: message.system,
        tools: message.tools,
      };
    case "assistant":
      // TODO
      return {
        ...base,
        unknown: true,
      };
  }
}

export const TracyPlugin: Plugin = async (ctx) => {
  appendRecord({
    initialize: {
      worktree: ctx.worktree,
      directory: ctx.directory,
      serverUrl: ctx.serverUrl.toString(),
      project: {
        id: ctx.project.id,
        vcs: ctx.project.vcs,
        vcsDir: ctx.project.vcsDir,
        worktree: ctx.project.worktree,
      },
    },
  });
  return {
    "experimental.chat.messages.transform": (input, output) =>
      appendRecord({
        "chat.messages": {
          output: output.messages.map((m) => ({
            info: messageToJson(m.info),
            parts: m.parts.map(partToJson),
          })),
        },
      }),
    "command.execute.before": (input, output) =>
      appendRecord({
        "command.execute.before": {
          input: {
            command: input.command,
            sessionID: input.sessionID,
            arguments: input.arguments,
          },
          output: {
            parts: output.parts.map(partToJson),
          },
        },
      }),
    "tool.execute.before": (input, output) =>
      appendRecord({
        "tool.execute.before": {
          input: {
            tool: input.tool,
            sessionID: input.sessionID,
            callID: input.callID,
          },
        },
      }),
    "tool.execute.after": (input, output) =>
      appendRecord({
        "tool.execute.after": {
          input: {
            command: input.tool,
            sessionID: input.sessionID,
            callID: input.callID,
            args: input.args,
          },
          output: {
            output: output.output,
            title: output.title,
            metadata: output.metadata,
          },
        },
      }),
    "chat.message": (input, output) =>
      appendRecord({
        "chat.message": {
          input: {
            agent: input.agent,
            sessionID: input.sessionID,
            model: {
              providerID: input.model?.providerID,
              modelID: input.model?.modelID,
            },
          },
          output: {
            message: messageToJson(output.message),
            parts: output.parts.map(partToJson),
          },
        },
      }),
  };
};
