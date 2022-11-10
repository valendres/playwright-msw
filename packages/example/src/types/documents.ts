export type Document = {
  id: string;
  title: string;
};

export type GetDocumentsParams = {
  slug: string;
};

export type GetDocumentsResponse = Document[];
