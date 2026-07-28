import { authClient } from "@api/authClient";
import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";

const linkStyle: CSSProperties = {
  color: "var(--green)",
  textDecoration: "underline",
  textUnderlineOffset: "4px",
};

export default function NavBar() {
  const { data: session } = authClient.useSession();

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid var(--faded-green)",
        paddingBottom: "0.75rem",
        marginBottom: "1.5rem",
      }}
    >
      <Link to="/" style={{ ...linkStyle, textDecoration: "none" }}>
        Terminal Quiz
      </Link>
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {session ? (
          <>
            <span style={{ color: "var(--light-grey)", fontSize: "0.8em" }}>
              {session.user.name}
            </span>
            <Link to="/programs/select" style={linkStyle}>
              Programs
            </Link>
            <button
              type="button"
              onClick={() => authClient.signOut()}
              style={{ padding: "0.25rem 0.75rem", fontSize: "0.8em" }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" style={linkStyle}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
