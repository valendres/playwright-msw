import { FC } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { UsersList } from "./components/users-list";

const queryClient = new QueryClient();

const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <UsersList />
    </QueryClientProvider>
  );
};

export default App;
