import { Routes, Route } from "react-router";
import "../styles/globals.css";
import Form from "./components/Form";
import Interview from "./components/Interview";

export function App() {
  const initialMessage =`Hello! Welcome to your technical interview room.`

  return (
    <Routes>
      <Route path="/" element={<Form />} />
      <Route path="/interview/:interviewId" element={<Interview/>} />
    </Routes>
  );
}

export default App;
