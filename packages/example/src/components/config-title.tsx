import { FC, useEffect, useState } from 'react';

export const ConfigTitle: FC = () => {
  const [title, setTitle] = useState('Loading title');

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const response = await fetch('/config.json');
      const data = await response.json();
      setTitle(data.title);
    };

    void fetchData();
  }, []);

  return <h1>{title}</h1>;
};
