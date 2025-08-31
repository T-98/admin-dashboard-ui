import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import Invite from "../components/Invite";
import { CurrentUserContext, type CurrentUserMap } from "../contexts/CurrentUserContext";

function withUserContext(ui: React.ReactNode, value: CurrentUserMap) {
  return (
    <CurrentUserContext.Provider value={value}>
      {ui}
    </CurrentUserContext.Provider>
  );
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Invite debounce", () => {
  it("ignores rapid double-clicks for the same org until resolved", async () => {
    const ctx: CurrentUserMap = {
      organizations: [{ organizationId: 1, organization: { name: "Acme" } }],
      teams: [],
    };

    const def = deferred<void>();
    const onRowAction = vi.fn(() => def.promise);

    render(
      withUserContext(
        <Invite
          userName="Jane"
          userEmail="jane@example.com"
          userId={42}
          onRowAction={onRowAction}
        />,
        ctx
      )
    );

    const btn = screen.getByRole("button", { name: /Organization Acme/i });

    // First click triggers the invite
    fireEvent.click(btn);
    // Immediate second click should be debounced
    fireEvent.click(btn);

    expect(onRowAction).toHaveBeenCalledTimes(1);

    // Resolve the first invite and wait for state to flush
    await act(async () => {
      def.resolve();
      await Promise.resolve();
    });
    await waitFor(() => expect(btn).not.toBeDisabled());

    // Now a subsequent click should be allowed
    fireEvent.click(btn);
    expect(onRowAction).toHaveBeenCalledTimes(2);
  });
});
