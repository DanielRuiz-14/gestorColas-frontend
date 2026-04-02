import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner, CardSkeleton, GridSkeleton } from "./loading";

describe("Loading components", () => {
  it("Spinner renders animated element", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("CardSkeleton renders correct number of skeletons", () => {
    const { container } = render(<CardSkeleton count={5} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5);
  });

  it("GridSkeleton renders in grid layout", () => {
    const { container } = render(<GridSkeleton count={4} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4);
    expect(container.querySelector(".grid")).toBeInTheDocument();
  });
});
