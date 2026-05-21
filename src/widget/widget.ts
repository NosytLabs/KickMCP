type ToolResult = {
  structuredContent?: {
    channels?: Array<Record<string, unknown>>;
    livestreams?: Array<Record<string, unknown>>;
    is_sent?: boolean;
    message_id?: string;
    deleted?: boolean;
  };
  content?: Array<{ type: string; text?: string }>;
};

const root = document.getElementById("root");

function text(value: unknown, fallback = "Unknown") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function numberText(value: unknown) {
  return typeof value === "number" ? value.toLocaleString() : "0";
}

function renderChannel(channel: Record<string, unknown>) {
  const category = channel.category as Record<string, unknown> | undefined;
  const stream = channel.stream as Record<string, unknown> | undefined;
  const isLive = stream?.is_live === true;

  return `
    <article class="item">
      <div>
        <div class="eyebrow">${isLive ? "Live channel" : "Channel"}</div>
        <h2>${text(channel.slug)}</h2>
      </div>
      <dl>
        <div><dt>Broadcaster ID</dt><dd>${numberText(channel.broadcaster_user_id)}</dd></div>
        <div><dt>Title</dt><dd>${text(channel.stream_title, "No stream title")}</dd></div>
        <div><dt>Category</dt><dd>${text(category?.name, "Uncategorized")}</dd></div>
        <div><dt>Subscribers</dt><dd>${numberText(channel.active_subscribers_count)}</dd></div>
      </dl>
    </article>
  `;
}

function renderLivestream(stream: Record<string, unknown>) {
  const category = stream.category as Record<string, unknown> | undefined;
  return `
    <article class="item stream">
      <div>
        <div class="eyebrow">${text(category?.name, "Livestream")}</div>
        <h2>${text(stream.stream_title, text(stream.slug))}</h2>
      </div>
      <dl>
        <div><dt>Channel</dt><dd>${text(stream.slug)}</dd></div>
        <div><dt>Viewers</dt><dd>${numberText(stream.viewer_count)}</dd></div>
        <div><dt>Language</dt><dd>${text(stream.language)}</dd></div>
        <div><dt>Started</dt><dd>${text(stream.started_at, "Unknown")}</dd></div>
      </dl>
    </article>
  `;
}

function render(result?: ToolResult) {
  if (!root) return;

  const data = result?.structuredContent;
  if (!data) {
    root.innerHTML = `<main class="shell"><h1>KICK</h1><p>Waiting for a Kick tool result.</p></main>`;
    return;
  }

  if (data.channels) {
    root.innerHTML = `
      <main class="shell">
        <header><h1>KICK</h1><p>${data.channels.length} channel${data.channels.length === 1 ? "" : "s"} loaded</p></header>
        <section class="list">${data.channels.map(renderChannel).join("")}</section>
      </main>
    `;
    return;
  }

  if (data.livestreams) {
    root.innerHTML = `
      <main class="shell">
        <header><h1>KICK Live</h1><p>${data.livestreams.length} stream${data.livestreams.length === 1 ? "" : "s"} loaded</p></header>
        <section class="list">${data.livestreams.map(renderLivestream).join("")}</section>
      </main>
    `;
    return;
  }

  if (typeof data.is_sent === "boolean") {
    root.innerHTML = `
      <main class="shell status">
        <h1>${data.is_sent ? "Message sent" : "Message not sent"}</h1>
        <p>${data.message_id ? `Message ID: ${data.message_id}` : "Kick did not return a message ID."}</p>
      </main>
    `;
    return;
  }

  if (data.deleted) {
    root.innerHTML = `
      <main class="shell status">
        <h1>Message deleted</h1>
        <p>Message ID: ${data.message_id}</p>
      </main>
    `;
  }
}

window.addEventListener(
  "message",
  (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;
    if (message.method === "ui/notifications/tool-result") {
      render(message.params);
    }
  },
  { passive: true },
);

render();
