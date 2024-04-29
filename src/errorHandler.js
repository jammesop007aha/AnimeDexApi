import axios from 'axios';

interface SaveErrorProps {
  error: string;
}

const saveError = async ({ error }: SaveErrorProps): Promise<void> => {
  const url = 'https://worker-curly-math-37b8.techzbots1.workers.dev/rM8kBk5lzLropzqxZsaxc3L5ndgDzJ21t7lLreY5yG7sGRj2TH';

  try {
    await axios.post(url, { error: `from animedexapi: ${error}` });
  } catch (error) {
    console.error(`Error saving error to server: ${error}`);
  }
};

export default saveError;
