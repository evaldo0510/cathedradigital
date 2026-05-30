
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";
import { Search, Mail, Bell } from "lucide-react";

describe("Button Accessibility & Keyboard Navigation", () => {
  it("navigates through buttons using the keyboard in order", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Button id="btn1">Button 1</Button>
        <Button id="btn2">Button 2</Button>
        <Button id="btn3" disabled>Disabled Button</Button>
        <Button id="btn4">Button 4</Button>
      </div>
    );

    const btn1 = screen.getByRole("button", { name: /button 1/i });
    const btn2 = screen.getByRole("button", { name: /button 2/i });
    const btn4 = screen.getByRole("button", { name: /button 4/i });

    // Focus first button
    await user.tab();
    expect(btn1).toHaveFocus();

    // Tab to next
    await user.tab();
    expect(btn2).toHaveFocus();

    // Tab should skip disabled button and go to btn4
    await user.tab();
    expect(btn4).toHaveFocus();

    // Shift+Tab back
    await user.tab({ shift: true });
    expect(btn2).toHaveFocus();
  });

  it("applies correct aria attributes for loading state", () => {
    const { rerender } = render(<Button isLoading>Action</Button>);
    let button = screen.getByRole("button");
    
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeDisabled();

    rerender(<Button isLoading={false}>Action</Button>);
    button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button).not.toHaveAttribute("aria-disabled");
    expect(button).not.toBeDisabled();
  });

  it("maintains focusable state correctly with isLoading", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Button id="btn-normal">Normal</Button>
        <Button id="btn-loading" isLoading>Loading</Button>
        <Button id="btn-after">After</Button>
      </div>
    );

    const normal = screen.getByRole("button", { name: /normal/i });
    const loading = screen.getByRole("button", { name: /loading/i }); // The loading one
    const after = screen.getByRole("button", { name: /after/i });

    await user.tab();
    expect(normal).toHaveFocus();

    // Tab to loading button - it should be focusable but disabled (preventing clicks)
    // Actually, shadcn/ui buttons often use 'disabled' prop which makes them not focusable in some browsers/versions
    // but React's 'disabled' attribute usually makes it non-tabbable.
    // Let's verify our implementation.
    await user.tab();
    // In our implementation, disabled={isLoading || disabled}
    // If it's disabled, it's NOT focusable by default tab navigation.
    expect(after).toHaveFocus(); 
  });

  it("ensures icon-only buttons have labels and consistent sizing", () => {
    render(
      <Button size="icon" aria-label="Search Settings">
        <Search />
      </Button>
    );
    
    const button = screen.getByRole("button", { name: /search settings/i });
    expect(button).toHaveClass("h-spacing-2xl w-spacing-2xl");
    
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
    // The size is controlled by the button's [&_svg]:size-spacing-md class in standard variants
  });

  it("handles multiple icons or complex children without breaking alignment", () => {
    render(
      <Button>
        <Mail />
        <span>Contact</span>
        <Bell />
      </Button>
    );
    
    const button = screen.getByRole("button");
    expect(button).toHaveClass("inline-flex items-center justify-center gap-spacing-xs");
  });

  it("matches snapshot for premium styling", () => {
    const { container } = render(
      <div className="space-y-spacing-md">
        <Button variant="default">Primary</Button>
        <Button variant="outline" size="sm">Small Outline</Button>
        <Button size="icon" isLoading />
      </div>
    );
    expect(container).toMatchSnapshot();
  });
});
