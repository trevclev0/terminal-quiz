import { authClient } from "@api/authClient";
import { Link } from "@tanstack/react-router";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const { data: session } = authClient.useSession();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.homeLink}>
        Terminal Quiz
      </Link>
      <nav className={styles.nav}>
        {session ? (
          <>
            <span className={styles.userName}>{session.user.name}</span>
            <Link to="/programs/select" className={styles.link}>
              Programs
            </Link>
            <Link to="/programs/manage" className={styles.link}>
              My Programs
            </Link>
            <button
              type="button"
              onClick={() => authClient.signOut()}
              className={styles.logoutButton}
            >
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className={styles.link}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
