const LoadingComponent = () => {
  return (
      <div style={{ display: "flex"}}>
          <div className="spinner-border text-primary" style={{width: "3rem", height: "3rem", marginRight: '10px'}} role="status">
          </div>
          <div style={{ fontSize: '24px' }}>Loading...</div>
      </div>
  );
};

export default LoadingComponent;
