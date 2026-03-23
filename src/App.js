// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Userlists from './pages/Userlists';
import Userinput from './pages/UserInput';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Userlists />} />
        <Route path="/add" element={<Userinput />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;