import LandingPage from "./component/Landing";
import { Routes,Route } from "react-router-dom";
import Login from "./component/Login";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login/>}/>
      </Routes>

    </>
  );
}

export default App;
