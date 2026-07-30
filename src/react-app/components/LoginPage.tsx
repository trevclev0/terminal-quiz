import { authClient } from "@api/authClient";

export default function LoginPage({
  redirectTo = "/programs/select",
}: {
  redirectTo?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
        paddingTop: "4rem",
      }}
    >
      <h1>login</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "300px",
        }}
      >
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
