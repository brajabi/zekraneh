import { Button, type ButtonVariant } from "heroui-native";

interface AppButtonProps {
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly fullWidth?: boolean;
  readonly className?: string;
  readonly isDisabled?: boolean;
  readonly onPress?: () => void;
  readonly accessibilityLabel?: string;
}

export function AppButton({ label, variant = "primary", fullWidth = false, className, isDisabled, onPress, accessibilityLabel }: AppButtonProps) {
  return (
    <Button accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} variant={variant} isDisabled={isDisabled} onPress={onPress} className={`min-h-11 rounded-[14px] px-4 ${fullWidth ? "w-full" : ""} ${className ?? ""}`.trim()}>
      <Button.Label className="font-sans text-sm">{label}</Button.Label>
    </Button>
  );
}
