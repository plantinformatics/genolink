const PositionRangeFilter = ({ posStart, setPosStart, posEnd, setPosEnd }) => {
  return (
    <div className="container mt-5">
      <div className="mb-3">
        <label htmlFor="posStart" className="form-label">posStart:</label>
        <input
          id="posStart"
          type="text"
          className="form-control"
          value={posStart}
          onChange={(e) => setPosStart(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="posEnd" className="form-label">posEnd:</label>
        <input
          id="posEnd"
          type="text"
          className="form-control"
          value={posEnd}
          onChange={(e) => setPosEnd(e.target.value)}
        />
      </div>
    </div>
  );
};

export default PositionRangeFilter;
