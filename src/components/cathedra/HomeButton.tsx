import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface HomeButtonProps extends ButtonProps {}

const HomeButton = React.forwardRef<HTMLButtonElement, HomeButtonProps>(
  (props, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
      />
    );
  }
);
HomeButton.displayName = "HomeButton";

export { HomeButton };
