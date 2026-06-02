import { Icons } from '@/constants';
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/button";


describe("Button Component", () => {
  it("renders with default variants", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("h-spacing-2xl"); // default size
  });

  it("renders all variants correctly", () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button")).toHaveClass("border");

    rerender(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button")).toHaveClass("hover:bg-accent/10");
  });

  it("handles loading state with accessibility", () => {
    render(<Button isLoading>Action</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeDisabled();
    // Should have a spinner
    expect(button.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("standardizes icon size and alignment", () => {
    render(
      <Button size="icon" aria-label="search">
        <Icons.Search data-testid="search-icon" />
      </Button>
    );
    const button = screen.getByRole("button", { name: /search/i });
    expect(button).toHaveClass("h-spacing-2xl", "w-spacing-2xl");
    
    const icon = screen.getByTestId("search-icon");
    // The button has [&_svg]:size-spacing-md which sets width and height to 1.25rem (20px)
    // We expect the icon to have these classes applied via the button's CSS
  });

  it("fires onClick when not disabled/loading", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when loading", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} isLoading>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
