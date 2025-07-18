import styles from "./PositionRangeFilter.module.css";

const PositionRangeFilter = ({ posStart, setPosStart, posEnd, setPosEnd }) => {
  return (
    <div className={styles.container}>
      <input
        id="posStart"
        type="text"
        className={`${styles.formControl} ${styles.input} ${styles.posWidth}`}
        value={posStart}
        onChange={(e) => setPosStart(e.target.value)}
        placeholder="Start Position"
      />
      <input
        id="posEnd"
        type="text"
        className={`${styles.formControl} ${styles.input} ${styles.posWidth}`}
        value={posEnd}
        onChange={(e) => setPosEnd(e.target.value)}
        placeholder="End Position"
      />
    </div>
  );
};

export default PositionRangeFilter;
