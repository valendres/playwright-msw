import { http, HttpResponse } from 'msw';
import { SearchResult } from '../../types/search';

const movies: SearchResult<'movies'>[] = [
  {
    title: 'The Godfather',
    href: 'https://www.imdb.com/title/tt0068646',
    category: 'movies',
  },
  {
    title: 'The Shawshank Redemption',
    href: 'https://www.imdb.com/title/tt0111161',
    category: 'movies',
  },
  {
    title: "Schindler's List",
    href: 'https://www.imdb.com/title/tt0108052',
    category: 'movies',
  },
];
const songs: SearchResult<'songs'>[] = [
  {
    title: 'Anti-hero - Taylor Swift',
    href: 'https://acharts.co/song/181965',
    category: 'songs',
  },
  {
    title: 'Lift Me Up - Rihanna',
    href: 'https://acharts.co/song/182133',
    category: 'songs',
  },
  {
    title: 'Unholy - Sam Smith and Kim Petras',
    href: 'https://acharts.co/song/181325',
    category: 'songs',
  },
];
const books: SearchResult<'books'>[] = [
  {
    title: 'The Hobbit - J.R.R. Tolkien',
    href: 'https://www.goodreads.com/book/show/26098210-the-hobbit',
    category: 'books',
  },
  {
    title: 'A Game of Thrones (A Song of Ice and Fire) - George R.R. Martin',
    href: 'https://www.goodreads.com/book/show/11059675-a-game-of-thrones',
    category: 'books',
  },
  {
    title: 'The Gunslinger (The Dark Tower) - Stephen King',
    href: 'https://www.goodreads.com/book/show/28253070-the-gunslinger',
    category: 'books',
  },
];

const allItems = [...movies, ...songs, ...books];
const categoryItemsMap = { movies, songs, books };

export default [
  http.get('/api/search', async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const cat = searchParams.get('c') as SearchResult['category'];
    const q = searchParams.get('q');
    const items = cat ? categoryItemsMap[cat] ?? [] : allItems;
    const searchResults =
      q && q.length > 0
        ? items.filter(({ title }) =>
            title.toLocaleLowerCase().includes(q.toLocaleLowerCase())
          )
        : items;

    return HttpResponse.json(searchResults);
  }),
];
