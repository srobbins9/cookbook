// Escape HTML so error messages display safely.
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

  container.innerHTML = `
    <div class="error-box">

      <h2>Failed to Load Page</h2>

      <p>
        An error occurred while loading content.
      </p>

      <pre>${escapeHtml(message)}</pre>

    </div>
  `;
}

// Shared JSON loader with detailed diagnostics.
export async function fetchJSON(path) {

  let response;

  try {

    response = await fetch(
      `${path}?v=${Date.now()}`
    );

  }
  catch (err) {

    throw new Error(
      `Network Error\n\n` +
      `File:\n${path}\n\n` +
      `${err.message}`
    );

  }

  if (!response.ok) {

    throw new Error(
      `File Load Error\n\n` +
      `File:\n${path}\n\n` +
      `HTTP ${response.status} ${response.statusText}`
    );

  }

  let text;

  try {

    text = await response.text();

  }
  catch (err) {

    throw new Error(
      `File Read Error\n\n` +
      `File:\n${path}\n\n` +
      `${err.message}`
    );

  }

  try {

    return JSON.parse(text);

  }
  catch (err) {

    const lines = text.split("\n");

    const startLine =
      Math.max(lines.length - 15, 0);

    const fileContext =
      lines
        .slice(startLine)
        .map((line, idx) =>
          `${startLine + idx + 1}: ${line}`
        )
        .join("\n");

    throw new Error(

      `Invalid JSON\n\n` +

      `File:\n${path}\n\n` +

      `Browser Error:\n${err.message}\n\n` +

      `Common Causes:\n` +
      `• Trailing comma before ] or }\n` +
      `• Missing comma\n` +
      `• Extra ] or }\n` +
      `• Missing ] or }\n\n` +

      `Last Lines Of File:\n\n` +
      fileContext

    );

  }
}