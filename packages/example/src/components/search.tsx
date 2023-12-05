import { FC, useCallback, FormEvent, useState, ChangeEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { GetSearchResponse } from '../types/search';

const SearchResults: FC<{
  endpoint: string;
  searchParams: URLSearchParams;
}> = ({ endpoint, searchParams }) => {
  const searchQuery = useQuery<GetSearchResponse>(
    [endpoint, searchParams.toString()],
    async () => {
      const response = await fetch(`${endpoint}?${searchParams}`);
      return response.json();
    },
    {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: !!searchParams.get('q'),
    },
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
  const [endpoint, setEndpoint] = useState('/api/search');
  const [currentSearchParams, setSearchParams] = useSearchParams();
  const handleEndpointChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setEndpoint(event.currentTarget.value);
    },
    [],
  );
  const handleFormChange = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      // Update query parameters without page reload from normal form submission
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      // type defs for `URLSearchParams` seem to not allow a FormData instance, even though its valid :(
      const newSearchParams = new URLSearchParams({
        q: String(formData.get('q') ?? ''),
        c: String(formData.get('c') ?? ''),
      });
      setSearchParams(newSearchParams);
    },
    [setSearchParams],
  );
  return (
    <div>
      <select
        value={endpoint}
        onChange={handleEndpointChange}
        data-testid="endpoint"
        required
      >
        <option value="/api/search">/api/search</option>
        <option value="/api/search/">/api/search/</option>
        <option value="http://localhost:8080/api/search">
          http://localhost:8080/api/search
        </option>
      </select>
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
            <label htmlFor="c">Category</label>
          </div>
          <select
            id="c"
            name="c"
            defaultValue={currentSearchParams.get('c') ?? ''}
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
      <SearchResults endpoint={endpoint} searchParams={currentSearchParams} />
    </div>
  );
};
