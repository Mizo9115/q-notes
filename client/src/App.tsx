import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { NotesBrowserPage } from './pages/NotesBrowserPage';
import { ReaderPage } from './pages/ReaderPage';
import { SurahListPage } from './pages/SurahListPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<SurahListPage />} />
          <Route path="surah/:id" element={<ReaderPage />} />
          <Route path="notes" element={<NotesBrowserPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
