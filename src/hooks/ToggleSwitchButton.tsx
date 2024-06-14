import React from 'react'
import styles from '../styles/inferenceSettings.module.css'

const ToggleSwitchButton2 = ({ option1Text, option2Text, isLocalMode, onChange }) => {
  const buttonWidth = Math.max(option1Text.length, option2Text.length) * 10 + 50; // 文字数に応じてボタンサイズを調整

  return (
    <div className={styles.container}>
      <div className={styles.toggle_buttons}>
        <div
          className={`${styles.toggle_button} ${isLocalMode ? styles.active : ''}`}
          style={{ width: buttonWidth }}
          onClick={() => onChange(true)}
        >
          <span className={styles.toggle_text}>{option1Text}</span>
        </div>
        <div
          className={`${styles.toggle_button} ${!isLocalMode ? styles.active : ''}`}
          style={{ width: buttonWidth }}
          onClick={() => onChange(false)}
        >
          <span className={styles.toggle_text}>{option2Text}</span>
        </div>
      </div>
    </div>
  );
};


export default ToggleSwitchButton2