import styles from "./LoadingScreen.module.css";
import { Spinner } from "./Spinner";

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  return (
    <h2 className={styles.loadingScreen}>
      <Spinner />
      {message}
    </h2>
  );
}
