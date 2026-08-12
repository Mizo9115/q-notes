import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { BookmarksPage } from './pages/BookmarksPage';
import { NotesBrowserPage } from './pages/NotesBrowserPage';
import { ReaderPage } from './pages/ReaderPage';
import { SurahListPage } from './pages/SurahListPage';
import { TopicEditorPage } from './pages/TopicEditorPage';
import { TopicsPage } from './pages/TopicsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<SurahListPage />} />
          <Route path="surah/:id" element={<ReaderPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="notes" element={<NotesBrowserPage />} />
          <Route path="topics" element={<TopicsPage />} />
          <Route path="topics/new" element={<TopicEditorPage />} />
          <Route path="topics/:id" element={<TopicEditorPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
