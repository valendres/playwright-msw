import { FC, useCallback, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { GetSearchResponse } from '../types/search';

const SearchResults: FC<{ searchParams: URLSearchParams }> = ({
  searchParams,
}) => {
  const searchQuery = useQuery<GetSearchResponse>(
    ['search', searchParams.toString()],
    async () => {
      const response = await fetch(`/api/search?${searchParams}`);
      return response.json();
    },
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!searchParams.get('q'),
    }
  );
  switch (searchQuery.status) {
    case 'idle':
      return <div>Enter a search query to get started</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'error':
      return <div>Failed to load search results</div>;
    case 'success':
      return searchQuery.data.length === 0 ? (
        <div>No search results found</div>
      ) : (
        <ol>
          {searchQuery.data.map(({ title, href, category }) => (
            <li key={href} className="search-result">
              <a href={href}>{title}</a> <i>({category})</i>
            </li>
          ))}
        </ol>
      );
  }
};

export const Search: FC = () => {
  const [currentSearchParams, setSearchParams] = useSearchParams();
  const handleFormChange = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      // Update query parameters without page reload from normal form submission
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      // type defs for `URLSearchParams` seem to not allow a FormData instance, even though its valid :(
      const newSearchParams = new URLSearchParams(formData as any);
      setSearchParams(newSearchParams);
    },
    [setSearchParams]
  );
  return (
    <div>
      <h1>Search engine</h1>
      <form onSubmit={handleFormChange}>
        <div>
          <div>
            <label htmlFor="q">Query*</label>
          </div>
          <input
            id="q"
            name="q"
            defaultValue={currentSearchParams.get('q') ?? ''}
            required
          />
        </div>
        <div>
          <div>
            <label htmlFor="cat">Category</label>
          </div>
          <select
            id="cat"
            name="cat"
            defaultValue={currentSearchParams.get('cat') ?? ''}
          >
            <option value="">All</option>
            <option value="books">Books</option>
            <option value="movies">Movies</option>
            <option value="songs">Songs</option>
          </select>
        </div>
        <br />
        <button type="submit">Search</button>
      </form>
      <br />
      <h2>Results</h2>
      <SearchResults searchParams={currentSearchParams} />
    </div>
  );
};
