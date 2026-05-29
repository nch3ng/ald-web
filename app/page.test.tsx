import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

// Smoke test: the home page renders its heading. Proves the test toolchain
// (Vitest + React Testing Library + tsconfig path resolution) is wired up
// end-to-end, so a green/red CI run is meaningful.
test("Home renders the hello-world heading", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { level: 1, name: /hello, world/i }),
  ).toBeInTheDocument();
});
