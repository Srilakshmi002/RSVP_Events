import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { RsvpPage } from "./pages/RsvpPage.jsx";
import { NotFoundPage, ThanksPage } from "./pages/ThanksPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/rsvp/:eventId" element={<RsvpPage />} />
          <Route path="/rsvp/:eventId/thank-you" element={<ThanksPage />} />
          <Route path="/hosts" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
