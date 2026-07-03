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

    throw new Error(
      `Invalid JSON in:\n\n` +
      `${path}\n\n` +
      `${err.message}`
    );

  }
}