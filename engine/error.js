// Escape HTML so error messages and stack traces display safely.
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Display a detailed error on the page.
export function showPageError(containerId, error) {

  console.error(error);

  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  const message =
    error?.message || "Unknown error";

  const stack =
    error?.stack || "";

  container.innerHTML = `
    <div class="error-box">

      <h2>Failed to Load Page</h2>

      <p>
        An error occurred while loading content.
      </p>

      <h3>Error</h3>

      <pre>${escapeHtml(message)}</pre>

      ${
        stack
          ? `
            <h3>Stack Trace</h3>

            <pre>${escapeHtml(stack)}</pre>
          `
          : ""
      }

    </div>
  `;
}

// Shared JSON loader with detailed diagnostics.
//
// Loads text first, then parses manually so JSON syntax
// errors can be converted into readable messages with
// file name, line number, column, and context.
export async function fetchJSON(path) {

  let response;

  try {

    response = await fetch(
      `${path}?v=${Date.now()}`
    );

  }
  catch (err) {

    throw new Error(
      `Network error while loading:\n\n` +
      `${path}\n\n` +
      `${err.message}`
    );

  }

  if (!response.ok) {

    throw new Error(
      `Failed to load file:\n\n` +
      `${path}\n\n` +
      `HTTP ${response.status} ${response.statusText}`
    );

  }

  let text;

  try {

    text = await response.text();

  }
  catch (err) {

    throw new Error(
      `Failed reading file:\n\n` +
      `${path}\n\n` +
      `${err.message}`
    );

  }

  try {

    return JSON.parse(text);

  }
  catch (err) {

    let detailedMessage =
      `Invalid JSON in:\n\n` +
      `${path}\n\n` +
      `${err.message}`;

    const match =
      err.message.match(/position\s+(\d+)/i);

    if (match) {

      const position =
        Number(match[1]);

      if (Number.isFinite(position)) {

        const before =
          text.substring(0, position);

        const line =
          before.split("\n").length;

        const lastNewline =
          before.lastIndexOf("\n");

        const column =
          position - lastNewline;

        const lines =
          text.split("\n");

        const errorLine =
          lines[line - 1] || "";

        const pointer =
          " ".repeat(Math.max(column - 1, 0)) + "^";

        detailedMessage =
          `Invalid JSON in:\n\n` +
          `${path}\n\n` +
          `Line: ${line}\n` +
          `Column: ${column}\n` +
          `Position: ${position}\n\n` +
          `Problem Line:\n\n` +
          `${errorLine}\n` +
          `${pointer}\n\n` +
          `${err.message}`;
      }
    }

    throw new Error(detailedMessage);

  }
}