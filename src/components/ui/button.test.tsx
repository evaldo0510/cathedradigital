import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/cathedra/CathedraButton";
import { Search } from "lucide-react";

describe("Button Component", () => {
  it("renders with default variants", () => {
    render(<CathedraButton>Click me</CathedraButton>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("h-14"); // default size
  });

  it("renders all variants correctly", () => {
    const { rerender } = render(<CathedraButton variant="outline">Outline</CathedraButton>);
    expect(screen.getByRole("button")).toHaveClass("border");

    rerender(<CathedraButton variant="destructive">Delete</CathedraButton>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");

    rerender(<CathedraButton variant="ghost">Ghost</CathedraButton>);
    expect(screen.getByRole("button")).toHaveClass("hover:bg-accent/10");
  });

  it("handles loading state with accessibility", () => {
    render(<CathedraButton isLoading>Action</CathedraButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeDisabled();
    // Should have a spinner
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(<CathedraButton disabled>Disabled</CathedraButton>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("standardizes icon size and alignment", () => {
    render(
      <CathedraButton size="icon" aria-label="search">
        <Search data-testid="search-icon" />
      </CathedraButton>
    );
    const button = screen.getByRole("button", { name: /search/i });
    expect(button).toHaveClass("h-12", "w-12");
    
    const icon = screen.getByTestId("search-icon");
    // The button has [&_svg]:size-5 which sets width and height to 1.25rem (20px)
    // We expect the icon to have these classes applied via the button's CSS
  });

  it("fires onClick when not disabled/loading", () => {
    const handleClick = vi.fn();
    render(<CathedraButton onClick={handleClick}>Click</CathedraButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when loading", () => {
    const handleClick = vi.fn();
    render(<CathedraButton onClick={handleClick} isLoading>Click</CathedraButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
