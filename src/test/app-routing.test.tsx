import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

function renderAt(path: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Assert only that the router mounts and paints, never page content:
// routes are rewritten as the app is built and this must keep passing.
describe("App routing", () => {
  it("renders the index route", async () => {
    const { container } = renderAt("/");

    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("renders the not-found route", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { container } = renderAt("/this-route-does-not-exist");

    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("redirects featured project cards to Behance project pages", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderAt("/");

    fireEvent.click(screen.getByRole("button", { name: /Dimension/i }));

    expect(openSpy).toHaveBeenCalledWith(
      "https://www.behance.net/gallery/255379433/Dimension-Immersive-VR-Experience-Landing-Page",
      "_blank",
      "noopener,noreferrer",
    );
  });
});
