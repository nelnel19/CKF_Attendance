// src/App.js
import { HashRouter, Routes, Route } from 'react-router-dom';
import Userlists from './pages/Userlists';
import Userinput from './pages/UserInput';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Userlists />} />
        <Route path="/add" element={<Userinput />} />
      </Routes>
    </HashRouter>
  );
}

export default App;