import { ChangeEvent, FC, useCallback } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { GetDocumentsResponse } from '../types/documents';

const DocumentsList: FC<{ slug: string }> = ({ slug }) => {
  const { data, status } = useQuery<GetDocumentsResponse>(
    ['documents', slug],
    async () => {
      const response = await fetch(`/api/documents/${slug}`);
      return await response.json();
    },
    { retry: false, enabled: !!slug },
  );

  if (status === 'loading' || status === 'idle') {
    return <div>Loading documents...</div>;
  }

  if (status === 'error') {
    return <div>Failed to load documents!</div>;
  }

  return (
    <ol>
      {(data ?? []).map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ol>
  );
};

export const Documents: FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const handleSlugSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      navigate(`/documents/${event.currentTarget.value}`);
    },
    [],
  );
  return (
    <div>
      <h1>Documents</h1>
      <div>
        <form>
          <label htmlFor="slug">Slug</label>
          <select
            id="slug"
            name="slug"
            value={slug}
            onChange={handleSlugSelectChange}
          >
            <option value=""></option>
            <option value="months">Months</option>
            <option value="secret">Secret</option>
            <option value="test">Test</option>
          </select>
        </form>
      </div>
      {slug ? (
        <DocumentsList slug={slug} />
      ) : (
        <div>Select a slug to get started</div>
      )}
    </div>
  );
};
