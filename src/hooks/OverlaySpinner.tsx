import styles from '../styles/overlaySpinner.module.css'

export const OverlaySpinner = () => {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner}></div>
    </div>
  );
};