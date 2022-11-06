import { FC } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginForm } from './components/login-form';
import { UserProfile } from './components/user-profile';
import { UsersList } from './components/users-list';

const queryClient = new QueryClient();

const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/users/:userId" element={<UserProfile />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<LoginForm />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
