const PositionRangeFilter = ({ posStart, setPosStart, posEnd, setPosEnd }) => {
  return (
    <div>
      <div>
        <br/>
        <label htmlFor="posStart" className="form-label">Start:</label>
        <input
          id="posStart"
          type="text"
          className="form-control"
          value={posStart}
          onChange={(e) => setPosStart(e.target.value)}
          placeholder="Start Position"
          style={{width:"280px", marginBottom:"10px"}}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="posEnd" className="form-label">End:</label>
        <input
          id="posEnd"
          type="text"
          className="form-control"
          value={posEnd}
          onChange={(e) => setPosEnd(e.target.value)}
          placeholder="End Position"
          style={{width:"280px"}}
        />
      </div>
    </div>
  );
};

export default PositionRangeFilter;
