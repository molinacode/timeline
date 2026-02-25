# Timeline Project Frontend

This project was bootstrapped with [Vite](https://vitejs.dev/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), and [rss-parser](https://www.npmjs.com/package/rss-parser).

## Available Scripts

In the project directory, you can run:

### `npm run dev`
Runs the app in the development mode.\

### `npm run build`
Builds the app for production to the `dist` folder.\

### `npm run preview`
Locally previews the production build.

## Tech Stack

- **Node.js**: JavaScript runtime environment
- **Vite**: Next-generation frontend tooling
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **rss-parser**: Library for parsing RSS feeds

## Usage Examples

### Using Tailwind CSS
You can use Tailwind classes directly in your JSX:
```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Hello Tailwind!
</div>
```

### Parsing RSS Feeds
```typescript
import Parser from 'rss-parser';

const parser = new Parser();

const feed = await parser.parseURL('https://example.com/rss.xml');
console.log(feed.title);
console.log(feed.items);
```

## Project Structure
- `/src` - Source code
- `/src/components` - Reusable React components
- `/src/features` - Feature-specific code
- `/src/types` - TypeScript type definitions
- `index.html` - Main HTML file
- `vite.config.mts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `tsconfig.json` - TypeScript configuration