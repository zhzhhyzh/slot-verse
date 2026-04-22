import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CreditProvider } from './context/CreditContext';
import { Header } from './components/Header';
import { Lobby } from './pages/Lobby';
import { GamePage } from './pages/GamePage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CreditProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/game/:gameId" element={<GamePage />} />
        </Routes>
      </CreditProvider>
    </BrowserRouter>
  );
}

export default App;
