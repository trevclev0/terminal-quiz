import { authClient } from "@api/authClient";
import styles from "./LoginPage.module.css";

export default function LoginPage({
  redirectTo = "/programs/select",
}: {
  redirectTo?: string;
}) {
  return (
    <div className={styles.container}>
      <h1>login</h1>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          onClick={() =>
            authClient.signIn.social({
              provider: "github",
              callbackURL: redirectTo,
            })
          }
        >
          Continue with GitHub
        </button>
        <button
          type="button"
          onClick={() =>
            authClient.signIn.social({
              provider: "google",
              callbackURL: redirectTo,
            })
          }
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
