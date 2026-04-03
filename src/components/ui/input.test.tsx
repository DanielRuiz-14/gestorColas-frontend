import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("keeps a comfortable base font size on desktop layouts", () => {
    render(<Input aria-label="Nombre del cliente" />);

    expect(screen.getByLabelText("Nombre del cliente")).toHaveClass("text-base");
    expect(screen.getByLabelText("Nombre del cliente")).not.toHaveClass("md:text-sm");
  });
});
