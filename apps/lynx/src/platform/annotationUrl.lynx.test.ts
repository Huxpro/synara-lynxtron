import { describe, expect, it } from "@rstest/core";
import { sanitizeBrowserAnnotationUrl } from "@synara/shared/browserAnnotations";
import { URL, URLSearchParams } from "./annotationUrl.lynx";

describe("annotation URL platform port", () => {
  it("runs the unchanged upstream sanitizer through the scoped port", () => {
    expect(
      sanitizeBrowserAnnotationUrl(
        "https://alice:secret@example.test/docs?token=secret&tab=details#private",
      ),
    ).toBe("https://example.test/docs?tab=details");
    expect(
      sanitizeBrowserAnnotationUrl(
        "https://example.test/patients/123456789/records/jane-doe?section=jane-doe&view=details",
      ),
    ).toBe("https://example.test/patients/REDACTED/records/REDACTED?section=REDACTED&view=details");
  });
  it("exposes the fields used by upstream annotation sanitization", () => {
    const url = new URL("https://user:secret@example.com/a/b?q=private#fragment");
    expect(url.pathname).toBe("/a/b");
    expect(url.hostname).toBe("example.com");
    expect(url.searchParams.get("q")).toBe("private");
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    expect(url.toString()).toBe("https://example.com/a/b");
    expect(new URLSearchParams("x=1").get("x")).toBe("1");
  });
});
