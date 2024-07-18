import './App.css';
import NetworkGraph from "./component/NetworkGraph.jsx";

//use use effect if we need it after rendering everything


///////

function App() {

  return (
      <div className="Homepage">
        <h1>Network Chart</h1>
        <NetworkGraph/>
      </div>
  );
}

export default App;
