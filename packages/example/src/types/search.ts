export type SearchResult<TCategory = 'songs' | 'books' | 'movies'> = {
  title: string;
  href: string;
  category: TCategory;
};

export type GetSearchParams = Record<string, string>;
export type GetSearchResponse = SearchResult[];
