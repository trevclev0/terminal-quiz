import type { ReactNode } from "react";
import styles from "./FormField.module.css";

type FormFieldProps = {
  label: string;
  /**
   * Appends the required marker to the label. Purely presentational — the
   * control in `children` still carries its own `required` attribute.
   */
  required?: boolean;
  /** The control this field wraps, plus any helper text that follows it. */
  children: ReactNode;
};

export default function FormField({
  label,
  required,
  children,
}: FormFieldProps) {
  return (
    // The control is supplied by the caller via children, so the association
    // cannot be seen statically. FormField.spec.tsx asserts it holds by
    // querying getByLabelText.
    // biome-ignore lint/a11y/noLabelWithoutControl: control comes from children
    <label className={styles.field}>
      {required ? <span className={styles.requiredField}>{label}</span> : label}
      {children}
    </label>
  );
}
