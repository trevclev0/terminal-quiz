import styles from "./LoadingScreen.module.css";

type LoadingScreenProps = {
  message?: string;
};

export default function LoadingScreen({
  message = "Loading...",
}: LoadingScreenProps) {
  return <h2 className={styles.loadingScreen}>{message}</h2>;
}
