import { HashRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Userlists from './pages/Userlists';
import Userinput from './pages/UserInput';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/userlists" element={<Userlists />} />
        <Route path="/add" element={<Userinput />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
