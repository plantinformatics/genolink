const PositionRangeFilter = ({ posStart, setPosStart, posEnd, setPosEnd }) => {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", margin: "10px 0 10px 0" }}>
      <input
        id="posStart"
        type="text"
        className="form-control"
        value={posStart}
        onChange={(e) => setPosStart(e.target.value)}
        placeholder="Start Position"
        style={{ width: "280px" }}
      />
      <input
        id="posEnd"
        type="text"
        className="form-control"
        value={posEnd}
        onChange={(e) => setPosEnd(e.target.value)}
        placeholder="End Position"
        style={{ width: "280px" }}
      />
    </div>
  );
};

export default PositionRangeFilter;
