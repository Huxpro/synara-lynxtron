import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { PullRequestActorLabel } from "./PullRequestActorLabel.lynx";

describe("Pull Request actor label fidelity", () => {
  it("renders the GitHub avatar and login as one named actor", () => {
    render(
      <PullRequestActorLabel
        actor={{
          login: "octocat",
          name: "The Octocat",
          avatarUrl: "https://avatars.example/octocat.png",
        }}
        variant="reviewer"
      />,
    );

    const label = elementTree.root?.querySelector(".SharedPrActorLabel");
    expect(label?.getAttribute("accessibility-label")).toBe("octocat");
    expect(label?.querySelector(".SharedPrActorAvatar")?.getAttribute("src")).toBe(
      "https://avatars.example/octocat.png",
    );
    expect(label?.querySelector(".SharedPrActorLogin")?.textContent).toBe("octocat");
  });

  it("falls back to initials and the canonical ghost login", () => {
    const { rerender } = render(
      <PullRequestActorLabel
        actor={{
          login: "reviewer",
          name: "Reviewer",
          avatarUrl: "https://avatars.example/reviewer.png",
        }}
        variant="author"
      />,
    );
    const image = elementTree.root?.querySelector(".SharedPrActorAvatar");
    fireEvent(image!, new Event("bindEvent:error", { bubbles: true }));
    expect(elementTree.root?.querySelector(".SharedPrActorAvatarInitial")?.textContent).toBe("R");

    rerender(<PullRequestActorLabel actor={null} variant="author" />);
    expect(
      elementTree.root?.querySelector(".SharedPrActorLabel")?.getAttribute("accessibility-label"),
    ).toBe("ghost");
    expect(elementTree.root?.querySelector(".SharedPrActorLogin")?.textContent).toBe("ghost");
  });

  it("uses meta text for authors/comments and fine text for reviewers", () => {
    const styles = readFileSync(new URL("./pull-request-actor-label.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.SharedPrActorLogin\s*\{[^}]*font-size:\s*var\(--app-font-size-ui\);[^}]*line-height:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.SharedPrActorLabel--reviewer \.SharedPrActorLogin\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm\);/s,
    );
  });

  it("matches the shared half-strength avatar ring in both themes", () => {
    const styles = readFileSync(new URL("./pull-request-actor-label.css", import.meta.url), "utf8");
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.SharedPrActorAvatar\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*border:\s*1px solid var\(--pr-avatar-ring\);[^}]*border-radius:\s*8px;/s,
    );
    expect(appStyles).toContain("--pr-avatar-ring: rgba(13, 13, 13, 0.0345);");
    expect(appStyles).toContain("--pr-avatar-ring: rgba(252, 252, 252, 0.036);");
  });
});
