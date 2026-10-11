import { createServer } from "node:http";

const server = createServer(async (request, response) => {
  const reply = (status: number, body: object) => {
    response.writeHead(status, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(body));
  };

  if (request.url !== "/log") {
    reply(404, { error: "Not found" });
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    reply(405, { error: "Method not allowed" });
    return;
  }

  try {
    const chunks: Buffer[] = [];

    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }

    const event: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));

    if (event === null || typeof event !== "object" || Array.isArray(event)) {
      reply(400, { error: "Expected a JSON object" });
      return;
    }

    console.log(JSON.stringify(event));
    reply(200, { ok: true });
  } catch {
    reply(400, { error: "Invalid JSON or incomplete request" });
  }
});

server.listen(5001, "localhost", () => {
  console.log("Balrog receiver listening on http://localhost:5001");
});
